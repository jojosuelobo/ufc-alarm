/**
 * Grace window (hours) after event_starts_at during which an alarm is still
 * considered "possibly live" — covers a full UFC card, early prelims through
 * main event (~6-7h typical). Used both to decide when a stale alarm gets
 * pruned (lib/alarms/queries.ts) and when it's worth polling Cito for live
 * status (lib/live/alarmLiveStatus.ts). Keep these two usages on this one
 * constant so they can never drift out of sync.
 */
export const ALARM_LIVE_WINDOW_POST_HOURS = 8;

/** How early before event_starts_at a Cito live-status check becomes "worth it". */
export const ALARM_LIVE_WINDOW_PRE_MINUTES = 15;
