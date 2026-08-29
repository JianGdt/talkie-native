import { FastifyInstance } from "fastify";
import { ConversationService } from "../services/conversation.service";
import { authenticate } from "../middleware/authenticate";
import { ConversationParams, CreateDirectMessageBody, CreateGroupBody, GetMessagesQuery, ToggleMuteBody, TogglePinBody } from "../@types/conversation";
import { MessageType } from "../@types/message";
import wsHandler from "../services/websocket-handler.service";

const normalizeMessageType = (messageType: unknown, content?: string) => {
  if (messageType === "image" || messageType === "file") return messageType;
  if (messageType === "audio" || messageType === "system") return messageType;
  if (messageType === "attachment") {
    try {
      const attachment = JSON.parse(content ?? "");
      return attachment?.kind === "image" ? "image" : "file";
    } catch {
      return "file";
    }
  }
  return "text";
};


export default async function conversationRoutes(fastify: FastifyInstance) {
  const conversationService = new ConversationService(fastify.db);

  fastify.addHook("preHandler", authenticate);

  fastify.get("/api/conversations", async (request, reply) => {
    try {
      const conversations = await conversationService.getUserConversations(
        request.userId,
      );
      return reply.send(conversations);
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.post<{ Body: CreateDirectMessageBody }>(
    "/api/conversations/direct",
    async (request, reply) => {
      try {
        const { otherUserId } = request.body;
        const userId = request.userId;

        if (!otherUserId) {
          return reply
            .status(400)
            .send({ error: "Missing required field: otherUserId" });
        }

        if (userId === otherUserId) {
          return reply
            .status(400)
            .send({ error: "Cannot create conversation with yourself" });
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
        const { name, participantIds } = request.body;
        const userId = request.userId; 

        if (!name || !participantIds || participantIds.length === 0) {
          return reply.status(400).send({
            error: "Missing required fields: name, participantIds",
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

  fastify.get<{ Params: ConversationParams; Querystring: GetMessagesQuery }>(
    "/api/conversations/:conversationId/messages",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const limit = parseInt(request.query.limit || "50");
        const before = request.query.before
          ? parseInt(request.query.before)
          : null;

        const isMember = await conversationService.isParticipant(
          conversationId,
          request.userId,
        );
        if (!isMember) {
          return reply.status(403).send({ error: "Access denied" });
        }

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
    },
  );

  fastify.post<{
    Params: ConversationParams;
    Body: { content?: string; messageType?: string };
  }>("/api/conversations/:conversationId/messages", async (request, reply) => {
    try {
      const { conversationId } = request.params;
      const { content } = request.body ?? {};
      const messageType = normalizeMessageType(
        request.body?.messageType,
        content,
      );

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: "Missing message content" });
      }

      const isMember = await conversationService.isParticipant(
        conversationId,
        request.userId,
      );
      if (!isMember) {
        return reply.status(403).send({ error: "Access denied" });
      }

      const savedMessage = await conversationService.saveMessage(
        conversationId,
        request.userId,
        content,
        messageType,
      );
      const participants =
        await conversationService.getParticipants(conversationId);
      const sender = participants.find((p) => p.id === request.userId);
      const timestamp = savedMessage.timestamp;
      const payload = {
        conversationId,
        content,
        messageType,
        messageId: savedMessage.id,
        sender: {
          userId: request.userId,
          username: sender?.name ?? "",
        },
        timestamp,
      };

      wsHandler.broadcastToUsers(
        participants.map((p) => p.id),
        {
          type: MessageType.MESSAGE,
          userId: request.userId,
          username: sender?.name ?? "",
          payload,
          timestamp,
        },
        request.userId,
      );

      return reply.status(201).send({
        id: savedMessage.id,
        conversation_id: conversationId,
        sender_id: request.userId,
        content,
        message_type: messageType,
        created_at: savedMessage.created_at,
        sender_username: sender?.name ?? "",
        timestamp,
      });
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to send message",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  fastify.post<{ Params: ConversationParams }>(
    "/api/conversations/:conversationId/read",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        await conversationService.markAsRead(conversationId, request.userId);
        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to mark as read",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Params: ConversationParams; Body: TogglePinBody }>(
    "/api/conversations/:conversationId/pin",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const { isPinned } = request.body;
        await conversationService.togglePin(
          conversationId,
          request.userId,
          isPinned,
        );
        return reply.send({ success: true, isPinned });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to toggle pin",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post<{ Params: ConversationParams; Body: ToggleMuteBody }>(
    "/api/conversations/:conversationId/mute",
    async (request, reply) => {
      try {
        const { conversationId } = request.params;
        const { isMuted } = request.body;
        await conversationService.toggleMute(
          conversationId,
          request.userId,
          isMuted,
        );
        return reply.send({ success: true, isMuted });
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to toggle mute",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );
}
