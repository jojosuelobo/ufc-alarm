import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { TtlCache } from "../cito/cache.js";
import { citoGet } from "../cito/citoHttpClient.js";
import type { CitoEventStatsResponse } from "../cito/types.js";

const cache = new TtlCache<CitoEventStatsResponse>(config.ttl.eventStatsMs);

export async function eventStatsRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>(
    "/api/cito/events/:slug/stats",
    async (req, reply) => {
      const { slug } = req.params;

      const cached = cache.get(slug);
      if (cached) return cached;

      try {
        const json = await citoGet<CitoEventStatsResponse>(
          `/api/v1/ufc/events/${slug}/stats`,
        );
        cache.set(slug, json);
        return json;
      } catch (error) {
        req.log.error({ err: error, slug }, "Cito event stats falhou");
        reply.code(502);
        return { success: false, error: "cito_unavailable" };
      }
    },
  );
}
