import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { TtlCache } from "../cito/cache.js";
import { citoGet } from "../cito/citoHttpClient.js";
import type { CitoEventListResponse } from "../cito/types.js";

const cache = new TtlCache<CitoEventListResponse>(config.ttl.eventsMs);

export async function eventsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    "/api/cito/events",
    async (req, reply) => {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 50);
      const cacheKey = `${page}:${limit}`;

      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const fallback = cache.getStale(cacheKey);

      try {
        const json = await citoGet<CitoEventListResponse>(
          `/api/v1/ufc/events?page=${page}&limit=${limit}`,
        );
        cache.set(cacheKey, json);
        return json;
      } catch (error) {
        req.log.error({ err: error }, "Cito events falhou");
        if (fallback) {
          req.log.warn({ cacheKey }, "Cito events falhou — usando fallback");
          return fallback;
        }
        reply.code(502);
        return { success: false, error: "cito_unavailable" };
      }
    },
  );
}
