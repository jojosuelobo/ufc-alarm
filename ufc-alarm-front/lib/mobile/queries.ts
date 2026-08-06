import "server-only";
import db from "@/lib/db";
import { ALARM_LIVE_WINDOW_POST_HOURS, getLiveWindowBounds } from "@/lib/shared/alarmWindow";

export interface ToggleDeviceAlarmInput {
  deviceId: string;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  boutId: string;
  weightClass?: string;
  fighterRedName: string;
  fighterBlueName: string;
}

export interface DeviceAlarmListItem {
  id: number;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  boutId: string;
  weightClass: string | null;
  fighterRedName: string;
  fighterBlueName: string;
}

interface DeviceAlarmRow {
  id: number;
  event_slug: string;
  event_title: string;
  event_starts_at: string | null;
  bout_id: string;
  weight_class: string | null;
  fighter_red_name: string;
  fighter_blue_name: string;
}

interface AlarmIdRow {
  id: number;
}

/**
 * Upserts a device's push registration. Called on first app launch and on
 * every FCM token refresh — a device with no alarms yet can still register
 * so the token is ready the moment the user creates their first alarm.
 */
export function upsertDevice(
  deviceId: string,
  fcmToken: string | null,
  platform: string = "android",
): void {
  db.prepare(
    `INSERT INTO devices (device_id, fcm_token, platform, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(device_id) DO UPDATE SET
       fcm_token = excluded.fcm_token,
       platform = excluded.platform,
       updated_at = datetime('now')`,
  ).run(deviceId, fcmToken, platform);
}

/**
 * Creates the alarm if it doesn't exist yet, deletes it if it does — same
 * single-toggle UX as the web bell button (lib/alarms/actions.ts), just
 * keyed by device_id instead of user_id and with no login/phone gate.
 */
export function toggleDeviceAlarm(input: ToggleDeviceAlarmInput): { active: boolean } {
  const existing = db
    .prepare(`SELECT id FROM device_alarms WHERE device_id = ? AND event_slug = ? AND bout_id = ?`)
    .get(input.deviceId, input.eventSlug, input.boutId) as AlarmIdRow | undefined;

  if (existing) {
    db.prepare(`DELETE FROM device_alarms WHERE id = ?`).run(existing.id);
    return { active: false };
  }

  db.prepare(
    `INSERT INTO device_alarms
      (device_id, event_slug, bout_id, event_title, event_starts_at, weight_class, fighter_red_name, fighter_blue_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.deviceId,
    input.eventSlug,
    input.boutId,
    input.eventTitle,
    input.eventStartsAt,
    input.weightClass ?? null,
    input.fighterRedName,
    input.fighterBlueName,
  );
  return { active: true };
}

/**
 * Deletes an alarm, scoped by device_id as well as id — so one device can't
 * delete another device's alarm just by guessing a sequential integer id.
 * Returns whether a row was actually deleted.
 */
export function deleteDeviceAlarm(alarmId: number, deviceId: string): boolean {
  const result = db
    .prepare(`DELETE FROM device_alarms WHERE id = ? AND device_id = ?`)
    .run(alarmId, deviceId);
  return result.changes > 0;
}

/**
 * Same prune-then-list pattern as getActiveAlarmsForUser (lib/alarms/queries.ts):
 * opportunistically deletes alarms whose event is old enough that even a
 * late-running card must be over, then returns what's left.
 */
export function getActiveDeviceAlarms(deviceId: string): DeviceAlarmListItem[] {
  const cutoff = new Date(
    Date.now() - ALARM_LIVE_WINDOW_POST_HOURS * 60 * 60 * 1000,
  ).toISOString();
  db.prepare(
    `DELETE FROM device_alarms WHERE device_id = ? AND event_starts_at IS NOT NULL AND event_starts_at < ?`,
  ).run(deviceId, cutoff);

  const rows = db
    .prepare(
      `SELECT id, event_slug, event_title, event_starts_at, bout_id, weight_class, fighter_red_name, fighter_blue_name
       FROM device_alarms
       WHERE device_id = ?
       ORDER BY event_starts_at IS NULL, event_starts_at ASC`,
    )
    .all(deviceId) as DeviceAlarmRow[];

  return rows.map((row) => ({
    id: row.id,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    eventStartsAt: row.event_starts_at,
    boutId: row.bout_id,
    weightClass: row.weight_class,
    fighterRedName: row.fighter_red_name,
    fighterBlueName: row.fighter_blue_name,
  }));
}

/**
 * Reference implementation only — the standalone worker (scripts/mobile-alarm-worker.ts)
 * cannot import this module (it's guarded by "server-only") and keeps its own
 * copy of this exact query against its own better-sqlite3 connection. Kept
 * here too so the SQL shape is documented next to the schema it reads, and in
 * case a future in-process (Next.js route) consumer needs the same read.
 */
export interface DeviceAlarmWithToken extends DeviceAlarmListItem {
  deviceId: string;
  fcmToken: string;
}

interface DeviceAlarmWithTokenRow extends DeviceAlarmRow {
  device_id: string;
  fcm_token: string;
}

export function getDeviceAlarmsInLiveWindow(now: Date): DeviceAlarmWithToken[] {
  const { windowStartIso, windowEndIso } = getLiveWindowBounds(now);
  const rows = db
    .prepare(
      `SELECT da.id, da.device_id, da.event_slug, da.event_title, da.event_starts_at,
              da.bout_id, da.weight_class, da.fighter_red_name, da.fighter_blue_name,
              d.fcm_token
       FROM device_alarms da
       JOIN devices d ON d.device_id = da.device_id
       WHERE da.notified_at IS NULL
         AND d.fcm_token IS NOT NULL
         AND da.event_starts_at IS NOT NULL
         AND da.event_starts_at >= ?
         AND da.event_starts_at <= ?`,
    )
    .all(windowStartIso, windowEndIso) as DeviceAlarmWithTokenRow[];

  return rows.map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    fcmToken: row.fcm_token,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    eventStartsAt: row.event_starts_at,
    boutId: row.bout_id,
    weightClass: row.weight_class,
    fighterRedName: row.fighter_red_name,
    fighterBlueName: row.fighter_blue_name,
  }));
}

export function markDeviceAlarmNotified(alarmId: number): void {
  db.prepare(`UPDATE device_alarms SET notified_at = datetime('now') WHERE id = ?`).run(alarmId);
}
