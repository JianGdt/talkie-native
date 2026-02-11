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
    await fastify.register(cors, {
      origin: env.ALLOWED_ORIGINS.split(","),
      credentials: true,
    });

    await fastify.register(websocket);

    await fastify.register(databasePlugin);

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(apiRoutes)
    await fastify.register(userRoutes);
    await fastify.register(websocketRoutes);

    // Start server
    await fastify.listen({
      port: parseInt(env.PORT),
      host: "0.0.0.0",
    });

    console.log(`✅ Server running on http://0.0.0.0:${env.PORT}`);
    console.log(`✅ WebSocket available at ws://192.168.1.10:${env.PORT}/ws`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
