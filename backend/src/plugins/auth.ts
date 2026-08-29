import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

const PUBLIC_ROUTES = new Set([
  "/health",
  "/ws",
  "/auth/register",
  "/auth/login",
  "/auth/forgot-password",
]);

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest("userId", "");

  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (
        request.method === "OPTIONS" ||
        PUBLIC_ROUTES.has(request.url.split("?")[0]) ||
        request.headers.upgrade === "websocket"
      ) {
        return;
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply
          .status(401)
          .send({ error: "Missing authorization header" });
      }

      const token = authHeader.slice(7);

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          return reply.status(401).send({ error: "Invalid or expired token" });
        }

        request.userId = user.id;
      } catch {
        return reply.status(401).send({ error: "Authentication failed" });
      }
    },
  );
});
