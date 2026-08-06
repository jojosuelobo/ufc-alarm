const CITO_BASE_URL = "https://api.citoapi.com";
const CITO_LIVE_STATUS_TTL_MS = 90_000;

export interface CitoLiveBoutTracking {
  entity_type: string;
  /** Prefixed with "ufc-" — do NOT match this against device_alarms.bout_id. */
  boutId: string;
  /** Matches device_alarms.bout_id (the plain Cito bout id) — match on this. */
  fightMetricId: string;
  status: string;
  currentRound?: number;
  currentTime?: string;
  red?: { fighterName: string; fighterSlug: string };
  blue?: { fighterName: string; fighterSlug: string };
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

// Plain module-scope cache — this script always runs as its own single
// long-lived process (no Next.js dev-mode hot-reload to worry about), so
// there's no need for the globalThis singleton trick that
// lib/live/citoLiveClient.ts uses on the Next.js side.
const cache = new Map<string, CacheEntry>();

/**
 * Standalone copy of lib/live/citoLiveClient.ts's getLiveEventStatus, kept
 * for use outside the Next.js runtime — that file is guarded by
 * `import "server-only"` and cannot be imported from this worker process.
 * Fetch/cache/fail-soft behavior is intentionally identical; see the
 * original file for the full rationale (90s TTL, Cito's 500 req/month quota,
 * never-throw fail-soft fallback to last known value).
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
