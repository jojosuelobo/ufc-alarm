/**
 * Grace window (hours) after event_starts_at during which an alarm is still
 * considered "possibly live" — covers a full UFC card, early prelims through
 * main event (~6-7h typical). Used both to decide when a stale alarm gets
 * pruned and when it's worth polling Cito for live status.
 *
 * No "server-only" import here on purpose: this module is shared between the
 * Next.js app (lib/alarms/constants.ts re-exports it) and the standalone
 * mobile-alarm-worker script, which runs outside the Next.js runtime and
 * cannot import anything guarded by server-only.
 */
export const ALARM_LIVE_WINDOW_POST_HOURS = 8;

/**
 * How early before event_starts_at a Cito live-status check becomes
 * "worth it". event_starts_at is one timestamp per event (the official/
 * main-card start), shared by every bout's alarm row — but early prelims
 * can go live hours before that time. 15 min was too tight: a fight already
 * live at, say, 40 min before the listed start fell outside the window, so
 * the alarm's live-status check never even fired and its push never sent.
 * 240 min (4h) comfortably covers early prelims + prelims ahead of the
 * main card on a full UFC event.
 */
export const ALARM_LIVE_WINDOW_PRE_MINUTES = 240;

/**
 * Bounds on event_starts_at (not on "now") that together are equivalent to
 * "now falls within [event_starts_at - PRE_MINUTES, event_starts_at + POST_HOURS]"
 * for some row's own event_starts_at. Rearranging that inequality isolates
 * event_starts_at between (now - POST_HOURS) and (now + PRE_MINUTES), which
 * is what lets a single indexed SQL range query
 * (`event_starts_at >= ? AND event_starts_at <= ?`) find every alarm
 * currently in its live window without evaluating the window per-row in JS.
 */
export function getLiveWindowBounds(now: Date): { windowStartIso: string; windowEndIso: string } {
  const windowStart = new Date(now.getTime() - ALARM_LIVE_WINDOW_POST_HOURS * 3_600_000);
  const windowEnd = new Date(now.getTime() + ALARM_LIVE_WINDOW_PRE_MINUTES * 60_000);
  return { windowStartIso: windowStart.toISOString(), windowEndIso: windowEnd.toISOString() };
}
