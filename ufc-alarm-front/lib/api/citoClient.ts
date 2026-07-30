import "server-only";

const CITO_BASE_URL = "https://api.citoapi.com";

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
  const apiKey = process.env.CITO_API_KEY;
  if (!apiKey) {
    throw new CitoApiError("CITO_API_KEY não configurada no servidor.");
  }

  let res: Response;
  try {
    res = await fetch(`${CITO_BASE_URL}${path}`, {
      headers: { "x-api-key": apiKey },
      next: { revalidate },
    });
  } catch {
    throw new CitoApiError("Não foi possível conectar à Cito API.");
  }

  if (!res.ok) {
    throw new CitoApiError("A Cito API retornou um erro.", res.status);
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
  return citoFetch<T>(`/api/v1/ufc/events?${search}`, { revalidate: 3600 });
}

export function getCitoEventStats<T>(slugOrId: string): Promise<T> {
  return citoFetch<T>(`/api/v1/ufc/events/${slugOrId}/stats`, {
    revalidate: 1800,
  });
}
