import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./config/env";
import databasePlugin from "./plugins/database";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { websocketRoutes } from "./routes/websocket";
import apiRoutes from "./routes/api";

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === "development" ? "info" : "warn",
  },
});

async function start() {
  try {
    // CORS configuration - must be registered BEFORE websocket
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
        // Increase max payload size if needed
        maxPayload: 1048576, // 1MB
        // Client tracking
        clientTracking: true,
        // Verify client
        verifyClient: (info, next) => {
          // You can add custom verification logic here
          // For now, accept all connections (auth will happen after connection)
          next(true);
        },
      },
    });

    await fastify.register(databasePlugin);

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(apiRoutes);
    await fastify.register(userRoutes);
    await fastify.register(websocketRoutes);

    // Health check route
    fastify.get("/health", async (request, reply) => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    // Start server
    await fastify.listen({
      port: parseInt(env.PORT),
      host: "0.0.0.0",
    });

    console.log(`✅ Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`✅ WebSocket available at ws://0.0.0.0:${env.PORT}/ws`);
    console.log(`📋 Allowed origins:`, env.ALLOWED_ORIGINS);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
