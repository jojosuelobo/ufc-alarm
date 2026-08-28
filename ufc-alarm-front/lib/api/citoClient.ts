import "server-only";

const MIDDLEWARE_URL = process.env.CITO_MIDDLEWARE_URL;
const MIDDLEWARE_KEY = process.env.CITO_MIDDLEWARE_INTERNAL_KEY;

export class CitoApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CitoApiError";
  }
}

// Caching is centralized in ufc-alarm-middleware's own TTL cache (see its
// README) — this client always fetches fresh from it rather than adding a
// second, uncoordinated cache layer on top via Next.js's fetch/route cache.
async function citoFetch<T>(path: string): Promise<T> {
  if (!MIDDLEWARE_URL || !MIDDLEWARE_KEY) {
    throw new CitoApiError("Middleware da Cito não configurado no servidor.");
  }

  let res: Response;
  try {
    res = await fetch(`${MIDDLEWARE_URL}${path}`, {
      headers: { "x-internal-key": MIDDLEWARE_KEY },
      cache: "no-store",
    });
  } catch {
    throw new CitoApiError("Não foi possível conectar ao middleware da Cito.");
  }

  if (!res.ok) {
    throw new CitoApiError("O middleware da Cito retornou um erro.", res.status);
  }

  return (await res.json()) as T;
}

export function getCitoEvents<T>(params: {
  page?: number;
  limit?: number;
}): Promise<T> {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 50),
  });
  return citoFetch<T>(`/api/cito/events?${search}`);
}

export function getCitoEventStats<T>(slugOrId: string): Promise<T> {
  return citoFetch<T>(`/api/cito/events/${slugOrId}/stats`);
}
