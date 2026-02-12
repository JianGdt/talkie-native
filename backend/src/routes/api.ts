import { FastifyInstance } from "fastify";
import channelManager from "../services/channel-manager.service";
import websocketHandler from "../services/websocket-handler.service";

export default async function apiRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Get all channels
  fastify.get("/api/channels", async (request, reply) => {
    const channels = channelManager.getAllChannels();

    return {
      success: true,
      data: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        activeUsers: channel.activeUsers,
        createdAt: channel.createdAt,
      })),
      count: channels.length,
    };
  });

  // Get specific channel
  fastify.get<{
    Params: { id: string };
  }>("/api/channels/:id", async (request, reply) => {
    const { id } = request.params;
    const channelInfo = channelManager.getChannelInfo(id);

    if (!channelInfo) {
      return reply.status(404).send({
        success: false,
        error: "Channel not found",
      });
    }

    return {
      success: true,
      data: channelInfo,
    };
  });

  // Create new channel
  fastify.post<{
    Body: { name: string; description?: string };
  }>("/api/channels", async (request, reply) => {
    const { name, description } = request.body;

    if (!name || name.trim() === "") {
      return reply.status(400).send({
        success: false,
        error: "Channel name is required",
      });
    }

    const channel = channelManager.createChannel(name.trim(), description);

    return {
      success: true,
      data: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
      },
    };
  });

  // Delete channel
  fastify.delete<{
    Params: { id: string };
  }>("/api/channels/:id", async (request, reply) => {
    const { id } = request.params;
    const success = channelManager.deleteChannel(id);

    if (!success) {
      return reply.status(404).send({
        success: false,
        error: "Channel not found",
      });
    }

    return {
      success: true,
      message: "Channel deleted successfully",
    };
  });

  // Get channel users
  fastify.get<{
    Params: { id: string };
  }>("/api/channels/:id/users", async (request, reply) => {
    const { id } = request.params;
    const users = channelManager.getChannelUsers(id);

    return {
      success: true,
      data: users,
      count: users.length,
    };
  });

  fastify.get("/api/stats", async (request, reply) => {
    const stats = websocketHandler.getStats();

    return {
      success: true,
      data: stats,
    };
  });

  console.log("✅ API routes registered");
}
