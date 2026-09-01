const MIDDLEWARE_URL = process.env.CITO_MIDDLEWARE_URL;
const MIDDLEWARE_KEY = process.env.CITO_MIDDLEWARE_INTERNAL_KEY;

export interface CitoLiveBoutTracking {
  entity_type: string;
  /** Prefixed with "ufc-" — do NOT match this against alarms.bout_id. */
  boutId: string;
  /**
   * NOT the same id as alarms.bout_id, despite the name similarity —
   * alarms.bout_id is the hex `id` from GET /api/cito/events/:slug/stats
   * (see mapBout in lib/api/events.ts), while this is Cito's own numeric
   * FightMetric id, which the stats endpoint never exposes anywhere. There
   * is no shared id between the two endpoints; use
   * findLiveTrackingByFighterNames below instead, which joins on the one
   * field both endpoints agree on (fighter full name).
   */
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
 * Cito's live-tracking fighter names aren't always accented the same way as
 * the event/stats endpoint's ("Joel Alvarez" vs "Joel Álvarez") — strip
 * diacritics and case before comparing so that alone doesn't break the join
 * below.
 */
function normalizeFighterName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * GET /api/cito/events/:slug/stats (what alarms.bout_id and Fight.boutId
 * come from) and GET /api/cito/live/:slug (this module) key bouts with two
 * entirely different id schemes and expose no field that maps one to the
 * other — fighter full name is the only value both responses carry for the
 * same bout, so it's what's used to find a live-tracking row for a stored
 * alarm or a Fight.
 */
export function findLiveTrackingByFighterNames(
  tracking: CitoLiveBoutTracking[] | undefined,
  fighterRedName: string,
  fighterBlueName: string,
): CitoLiveBoutTracking | undefined {
  const red = normalizeFighterName(fighterRedName);
  const blue = normalizeFighterName(fighterBlueName);
  return tracking?.find((t) => {
    const names = [t.red?.fighterName, t.blue?.fighterName].map((n) =>
      n ? normalizeFighterName(n) : "",
    );
    return names.includes(red) && names.includes(blue);
  });
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
