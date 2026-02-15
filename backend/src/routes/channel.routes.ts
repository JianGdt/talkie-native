import { FastifyInstance } from "fastify";
import { ChannelService } from "../services/channel.service";

interface ChannelParams {
  channelId: string;
}

interface CreateChannelBody {
  name: string;
  description?: string;
  category?: "public" | "private" | "team";
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
}

export default async function channelRoutes(fastify: FastifyInstance) {
  const channelService = new ChannelService(fastify.db);

  fastify.get("/api/channels", async (request, reply) => {
    try {
      const channels = await channelService.getAllChannels();
      return reply.send(channels);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch channels",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.get<{ Params: ChannelParams }>(
    "/api/channels/:channelId",
    async (request, reply) => {
      try {
        const { channelId } = request.params;
        const channel = await channelService.getChannel(channelId);

        if (!channel) {
          return reply.status(404).send({
            error: "Channel not found",
          });
        }

        return reply.send(channel);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Body: CreateChannelBody }>(
    "/api/channels",
    async (request, reply) => {
      try {
        const { name, description, category } = request.body;

        if (!name) {
          return reply.status(400).send({
            error: "Missing required field: name",
          });
        }

        const channel = await channelService.createChannel(
          name,
          description,
          category,
        );

        return reply.status(201).send(channel);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to create channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get<{
    Params: ChannelParams;
    Querystring: GetMessagesQuery;
  }>("/api/channels/:channelId/messages", async (request, reply) => {
    try {
      const { channelId } = request.params;
      const limit = parseInt(request.query.limit || "50");
      const before = request.query.before
        ? parseInt(request.query.before)
        : null;

      const messages = await channelService.getChannelMessages(
        channelId,
        limit,
        before,
      );

      return reply.send(messages);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch channel messages",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.get<{ Params: ChannelParams }>(
    "/api/channels/:channelId/members",
    async (request, reply) => {
      try {
        const { channelId } = request.params;
        const members = await channelService.getChannelMembers(channelId);

        return reply.send(members);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch channel members",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.patch<{
    Params: ChannelParams;
    Body: Partial<CreateChannelBody>;
  }>("/api/channels/:channelId", async (request, reply) => {
    try {
      const { channelId } = request.params;
      const updates = request.body;

      const channel = await channelService.updateChannel(channelId, updates);

      if (!channel) {
        return reply.status(404).send({
          error: "Channel not found",
        });
      }

      return reply.send(channel);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to update channel",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.delete<{ Params: ChannelParams }>(
    "/api/channels/:channelId",
    async (request, reply) => {
      try {
        const { channelId } = request.params;
        await channelService.deleteChannel(channelId);

        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to delete channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
}
