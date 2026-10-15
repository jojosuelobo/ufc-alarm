/**
 * Dana White's Contender Series is permanently excluded, everywhere — unlike
 * Road to UFC (gated behind the "exibir eventos extras" account/device
 * toggle), DWCS cards never show up in listings or detail pages and are
 * never polled for live status, no matter who's asking or what their
 * extra-events preference is set to.
 *
 * No "server-only" guard on purpose: shared between the Next.js app (via
 * lib/api/events.ts) and the standalone mobile-alarm-worker
 * (scripts/mobile-alarm-worker.ts), which runs outside Next's runtime and
 * can't import anything guarded by server-only.
 */
const DWCS_PATTERN = /dana white'?s contender series/i;

export function isDwcsEvent(title: string): boolean {
  return DWCS_PATTERN.test(title);
}
