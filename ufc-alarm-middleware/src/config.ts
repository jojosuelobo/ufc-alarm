function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurada.`);
  return v;
}

export const config = {
  port: Number(process.env.PORT) || 3005,
  host: process.env.HOST || "0.0.0.0",
  citoApiKey: required("CITO_API_KEY"),
  internalKey: required("MIDDLEWARE_INTERNAL_KEY"),
  citoBaseUrl: process.env.CITO_BASE_URL || "https://api.citoapi.com",
  ttl: {
    eventsMs: Number(process.env.CACHE_TTL_EVENTS_MS) || 3_600_000,
    eventStatsMs: Number(process.env.CACHE_TTL_EVENT_STATS_MS) || 1_800_000,
    liveStatusMs: Number(process.env.CACHE_TTL_LIVE_MS) || 90_000,
  },
} as const;
