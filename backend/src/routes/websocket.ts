import { FastifyPluginAsync } from "fastify";
import websocketHandler from "../services/websocket-handler.service";

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  websocketHandler.initialize(fastify);
  // websocketHandler.startHeartbeat();

  fastify.get("/ws", { websocket: true }, (socket, req) => {
    websocketHandler.handleConnection(socket, req);
  });

  fastify.get("/ws/stats", async (request, reply) => {
    return websocketHandler.getStats();
  });

  console.log("✅ WebSocket routes registered");
};
