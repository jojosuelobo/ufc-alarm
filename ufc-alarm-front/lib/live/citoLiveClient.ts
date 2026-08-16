import "server-only";

const CITO_BASE_URL = "https://api.citoapi.com";

/**
 * How long a cached live-status result for one event is trusted before a
 * fresh Cito call is made. This is a manual cache (not Next's fetch
 * revalidate) shared across every request that hits this module, so N
 * concurrent users/tabs polling the same event still cost one Cito call per
 * TTL window, not N. Deliberately conservative — Cito's free tier is only
 * 500 requests/month, and a single fully-monitored event window (~8h15) at
 * this TTL costs on the order of a few hundred requests worst case.
 */
const CITO_LIVE_STATUS_TTL_MS = 90_000;

export interface CitoLiveBoutTracking {
  entity_type: string;
  /** Prefixed with "ufc-" — do NOT match this against alarms.bout_id. */
  boutId: string;
  /** Matches alarms.bout_id (the plain Cito bout id) — match on this. */
  fightMetricId: string;
  status: string;
  currentRound?: number;
  currentTime?: string;
  red?: { fighterName: string; fighterSlug: string; outcome?: string | null };
  blue?: { fighterName: string; fighterSlug: string; outcome?: string | null };
}

export interface CitoLiveEventData {
  eventSlug: string;
  status: string;
  recommendedPollSeconds?: number;
  tracking: CitoLiveBoutTracking[];
}

interface CitoLiveEventResponse {
  success: boolean;
  data: CitoLiveEventData;
}

interface CacheEntry {
  fetchedAt: number;
  data: CitoLiveEventData | null;
}

declare global {
  var __ufcAlarmLiveCache: Map<string, CacheEntry> | undefined;
}

const cache: Map<string, CacheEntry> = globalThis.__ufcAlarmLiveCache ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalThis.__ufcAlarmLiveCache = cache;
}

/**
 * Fetches (and shares, via the module-scoped TTL cache above) live tracking
 * status for one event. Fail-soft: never throws — any error (missing key,
 * network failure, non-2xx, bad JSON) resolves to the last known-good cached
 * value, or null if there isn't one, so a Cito outage degrades the poll
 * loop's answers instead of breaking it. This also acts as an implicit
 * backoff: a failure only gets retried once per TTL window, not hammered.
 */
export async function getLiveEventStatus(eventSlug: string): Promise<CitoLiveEventData | null> {
  const cached = cache.get(eventSlug);
  if (cached && Date.now() - cached.fetchedAt < CITO_LIVE_STATUS_TTL_MS) {
    return cached.data;
  }

  const fallback = cached?.data ?? null;

  const apiKey = process.env.CITO_API_KEY;
  if (!apiKey) {
    console.error("CITO_API_KEY não configurada — status ao vivo indisponível.");
    cache.set(eventSlug, { fetchedAt: Date.now(), data: fallback });
    return fallback;
  }

  try {
    const res = await fetch(`${CITO_BASE_URL}/api/v1/ufc/live/events/${eventSlug}`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Cito live status ${eventSlug}: HTTP ${res.status}`);
      cache.set(eventSlug, { fetchedAt: Date.now(), data: fallback });
      return fallback;
    }

    const json = (await res.json()) as CitoLiveEventResponse;
    cache.set(eventSlug, { fetchedAt: Date.now(), data: json.data });
    return json.data;
  } catch (error) {
    console.error(`Cito live status ${eventSlug} falhou:`, error);
    cache.set(eventSlug, { fetchedAt: Date.now(), data: fallback });
    return fallback;
  }
}
