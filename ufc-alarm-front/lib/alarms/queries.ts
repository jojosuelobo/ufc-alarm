import "server-only";
import db from "@/lib/db";
import { ALARM_LIVE_WINDOW_POST_HOURS } from "./constants";

interface AlarmBoutIdRow {
  bout_id: string;
}

export function getActiveAlarmBoutIds(userId: number, eventSlug: string): Set<string> {
  const rows = db
    .prepare(`SELECT bout_id FROM alarms WHERE user_id = ? AND event_slug = ?`)
    .all(userId, eventSlug) as AlarmBoutIdRow[];
  return new Set(rows.map((r) => r.bout_id));
}

export interface AlarmListItem {
  id: number;
  eventSlug: string;
  eventTitle: string;
  eventStartsAt: string | null;
  boutId: string;
  weightClass: string | null;
  fighterRedName: string;
  fighterBlueName: string;
}

interface AlarmRow {
  id: number;
  event_slug: string;
  event_title: string;
  event_starts_at: string | null;
  bout_id: string;
  weight_class: string | null;
  fighter_red_name: string;
  fighter_blue_name: string;
}

/**
 * Opportunistically prunes alarms whose event happened long enough ago that
 * even a late-running card must be over, before listing what's left — this
 * is the whole "alarm disappears once the fight has passed" behavior, no
 * separate cleanup job needed. Rows with an unknown (null) event date are
 * never auto-deleted.
 *
 * The cutoff is `event_starts_at` (roughly when the card/broadcast begins,
 * not the marked bout's own start) plus a grace window, not the moment the
 * card starts — a marked bout (e.g. the main event) can happen hours after
 * `event_starts_at`, so pruning right at `event_starts_at` would delete the
 * alarm before the fight it's for has even happened.
 */
export function getActiveAlarmsForUser(userId: number): AlarmListItem[] {
  const cutoff = new Date(
    Date.now() - ALARM_LIVE_WINDOW_POST_HOURS * 60 * 60 * 1000,
  ).toISOString();
  db.prepare(
    `DELETE FROM alarms WHERE user_id = ? AND event_starts_at IS NOT NULL AND event_starts_at < ?`,
  ).run(userId, cutoff);

  const rows = db
    .prepare(
      `SELECT id, event_slug, event_title, event_starts_at, bout_id, weight_class, fighter_red_name, fighter_blue_name
       FROM alarms
       WHERE user_id = ?
       ORDER BY event_starts_at IS NULL, event_starts_at ASC`,
    )
    .all(userId) as AlarmRow[];

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
