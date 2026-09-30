function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurada.`);
  return v;
}

export const config = {
  port: Number(process.env.PORT) || 3005,
  host: process.env.HOST || "0.0.0.0",
  // Chaves tentadas em ordem — contas Cito separadas, cada uma com sua
  // própria cota mensal. Quando a primeira bate no limite (429), a próxima
  // entra como reserva em vez de derrubar o endpoint até o reset mensal.
  citoApiKeys: [
    required("CITO_API_KEY"),
    process.env.CITO_API_KEY_FALLBACK,
    process.env.CITO_API_KEY_FALLBACK_2,
    process.env.CITO_API_KEY_FALLBACK_3,
  ].filter((key): key is string => Boolean(key)),
  internalKey: required("MIDDLEWARE_INTERNAL_KEY"),
  citoBaseUrl: process.env.CITO_BASE_URL || "https://api.citoapi.com",
  ttl: {
    eventsMs: Number(process.env.CACHE_TTL_EVENTS_MS) || 3_600_000,
    eventStatsMs: Number(process.env.CACHE_TTL_EVENT_STATS_MS) || 1_800_000,
    liveStatusMs: Number(process.env.CACHE_TTL_LIVE_MS) || 90_000,
  },
} as const;
