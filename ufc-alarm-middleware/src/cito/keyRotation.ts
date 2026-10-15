import { config } from "../config.js";
import { notifyAllKeysExhausted, notifyKeyBlocked } from "../discord.js";

// 0 = not blocked. Set to a future timestamp the moment a key draws a 429,
// cleared immediately the moment it succeeds — so a key that recovers mid-
// cooldown (quota reset lands before the window is back) isn't kept idle
// any longer than necessary.
const blockedUntil = new Map<string, number>(config.citoApiKeys.map((k) => [k, 0]));

// Tracks whether the "all keys exhausted" Discord alert has already fired
// for the current outage, so we page once per outage instead of once per
// request while every key stays blocked (see getKeyOrder's fallback below).
let allKeysExhaustedAlertSent = false;

function isBlocked(key: string, now: number): boolean {
  return (blockedUntil.get(key) ?? 0) > now;
}

export function markKeyBlocked(key: string): void {
  const now = Date.now();
  const wasBlocked = isBlocked(key, now);
  blockedUntil.set(key, now + config.citoKeyRotationIntervalMs);

  if (!wasBlocked) {
    notifyKeyBlocked(key);
  }

  const allBlocked = config.citoApiKeys.every((k) => isBlocked(k, now));
  if (allBlocked && !allKeysExhaustedAlertSent) {
    allKeysExhaustedAlertSent = true;
    notifyAllKeysExhausted();
  }
}

export function markKeyAvailable(key: string): void {
  blockedUntil.set(key, 0);
  allKeysExhaustedAlertSent = false;
}

/**
 * Order to try keys in for one Cito request. Round-robins which key is
 * "primary" across fixed time windows (config.citoKeyRotationIntervalMs,
 * default 1h) instead of always starting from key 0 — spreads traffic
 * evenly across every configured Cito account so no single one racks up
 * enough 429s in a row to risk Cito blocking it outright, the way always
 * hammering the same key until it ran dry used to.
 *
 * Keys known to be currently rate-limited (see markKeyBlocked) are skipped
 * entirely and only reconsidered once their cooldown — one rotation window
 * — has passed, rather than being retried on every single request while
 * still exhausted. If every key is blocked, falls back to the full rotation
 * order anyway: the local blocked-state is a best-effort cache, not
 * authoritative (we don't actually know Cito's reset schedule), so it's
 * better to keep probing than to hard-fail requests for an entire window.
 */
export function getKeyOrder(): string[] {
  const keys = config.citoApiKeys;
  const now = Date.now();
  const slot = Math.floor(now / config.citoKeyRotationIntervalMs);
  const primaryIndex = slot % keys.length;
  const rotated = [...keys.slice(primaryIndex), ...keys.slice(0, primaryIndex)];

  const available = rotated.filter((k) => !isBlocked(k, now));
  return available.length > 0 ? available : rotated;
}
