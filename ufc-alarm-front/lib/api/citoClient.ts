import "server-only";

const MIDDLEWARE_URL = process.env.CITO_MIDDLEWARE_URL;
const MIDDLEWARE_KEY = process.env.CITO_MIDDLEWARE_INTERNAL_KEY;

export class CitoApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "CitoApiError";
  }
}

async function citoFetch<T>(
  path: string,
  { revalidate }: { revalidate: number },
): Promise<T> {
  if (!MIDDLEWARE_URL || !MIDDLEWARE_KEY) {
    throw new CitoApiError("Middleware da Cito não configurado no servidor.");
  }

  let res: Response;
  try {
    res = await fetch(`${MIDDLEWARE_URL}${path}`, {
      headers: { "x-internal-key": MIDDLEWARE_KEY },
      next: { revalidate },
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
  return citoFetch<T>(`/api/cito/events?${search}`, { revalidate: 3600 });
}

export function getCitoEventStats<T>(slugOrId: string): Promise<T> {
  return citoFetch<T>(`/api/cito/events/${slugOrId}/stats`, {
    revalidate: 1800,
  });
}
