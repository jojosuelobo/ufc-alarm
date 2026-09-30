/**
 * Standalone background worker for anonymous mobile alarms.
 *
 * Runs as its own long-lived process (see docker-compose.yml's `worker`
 * service), separate from the Next.js `web` process, because Next.js route
 * handlers only run in response to a request and can't host a persistent
 * polling loop. Every tick (MOBILE_ALARM_WORKER_INTERVAL_MS) it looks at
 * every device_alarm that hasn't fired yet, but only actually calls Cito as
 * often as its event's proximity to go-live warrants — dormant (days/weeks
 * out) events are checked once an hour just to notice card changes, warm
 * (1-4h out) events every few minutes, and hot (<1h out through the
 * post-event grace window) events on every tick, since a bout could go live
 * any moment. This keeps quota usage low for events nobody's about to watch
 * yet without ever going fully silent on them. See tierFor/tick below.
 *
 * Cannot import lib/db.ts or lib/mobile/queries.ts directly — they're
 * guarded by `import "server-only"`, which throws outside the Next.js
 * request-rendering context. This file has a deliberate, minimal duplicate
 * of just what the worker needs from lib/db.ts. lib/shared/alarmWindow.ts
 * and lib/shared/citoLiveFetch.ts have no such guard and ARE shared
 * directly with the Next.js app (which re-exports the latter, with the
 * guard, from lib/live/citoLiveClient.ts).
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { ALARM_LIVE_WINDOW_POST_HOURS, ALARM_LIVE_WINDOW_PRE_MINUTES } from "../lib/shared/alarmWindow";
import { findLiveTrackingByFighterNames, getLiveEventStatus } from "../lib/shared/citoLiveFetch";

// --- Minimal .env.local loader -------------------------------------------
// Next.js auto-loads .env.local for the `web` process; this standalone
// script does not go through Next's tooling, so do the equivalent by hand
// for local (non-Docker) runs. In Docker, docker-compose's `env_file:` does
// this instead and the .env.local file won't exist in the image, so this is
// a no-op there.
function loadDotEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadDotEnvLocal();

// --- DB --------------------------------------------------------------------
// Same DB_PATH resolution as lib/db.ts, own connection (this is a separate
// process, so there's no globalThis hot-reload singleton concern). Creates
// the mobile tables with IF NOT EXISTS so the worker can start before or
// after the `web` process without caring about ordering.
const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "app.db");
fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS devices (
  device_id     TEXT PRIMARY KEY,
  fcm_token     TEXT,
  platform      TEXT NOT NULL DEFAULT 'android',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS device_alarms (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id          TEXT NOT NULL,
  event_slug         TEXT NOT NULL,
  bout_id            TEXT NOT NULL,
  event_title        TEXT NOT NULL,
  event_starts_at    TEXT,
  weight_class       TEXT,
  fighter_red_name   TEXT NOT NULL,
  fighter_blue_name  TEXT NOT NULL,
  notified_at        TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (device_id, event_slug, bout_id)
);
CREATE INDEX IF NOT EXISTS idx_device_alarms_device ON device_alarms(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alarms_live_window ON device_alarms(event_starts_at, notified_at);
`);

interface DueAlarmRow {
  id: number;
  device_id: string;
  fcm_token: string;
  event_slug: string;
  bout_id: string;
  event_title: string;
  event_starts_at: string;
  weight_class: string | null;
  fighter_red_name: string;
  fighter_blue_name: string;
}

// Only a lower bound on event_starts_at (events that ended too long ago to
// still be worth checking) — no upper bound. A dormant alarm set weeks
// ahead of its event is still cheap to pull out of SQLite; tick()'s tiering
// is what keeps far-future events from costing a real Cito call on every
// tick, so there's no need to also hide them from this query.
function getDueAlarms(now: Date): DueAlarmRow[] {
  const windowStartIso = new Date(
    now.getTime() - ALARM_LIVE_WINDOW_POST_HOURS * 3_600_000,
  ).toISOString();
  return db
    .prepare(
      `SELECT da.id, da.device_id, d.fcm_token, da.event_slug, da.bout_id,
              da.event_title, da.event_starts_at, da.weight_class,
              da.fighter_red_name, da.fighter_blue_name
       FROM device_alarms da
       JOIN devices d ON d.device_id = da.device_id
       WHERE da.notified_at IS NULL
         AND d.fcm_token IS NOT NULL
         AND da.event_starts_at IS NOT NULL
         AND da.event_starts_at >= ?`,
    )
    .all(windowStartIso) as DueAlarmRow[];
}

function markNotified(alarmId: number): void {
  db.prepare(`UPDATE device_alarms SET notified_at = datetime('now') WHERE id = ?`).run(alarmId);
}

function clearDeadToken(deviceId: string): void {
  db.prepare(`UPDATE devices SET fcm_token = NULL WHERE device_id = ?`).run(deviceId);
}

// --- Firebase Admin ----------------------------------------------------
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  console.error(
    "FIREBASE_SERVICE_ACCOUNT_PATH não configurada — o worker não conseguirá enviar pushes.",
  );
} else {
  initializeApp({ credential: cert(serviceAccountPath) });
}

async function sendAlarmPush(alarm: DueAlarmRow): Promise<void> {
  try {
    await getMessaging().send({
      token: alarm.fcm_token,
      // Data-only: no `notification` block. This ensures both the
      // foreground (onMessage) and background/terminated (onBackgroundMessage)
      // handlers in the Flutter app fire and build the full-screen, looping
      // alarm-style notification themselves via flutter_local_notifications,
      // instead of FCM auto-displaying a plain system-tray notification that
      // can't do full-screen-intent or looping sound.
      data: {
        type: "alarm_live",
        alarmId: String(alarm.id),
        eventTitle: alarm.event_title,
        fighterRedName: alarm.fighter_red_name,
        fighterBlueName: alarm.fighter_blue_name,
        weightClass: alarm.weight_class ?? "",
      },
      android: { priority: "high" },
    });
    markNotified(alarm.id);
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    if (code === "messaging/registration-token-not-registered") {
      // Token is dead (app uninstalled / reinstalled) — clear it so future
      // ticks skip this device cheaply instead of retrying every minute.
      clearDeadToken(alarm.device_id);
      return;
    }
    console.error(`Falha ao enviar push do alarme ${alarm.id}:`, error);
  }
}

// --- Dev-only forced-live testing aid -----------------------------------
// Parallel to DEV_FORCE_LIVE_ALARM_IDS (web, lib/live/alarmLiveStatus.ts) but
// for device_alarms ids. Hard-gated behind NODE_ENV — never fires in
// production, no-op unless explicitly set.
function getForcedLiveIds(): Set<number> {
  if (process.env.NODE_ENV === "production" || !process.env.DEV_FORCE_LIVE_DEVICE_ALARM_IDS) {
    return new Set();
  }
  return new Set(
    process.env.DEV_FORCE_LIVE_DEVICE_ALARM_IDS.split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id)),
  );
}

// How long before an event's advertised start a slug goes "hot" — poll
// every tick, since a bout could go live any moment. Once hot, a slug stays
// hot through the rest of its due window (getDueAlarms already caps that at
// ALARM_LIVE_WINDOW_POST_HOURS after start) — we only need to ease off
// before start, not after.
const HOT_WINDOW_PRE_MS = 60 * 60_000;

// Below HOT but within ALARM_LIVE_WINDOW_PRE_MINUTES (the same "early
// prelims can start hours early" boundary getDueAlarms/getLiveWindowBounds
// already use elsewhere) a slug is "warm" — the event isn't close enough to
// be worth tick-by-tick polling, but is close enough that it's worth
// checking every few minutes.
const WARM_WINDOW_PRE_MS = ALARM_LIVE_WINDOW_PRE_MINUTES * 60_000;
const WARM_POLL_INTERVAL_MS =
  Number(process.env.MOBILE_ALARM_WORKER_WARM_INTERVAL_MS) || 5 * 60_000;

// Beyond that, a slug is "dormant" — days or weeks out, nothing is live and
// nothing will be for a while, but we still check once in a while so a
// card change (a bout pulled, a fighter swapped) doesn't sit undetected for
// the entire dormant period.
const DORMANT_POLL_INTERVAL_MS =
  Number(process.env.MOBILE_ALARM_WORKER_DORMANT_INTERVAL_MS) || 60 * 60_000;

type PollTier = "hot" | "warm" | "dormant";

function tierFor(eventStartsAtIso: string, now: Date): PollTier {
  const msToStart = new Date(eventStartsAtIso).getTime() - now.getTime();
  if (msToStart <= HOT_WINDOW_PRE_MS) return "hot";
  if (msToStart <= WARM_WINDOW_PRE_MS) return "warm";
  return "dormant";
}

const POLL_INTERVAL_MS_BY_TIER: Record<Exclude<PollTier, "hot">, number> = {
  warm: WARM_POLL_INTERVAL_MS,
  dormant: DORMANT_POLL_INTERVAL_MS,
};

// Per-slug timestamp of the last real Cito call, kept in memory for the
// life of this long-running process — resets on redeploy, which just means
// the first tick after a restart treats every non-hot slug as due again.
const lastCitoCallAtBySlug = new Map<string, number>();

async function tick(): Promise<void> {
  const now = new Date();
  const due = getDueAlarms(now);
  if (due.length === 0) return;

  const forcedIds = getForcedLiveIds();
  const forced = due.filter((alarm) => forcedIds.has(alarm.id));
  const needsRealCheck = due.filter((alarm) => !forcedIds.has(alarm.id));

  await Promise.all(forced.map(sendAlarmPush));

  const alarmsBySlug = new Map<string, DueAlarmRow[]>();
  for (const alarm of needsRealCheck) {
    const list = alarmsBySlug.get(alarm.event_slug);
    if (list) {
      list.push(alarm);
    } else {
      alarmsBySlug.set(alarm.event_slug, [alarm]);
    }
  }

  // Every alarm for a slug shares that event's single event_starts_at, so
  // the tier and its cooldown are decided once per slug, not per row.
  const slugsToCheck = [...alarmsBySlug.entries()]
    .filter(([slug, alarms]) => {
      const tier = tierFor(alarms[0].event_starts_at, now);
      if (tier === "hot") return true;
      const lastCall = lastCitoCallAtBySlug.get(slug) ?? 0;
      return now.getTime() - lastCall >= POLL_INTERVAL_MS_BY_TIER[tier];
    })
    .map(([slug]) => slug);

  for (const slug of slugsToCheck) {
    lastCitoCallAtBySlug.set(slug, now.getTime());
  }

  const statusBySlug = new Map(
    await Promise.all(
      slugsToCheck.map(async (slug) => [slug, await getLiveEventStatus(slug)] as const),
    ),
  );

  for (const [slug, alarms] of alarmsBySlug) {
    if (!statusBySlug.has(slug)) continue; // not due for a refresh at its current tier yet

    const eventData = statusBySlug.get(slug);
    for (const alarm of alarms) {
      const bout = findLiveTrackingByFighterNames(
        eventData?.tracking,
        alarm.fighter_red_name,
        alarm.fighter_blue_name,
      );
      if (bout?.status === "live") {
        await sendAlarmPush(alarm);
      }
    }
  }
}

const INTERVAL_MS = Number(process.env.MOBILE_ALARM_WORKER_INTERVAL_MS) || 60_000;

async function loop(): Promise<void> {
  for (;;) {
    try {
      await tick();
    } catch (error) {
      // Fail-soft, same philosophy as lib/live/citoLiveClient.ts — a bad
      // tick logs and the process keeps running instead of crashing.
      console.error("mobile-alarm-worker tick falhou:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

console.log(`mobile-alarm-worker iniciado (intervalo: ${INTERVAL_MS}ms)`);
loop();
