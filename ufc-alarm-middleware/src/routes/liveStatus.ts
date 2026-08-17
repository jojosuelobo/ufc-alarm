import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { TtlCache } from "../cito/cache.js";
import { citoGet } from "../cito/citoHttpClient.js";
import type { CitoLiveEventData, CitoLiveEventResponse } from "../cito/types.js";

const cache = new TtlCache<CitoLiveEventData | null>(config.ttl.liveStatusMs);

export async function liveStatusRoutes(app: FastifyInstance) {
  app.get<{ Params: { slug: string } }>(
    "/api/cito/live/:slug",
    async (req) => {
      const { slug } = req.params;

      const cached = cache.get(slug);
      if (cached !== undefined) return { data: cached };

      const fallback = cache.getStale(slug) ?? null;

      try {
        const json = await citoGet<CitoLiveEventResponse>(
          `/api/v1/ufc/live/events/${slug}`,
        );
        cache.set(slug, json.data);
        return { data: json.data };
      } catch (error) {
        req.log.error({ err: error, slug }, "Cito live status falhou — usando fallback");
        cache.set(slug, fallback);
        return { data: fallback };
      }
    },
  );
}
