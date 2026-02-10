import { FastifyRequest, FastifyReply } from "fastify";
import { supabaseAdmin } from "../config/supabase";

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply
        .status(401)
        .send({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({ error: "Invalid or expired token" });
    }

    request.user = user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return reply.status(401).send({ error: "Authentication failed" });
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      user_metadata?: any;
    };
  }
}
