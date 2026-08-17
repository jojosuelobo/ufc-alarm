import type { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config.js";

/**
 * Registered via `app.addHook` directly on the root instance (not
 * `app.register`) — Fastify encapsulates hooks added inside a registered
 * plugin to that plugin's own context, so registering this as a plugin would
 * silently not apply to sibling route registrations (events/eventStats/live).
 */
export async function checkInternalKey(req: FastifyRequest, reply: FastifyReply) {
  if (req.url === "/health") return;
  const key = req.headers["x-internal-key"];
  if (key !== config.internalKey) {
    return reply.code(401).send({ error: "unauthorized" });
  }
}
