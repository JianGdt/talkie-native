import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./config/env";
import databasePlugin from "./plugins/database";
import { authRoutes } from "./routes/auth";
import { websocketRoutes } from "./routes/websocket.routes";
import userRoutes from "./routes/users.routes";
import conversationRoutes from "./routes/conversation.routes";
import channelRoutes from "./routes/channel.routes";
import channelManagerService from "./services/channel-manager.service";
import { ActiveUserService } from "./services/active.service";

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
          ...env.ALLOWED_ORIGINS.split(","),
          "http://localhost:8081",
          "http://192.168.1.10:8081",
          "exp://192.168.1.10:8081",
          "https://talkie-native-ptqm.vercel.app/",
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
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // WebSocket configuration
    await fastify.register(websocket, {
      options: {
        maxPayload: 1048576, // 1MB
        clientTracking: true,
        verifyClient: (info, next) => {
          next(true);
        },
      },
    });

    await fastify.register(databasePlugin);

    await channelManagerService.initialize(fastify.db);

    // Register routes
    await fastify.register(authRoutes);

    await fastify.register(userRoutes);

    await fastify.register(websocketRoutes);

    await fastify.register(channelRoutes);

    await fastify.register(conversationRoutes);

    const activeUserService = new ActiveUserService(fastify.db);

    const staleCleanupInterval = setInterval(async () => {
      await activeUserService.markStaleUsersOffline();
    }, 60000); // Every 60 seconds

    // Clean up on server shutdown
    fastify.addHook("onClose", async () => {
      clearInterval(staleCleanupInterval);
    });

    const port = parseInt(process.env.PORT || "3001", 10);

    // Start server
    await fastify.listen({
      port: port,
      host: "0.0.0.0",
    });

    console.log(`✅ Server running on http://0.0.0.0:${port}`);
    console.log(`✅ WebSocket available at ws://0.0.0.0:${port}/ws`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
