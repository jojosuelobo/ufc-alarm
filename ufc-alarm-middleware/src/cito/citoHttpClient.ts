import { config } from "../config.js";
import { CitoApiError } from "../errors.js";

async function tryFetch(path: string, apiKey: string): Promise<Response> {
  try {
    return await fetch(`${config.citoBaseUrl}${path}`, {
      headers: { "x-api-key": apiKey },
    });
  } catch {
    throw new CitoApiError("Não foi possível conectar à Cito API.");
  }
}

/**
 * Tenta cada chave em config.citoApiKeys em ordem, só avançando para a
 * próxima quando a atual esgotou a cota (429) — outras chaves ficam de
 * reserva para quando a principal bate no limite mensal, em vez de
 * derrubar o endpoint até o reset.
 */
export async function citoGet<T>(path: string): Promise<T> {
  let res: Response;
  let apiKey = config.citoApiKeys[0];
  res = await tryFetch(path, apiKey);

  for (let i = 1; res.status === 429 && i < config.citoApiKeys.length; i++) {
    apiKey = config.citoApiKeys[i];
    res = await tryFetch(path, apiKey);
  }

  if (!res.ok) {
    throw new CitoApiError("A Cito API retornou um erro.", res.status);
  }

  return (await res.json()) as T;
}
