function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurada.`);
  return v;
}

export const config = {
  port: Number(process.env.PORT) || 3005,
  host: process.env.HOST || "0.0.0.0",
  // Contas Cito separadas, cada uma com sua própria cota mensal. Em vez de
  // martelar sempre a primeira até ela estourar (ver keyRotation.ts), o uso
  // é revezado entre todas em janelas de CITO_KEY_ROTATION_INTERVAL_MS, e
  // qualquer chave que leve 429 fica de fora da rotação até a janela virar
  // de novo — dilui o uso para reduzir o risco da Cito bloquear uma conta
  // por estourar limite repetidamente.
  citoApiKeys: [
    required("CITO_API_KEY"),
    process.env.CITO_API_KEY_FALLBACK,
    process.env.CITO_API_KEY_FALLBACK_2,
    process.env.CITO_API_KEY_FALLBACK_3,
  ].filter((key): key is string => Boolean(key)),
  citoKeyRotationIntervalMs: Number(process.env.CITO_KEY_ROTATION_INTERVAL_MS) || 3_600_000,
  internalKey: required("MIDDLEWARE_INTERNAL_KEY"),
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  citoBaseUrl: process.env.CITO_BASE_URL || "https://api.citoapi.com",
  ttl: {
    eventsMs: Number(process.env.CACHE_TTL_EVENTS_MS) || 3_600_000,
    eventStatsMs: Number(process.env.CACHE_TTL_EVENT_STATS_MS) || 1_800_000,
    liveStatusMs: Number(process.env.CACHE_TTL_LIVE_MS) || 90_000,
  },
} as const;
