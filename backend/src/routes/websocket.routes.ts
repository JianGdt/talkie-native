import { FastifyPluginAsync } from "fastify";
import websocketHandler from "../services/websocket-handler.service";

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  websocketHandler.initialize(fastify);

  fastify.get("/ws", { websocket: true }, (socket, req) => {
    websocketHandler.handleConnection(socket, req);
  });

  fastify.get("/ws/stats", async (request, reply) => {
    return websocketHandler.getStats();
  });

  // to prevent ghost connection is like ping/pong on the client and send the heartbeat from the server, (clean up)
  websocketHandler.startHeartbeat();

  console.log("💓 Heartbeat started for presence tracking");
};
