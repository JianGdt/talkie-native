import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversation.service";

interface ConversationParams {
  userId: string;
  conversationId: string;
}

interface CreateDirectMessageBody {
  userId: string;
  otherUserId: string;
}

interface CreateGroupBody {
  userId: string;
  name: string;
  participantIds: string[];
}

interface GetMessagesQuery {
  limit?: string;
  before?: string;
}

export default async function conversationRoutes(fastify: FastifyInstance) {
  const conversationService = new ConversationService(fastify.db);

  fastify.get<{ Params: ConversationParams }>(
    "/api/conversations/:userId",
    async (request, reply) => {
      try {
        const { userId } = request.params;

        const conversations =
          await conversationService.getUserConversations(userId);

        return reply.send(conversations);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to fetch conversations",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Body: CreateDirectMessageBody }>(
    "/api/conversations/direct",
    async (request, reply) => {
      try {
        const { userId, otherUserId } = request.body;

        if (!userId || !otherUserId) {
          return reply.status(400).send({
            error: "Missing required fields: userId, otherUserId",
          });
        }

        if (userId === otherUserId) {
          return reply.status(400).send({
            error: "Cannot create conversation with yourself",
          });
        }

        const result = await conversationService.createDirectMessage(
          userId,
          otherUserId,
        );

        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to create direct message",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Body: CreateGroupBody }>(
    "/api/conversations/group",
    async (request, reply) => {
      try {
        const { userId, name, participantIds } = request.body;

        if (
          !userId ||
          !name ||
          !participantIds ||
          participantIds.length === 0
        ) {
          return reply.status(400).send({
            error: "Missing required fields: userId, name, participantIds",
          });
        }

        const result = await conversationService.createGroup(
          userId,
          name,
          participantIds,
        );

        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to create group",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.get<{
    Params: ConversationParams;
    Querystring: GetMessagesQuery;
  }>("/api/conversations/:conversationId/messages", async (request, reply) => {
    try {
      const { conversationId } = request.params;
      const limit = parseInt(request.query.limit || "50");
      const before = request.query.before
        ? parseInt(request.query.before)
        : null;

      const messages = await conversationService.getConversationMessages(
        conversationId,
        limit,
        before,
      );

      return reply.send(messages);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.post<{ Params: ConversationParams }>(
    "/api/conversations/:conversationId/read",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const { userId } = request.body as { userId: string };

        if (!userId) {
          return reply.status(400).send({
            error: "Missing userId in request body",
          });
        }

        await conversationService.markAsRead(conversationId, userId);

        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to mark as read",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Params: ConversationParams }>(
    "/api/conversations/:conversationId/pin",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const { userId, isPinned } = request.body as {
          userId: string;
          isPinned: boolean;
        };

        if (!userId) {
          return reply.status(400).send({
            error: "Missing userId in request body",
          });
        }

        await conversationService.togglePin(conversationId, userId, isPinned);

        return reply.send({ success: true, isPinned });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to toggle pin",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Params: ConversationParams }>(
    "/api/conversations/:conversationId/mute",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const { userId, isMuted } = request.body as {
          userId: string;
          isMuted: boolean;
        };

        if (!userId) {
          return reply.status(400).send({
            error: "Missing userId in request body",
          });
        }

        await conversationService.toggleMute(conversationId, userId, isMuted);

        return reply.send({ success: true, isMuted });
      } catch (error) {
        fastify.log.error("Error toggling mute:");
        return reply.status(500).send({
          error: "Failed to toggle mute",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
}
