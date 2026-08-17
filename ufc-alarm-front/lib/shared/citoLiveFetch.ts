const MIDDLEWARE_URL = process.env.CITO_MIDDLEWARE_URL;
const MIDDLEWARE_KEY = process.env.CITO_MIDDLEWARE_INTERNAL_KEY;

export interface CitoLiveBoutTracking {
  entity_type: string;
  /** Prefixed with "ufc-" — do NOT match this against alarms.bout_id. */
  boutId: string;
  /** Matches alarms.bout_id (the plain Cito bout id) — match on this. */
  fightMetricId: string;
  status: string;
  currentRound?: number;
  currentTime?: string;
  method?: string | null;
  red?: { fighterName: string; fighterSlug: string; outcome?: string | null };
  blue?: { fighterName: string; fighterSlug: string; outcome?: string | null };
}

export interface CitoLiveEventData {
  eventSlug: string;
  status: string;
  recommendedPollSeconds?: number;
  tracking: CitoLiveBoutTracking[];
}

interface MiddlewareLiveResponse {
  data: CitoLiveEventData | null;
}

/**
 * Fail-soft: nunca lança. TTL/cache e o fallback "último valor bom
 * conhecido" agora vivem centralizados no ufc-alarm-middleware (uma única
 * instância, cota Cito compartilhada por todos os consumidores — web e
 * worker deste projeto). Este cliente só cobre o caso do próprio middleware
 * estar inacessível (rede caída, container reiniciando), retornando null
 * nesse caso — não reimplementa TTL local.
 *
 * Sem "server-only" de propósito: compartilhado entre o app Next.js
 * (re-exportado com o guard em lib/live/citoLiveClient.ts) e o worker
 * standalone (scripts/mobile-alarm-worker.ts), que roda fora do runtime do
 * Next e não pode importar nada guardado por server-only.
 */
export async function getLiveEventStatus(eventSlug: string): Promise<CitoLiveEventData | null> {
  if (!MIDDLEWARE_URL || !MIDDLEWARE_KEY) {
    console.error("CITO_MIDDLEWARE_URL/CITO_MIDDLEWARE_INTERNAL_KEY não configuradas.");
    return null;
  }

  try {
    const res = await fetch(`${MIDDLEWARE_URL}/api/cito/live/${eventSlug}`, {
      headers: { "x-internal-key": MIDDLEWARE_KEY },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Middleware live status ${eventSlug}: HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as MiddlewareLiveResponse;
    return json.data;
  } catch (error) {
    console.error(`Middleware live status ${eventSlug} falhou:`, error);
    return null;
  }
}
