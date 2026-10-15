import { config } from "../config.js";
import { CitoApiError } from "../errors.js";
import { getKeyOrder, markKeyAvailable, markKeyBlocked } from "./keyRotation.js";

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
 * Tenta as chaves de config.citoApiKeys na ordem dada por getKeyOrder()
 * (round-robin por janela de tempo, pulando as já sabidamente bloqueadas —
 * ver keyRotation.ts), só avançando para a próxima quando a atual esgotou a
 * cota (429). Qualquer outro erro HTTP é repassado direto, sem tentar as
 * demais chaves — não é um problema de cota, então trocar de chave não
 * ajudaria.
 */
export async function citoGet<T>(path: string): Promise<T> {
  let res: Response | undefined;

  for (const apiKey of getKeyOrder()) {
    res = await tryFetch(path, apiKey);
    if (res.status !== 429) {
      markKeyAvailable(apiKey);
      break;
    }
    markKeyBlocked(apiKey);
  }

  if (!res || !res.ok) {
    throw new CitoApiError("A Cito API retornou um erro.", res?.status);
  }

  return (await res.json()) as T;
}
