import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { env } from "./config/env";
import databasePlugin from "./plugins/database";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";

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
    await fastify.register(userRoutes);

    // Start server
    await fastify.listen({
      port: parseInt(env.PORT),
      host: env.HOST,
    });

    console.log('check logs')
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
