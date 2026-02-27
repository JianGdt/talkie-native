import { FastifyInstance } from "fastify";
import { ChannelService } from "../services/channel.service";
import wsHandler from "../services/websocket-handler.service";

export default async function channelRoutes(fastify: FastifyInstance) {
  const channelService = new ChannelService(fastify.db);

  fastify.get("/api/channels", async (request, reply) => {
    try {
      const channels = await channelService.getAllChannels();

      const withMembership = await Promise.all(
        channels.map(async (ch) => ({
          ...ch,
          isMember: await channelService.isMember(ch.id, request.userId),
        })),
      );

      return reply.send(withMembership);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch channels",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.get<{ Params: ChannelRouteTypes.ChannelParams }>(
    "/api/channels/:channelId",
    async (request, reply) => {
      try {
        const { channelId } = request.params;
        const channel = await channelService.getChannel(channelId);

        if (!channel) {
          return reply.status(404).send({ error: "Channel not found" });
        }

        const isMember = await channelService.isMember(
          channelId,
          request.userId,
        );
        return reply.send({ ...channel, isMember });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Body: ChannelRouteTypes.CreateChannelBody }>(
    "/api/channels",
    async (request, reply) => {
      try {
        const { name, description, category } = request.body;

        if (!name) {
          return reply
            .status(400)
            .send({ error: "Missing required field: name" });
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

  fastify.patch<{
    Params: ChannelRouteTypes.ChannelParams;
    Body: Partial<ChannelRouteTypes.CreateChannelBody>;
  }>("/api/channels/:channelId", async (request, reply) => {
    try {
      const { channelId } = request.params;
      const channel = await channelService.updateChannel(
        channelId,
        request.body,
      );

      if (!channel) {
        return reply.status(404).send({ error: "Channel not found" });
      }

      return reply.send(channel);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to update channel",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.delete<{ Params: ChannelRouteTypes.ChannelParams }>(
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

  fastify.post<{ Params: ChannelRouteTypes.ChannelParams }>(
    "/api/channels/:channelId/join",
    async (request, reply) => {
      try {
        const { channelId } = request.params;

        const channel = await channelService.getChannel(channelId);
        if (!channel) {
          return reply.status(404).send({ error: "Channel not found" });
        }

        await channelService.addMember(channelId, request.userId);

        wsHandler.broadcastToChannelMembers(channelId, {
          type: "USER_JOINED_CHANNEL" as any,
          payload: { channelId, userId: request.userId },
          timestamp: Date.now(),
        });

        return reply.send({
          success: true,
          channelId,
          channelName: channel.name,
        });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to join channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Params: ChannelRouteTypes.ChannelParams }>(
    "/api/channels/:channelId/leave",
    async (request, reply) => {
      try {
        const { channelId } = request.params;

        await channelService.removeMember(channelId, request.userId);

        // Notify other online members via WS
        wsHandler.broadcastToChannelMembers(channelId, {
          type: "USER_LEFT_CHANNEL" as any,
          payload: { channelId, userId: request.userId },
          timestamp: Date.now(),
        });

        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to leave channel",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get<{
    Params: ChannelRouteTypes.ChannelParams;
    Querystring: ChannelRouteTypes.GetMessagesQuery;
  }>("/api/channels/:channelId/messages", async (request, reply) => {
    try {
      const { channelId } = request.params;

      const isMember = await channelService.isMember(channelId, request.userId);
      if (!isMember) {
        return reply
          .status(403)
          .send({ error: "Not a member of this channel" });
      }

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

  fastify.get<{ Params: ChannelRouteTypes.ChannelParams }>(
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

  fastify.get("/api/users/me/channels", async (request, reply) => {
    try {
      const channels = await channelService.getUserChannels(request.userId);
      return reply.send(channels);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch user channels",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
