import Fastify from "fastify";
import { checkInternalKey } from "./plugins/internalAuth.js";
import { healthRoutes } from "./routes/health.js";
import { eventsRoutes } from "./routes/events.js";
import { eventStatsRoutes } from "./routes/eventStats.js";
import { liveStatusRoutes } from "./routes/liveStatus.js";

export function build() {
  const app = Fastify({ logger: true });
  app.addHook("onRequest", checkInternalKey);
  app.register(healthRoutes);
  app.register(eventsRoutes);
  app.register(eventStatsRoutes);
  app.register(liveStatusRoutes);
  return app;
}
