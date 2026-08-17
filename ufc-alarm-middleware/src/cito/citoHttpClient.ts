import { config } from "../config.js";
import { CitoApiError } from "../errors.js";

export async function citoGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${config.citoBaseUrl}${path}`, {
      headers: { "x-api-key": config.citoApiKey },
    });
  } catch {
    throw new CitoApiError("Não foi possível conectar à Cito API.");
  }

  if (!res.ok) {
    throw new CitoApiError("A Cito API retornou um erro.", res.status);
  }

  return (await res.json()) as T;
}
