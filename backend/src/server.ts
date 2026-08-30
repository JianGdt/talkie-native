import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import databasePlugin from "./plugins/database";
import { authRoutes } from "./routes/auth";
import { websocketRoutes } from "./routes/websocket.routes";
import userRoutes from "./routes/users.routes";
import conversationRoutes from "./routes/conversation.routes";
import channelRoutes from "./routes/channel.routes";
import channelManagerService from "./services/channel-manager.service";
import { ActiveUserService } from "./services/active.service";
import websocket from "@fastify/websocket";
import auth from "./plugins/auth";

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === "development" ? "info" : "warn",
  },
});

async function start() {
  try {
    await fastify.register(cors, {
      origin: (origin, cb) => {
        const allowedOrigins = [
          ...env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
        ];

        if (
          !origin ||
          allowedOrigins.some((allowed) => origin.startsWith(allowed))
        ) {
          cb(null, true);
        } else {
          cb(new Error("Not allowed by CORS"), false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    });

    await fastify.register(databasePlugin);
    await fastify.register(websocket);

    await fastify.register(auth);

    fastify.get("/health", async (request, reply) => {
      try {
        return {
          status: "healthy",
          database: "connected",
          timestamp: Date.now(),
        };
      } catch (error) {
        return reply.status(503).send({
          status: "unhealthy",
          database: "disconnected",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    await channelManagerService.initialize(fastify.db);

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(userRoutes);
    await fastify.register(websocketRoutes);
    await fastify.register(channelRoutes);
    await fastify.register(conversationRoutes);

    console.log("log this to check if the all routes registered successfully");

    const activeUserService = new ActiveUserService(fastify.db);

    const staleCleanupInterval = setInterval(async () => {
      await activeUserService.markStaleUsersOffline();
    }, 60000);

    fastify.addHook("onClose", async () => {
      clearInterval(staleCleanupInterval);
    });

    const port = parseInt(process.env.PORT || "3001", 10);

    await fastify.listen({ port, host: "0.0.0.0" });

    console.log(` Server running on http://0.0.0.0:${port}`);
    console.log(` WebSocket available at ws://0.0.0.0:${port}/ws`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
