import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

import {
  AudioChunkPayload,
  ClientConnection,
  EndTransmissionPayload,
  JoinChannelPayload,
  LeaveChannelPayload,
  MessageType,
  StartTransmissionPayload,
  WebSocketMessage,
} from "../@types/message";
import { connectionManager } from "./connection-manager.service";
import channelManager from "./channel-manager.service";
import { User } from "../@types/websocket";
import { ChannelService } from "./channel.service";
import { ConversationService } from "./conversation.service";
import { ActiveUserService } from "./active.service";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

class WebSocketHandler {
  private fastify: FastifyInstance | null = null;
  private db: Pool | null = null;
  private channelService: ChannelService | null = null;
  private conversationService: ConversationService | null = null;
  private activeUserService: ActiveUserService | null = null;

  initialize(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.db = fastify.db;
    this.channelService = new ChannelService(this.db);
    this.conversationService = new ConversationService(this.db);
    this.activeUserService = new ActiveUserService(this.db);
    console.log("WebSocket handler initialized with database");
  }

  async handleConnection(ws: WebSocket, req: FastifyRequest) {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    connectionManager.addConnection(tempId, {
      ws,
      userId: tempId,
      username: "unauthenticated",
      isAlive: true,
      isAuthenticated: false,
    });

    const authTimeout = setTimeout(() => {
      const conn = connectionManager.getConnection(tempId);
      if (!conn?.isAuthenticated) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: { message: "Authentication timeout" },
          timestamp: Date.now(),
        });
        ws.close(1008, "Auth timeout");
        connectionManager.removeConnection(tempId);
      }
    }, 10_000);

    this.setupSocketListeners(tempId, ws, authTimeout);
  }

  private setupSocketListeners(
    tempId: string,
    ws: WebSocket,
    authTimeout: ReturnType<typeof setTimeout>,
  ) {
    // ✅ currentId lives here as a closure variable
    let currentId = tempId;

    ws.on("message", (message: Buffer) => {
      try {
        if (message.toString().length > 100_000) {
          this.sendError(ws, "Message too large");
          return;
        }
        const parsed = JSON.parse(message.toString());
        this.routeMessage(
          currentId,
          parsed,
          ws,
          authTimeout,
          (realId) => {
            currentId = realId;
          }, // ✅ inline callback updates closure
        );
      } catch (error) {
        this.sendError(ws, "Invalid message format");
      }
    });

    ws.on("pong", () => connectionManager.markAlive(currentId));

    ws.on("close", () => {
      clearTimeout(authTimeout);
      this.handleDisconnect(currentId);
    });

    ws.on("error", () => {
      connectionManager.removeConnection(currentId);
    });
  }

  private async authenticateUser(
    tempId: string,
    userId: string,
    username: string,
    token: string,
    ws: WebSocket,
    authTimeout: ReturnType<typeof setTimeout>,
    onAuthenticated: (realId: string) => void, // ✅
  ) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: { message: "Invalid or expired token" },
          timestamp: Date.now(),
        });
        setTimeout(() => ws.close(1008, "Authentication failed"), 1000);
        return;
      }

      if (user.id !== userId) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: { message: "Token mismatch" },
          timestamp: Date.now(),
        });
        setTimeout(() => ws.close(1008, "Token mismatch"), 1000);
        return;
      }

      clearTimeout(authTimeout);

      const tempConnection = connectionManager.getConnection(tempId);
      if (!tempConnection) return;
      connectionManager.removeConnection(tempId);

      const existing = connectionManager.getConnection(userId);
      if (existing?.ws.readyState === WebSocket.OPEN) {
        existing.ws.close(1000, "Replaced by new connection");
      }

      connectionManager.addConnection(userId, {
        ...tempConnection,
        userId,
        username,
        isAuthenticated: true,
      });

      // ✅ Update currentId in the closure — all subsequent messages use realUserId
      onAuthenticated(userId);

      await this.activeUserService!.setUserOnline(userId);
      connectionManager.markAuthenticated(userId, true);

      this.sendMessage(ws, {
        type: MessageType.AUTH_SUCCESS,
        payload: { userId, username, message: "Authentication successful" },
        timestamp: Date.now(),
      });

      this.broadcastPresenceUpdate(userId, "online");
    } catch (error) {
      this.sendMessage(ws, {
        type: MessageType.AUTH_ERROR,
        payload: { message: "Authentication error occurred" },
        timestamp: Date.now(),
      });
      setTimeout(() => ws.close(1011, "Internal error"), 1000);
    }
  }

  // MESSAGES, WEBSOCKET CYCLE

  private routeMessage(
    tempId: string,
    message: WebSocketMessage,
    ws: WebSocket,
    authTimeout: ReturnType<typeof setTimeout>,
    onAuthenticated: (realId: string) => void, // ✅
  ) {
    if (message.type === MessageType.AUTH || message.type === "AUTH") {
      const { token, userId, username } = message.payload;
      if (!token || !userId || !username) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: { message: "Missing token, userId, or username" },
          timestamp: Date.now(),
        });
        return;
      }
      // ✅ Pass callback to authenticateUser
      this.authenticateUser(
        tempId,
        userId,
        username,
        token,
        ws,
        authTimeout,
        onAuthenticated,
      );
      return;
    }

    // ✅ Now correctly looks up by tempId (which closure keeps current)
    const connection = connectionManager.getConnection(tempId);
    if (!connection?.isAuthenticated) {
      this.sendError(ws, "Not authenticated");
      return;
    }

    const realUserId = connection.userId;

    switch (message.type) {
      case MessageType.START_TRANSMISSION:
        this.handleStartTransmission(realUserId, message.payload);
        break;
      case MessageType.END_TRANSMISSION:
        this.handleEndTransmission(realUserId, message.payload);
        break;
      case MessageType.AUDIO_DATA:
        this.handleAudioChunk(realUserId, message.payload);
        break;
      case MessageType.JOIN_CHANNEL:
        this.handleJoinChannel(realUserId, message.payload);
        break;
      case MessageType.LEAVE_CHANNEL:
        this.handleLeaveChannel(realUserId, message.payload);
        break;
      case MessageType.MESSAGE:
        this.handleTextMessage(realUserId, message.payload);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleTextMessage(userId: string, payload: any) {
    const connection = connectionManager.getConnection(userId);
    if (!connection) return;
    try {
      let messageId;
      if (payload.channelId) {
        if (!connection.currentChannel) {
          this.sendError(connection.ws, "Not in a channel");
          return;
        }

        const savedMessage = await this.channelService!.saveMessage(
          payload.channelId,
          userId,
          payload.content,
        );

        messageId = savedMessage.id;

        this.broadcastToChannel(connection.currentChannel, {
          type: MessageType.MESSAGE,
          userId,
          username: connection.username,
          payload: {
            ...payload,
            messageId,
            timestamp: savedMessage.timestamp,
          },
          timestamp: savedMessage.timestamp,
        });
      } else if (payload.conversationId) {
        const savedMessage = await this.conversationService!.saveMessage(
          payload.conversationId,
          userId,
          payload.content,
        );

        messageId = savedMessage.id;

        const participants = await this.conversationService!.getParticipants(
          payload.conversationId,
        );

        participants.forEach((participant) => {
          const participantConn = connectionManager.getConnection(
            participant.id,
          );
          if (participantConn) {
            this.sendMessage(participantConn.ws, {
              type: MessageType.MESSAGE,
              userId,
              username: connection.username,
              payload: {
                ...payload,
                timestamp: savedMessage.timestamp,
              },
              timestamp: savedMessage.timestamp,
            });
          }
        });
      }
    } catch (error) {
      console.error("❌ Error saving message:", error);
      this.sendError(connection.ws, "Failed to send message");
    }
  }

  private async handleJoinChannel(userId: string, payload: JoinChannelPayload) {
    const { channelId, user } = payload;
    const connection = connectionManager.getConnection(userId);

    if (!connection) return;

    console.log(`👤 ${user.username} attempting to join channel ${channelId}`);

    try {
      if (connection.currentChannel) {
        await this.handleLeaveChannel(userId, {
          channelId: connection.currentChannel,
        });
      }

      const channel = channelManager.getChannel(channelId);

      if (!channel) {
        console.error(`❌ Channel ${channelId} not found in channel manager`);
        console.log(
          "📋 Available channels:",
          channelManager
            .getAllChannels()
            .map((c) => ({ id: c.id, name: c.name })),
        );
        this.sendError(connection.ws, "Channel not found");
        return;
      }

      try {
        await this.channelService!.addMember(channelId, userId);
        console.log(`✅ Successfully saved to database`);
      } catch (dbError) {
        console.error(`❌ DATABASE ERROR when adding member:`, dbError);
        this.sendError(
          connection.ws,
          "Failed to join channel - database error",
        );
        return;
      }

      const userObject: User = {
        id: user.userId,
        email: "",
        username: user.username,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const success = channelManager.addUserToChannel(channelId, userObject);

      if (!success) {
        console.error(`❌ Failed to add to channel manager`);
        this.sendError(connection.ws, "Failed to join channel");
        return;
      }

      connectionManager.updateConnectionChannel(userId, channelId);

      this.sendMessage(connection.ws, {
        type: MessageType.CHANNEL_JOINED,
        payload: {
          channelId,
          channelName: channel.name,
          success: true,
        },
        timestamp: Date.now(),
      });

      this.broadcastToChannel(
        channelId,
        {
          type: MessageType.USER_JOINED,
          payload: { channelId, user },
          timestamp: Date.now(),
        },
        userId,
      );

      const channelInfo = channelManager.getChannelInfo(channelId);
      this.broadcastToChannel(channelId, {
        type: MessageType.CHANNEL_UPDATE,
        payload: channelInfo,
        timestamp: Date.now(),
      });

      console.log(
        `✅ ${user.username} successfully joined ${channel.name} (in-memory + database)`,
      );
    } catch (error) {
      console.error("❌ Error joining channel:", error);
      this.sendError(connection.ws, "Failed to join channel");
    }
  }

  private async handleLeaveChannel(
    userId: string,
    payload: LeaveChannelPayload,
  ) {
    const { channelId } = payload;
    const connection = connectionManager.getConnection(userId);

    if (!connection) return;

    try {
      const transmission = connectionManager.getActiveTransmission(channelId);
      if (transmission && transmission.userId === userId) {
        connectionManager.endTransmission(channelId, userId);

        this.broadcastToChannel(channelId, {
          type: MessageType.TRANSMISSION_ENDED,
          payload: { channelId, userId },
          timestamp: Date.now(),
        });
      }

      await this.channelService!.removeMember(channelId, userId);

      channelManager.removeUserFromChannel(channelId, userId);

      connectionManager.updateConnectionChannel(userId, undefined);

      this.broadcastToChannel(channelId, {
        type: MessageType.USER_LEFT,
        payload: { channelId, userId },
        timestamp: Date.now(),
      });

      const channelInfo = channelManager.getChannelInfo(channelId);
      this.broadcastToChannel(channelId, {
        type: MessageType.CHANNEL_UPDATE,
        payload: channelInfo,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("❌ Error leaving channel:", error);
    }
  }

  private handleStartTransmission(
    userId: string,
    payload: StartTransmissionPayload,
  ) {
    const { channelId } = payload;
    const connection = connectionManager.getConnection(userId);

    if (!connection) return;

    if (!channelManager.isUserInChannel(channelId, userId)) {
      this.sendError(connection.ws, "Not in channel");
      return;
    }

    const success = connectionManager.startTransmission(
      channelId,
      userId,
      connection.username,
    );

    if (!success) {
      const activeTransmission =
        connectionManager.getActiveTransmission(channelId);
      this.sendError(
        connection.ws,
        `Channel busy - ${activeTransmission?.username} is speaking`,
      );
      return;
    }

    this.broadcastToChannel(channelId, {
      type: MessageType.TRANSMISSION_STARTED,
      userId,
      username: connection.username,
      payload: {
        channelId,
        userId,
        username: connection.username,
      },
      timestamp: Date.now(),
    });
  }

  private handleAudioChunk(userId: string, payload: AudioChunkPayload) {
    const { channelId, audioData } = payload;

    if (!connectionManager.isTransmitting(channelId, userId)) {
      console.warn(`⚠️ User ${userId} sent audio but is not transmitting`);
      return;
    }

    const connection = connectionManager.getConnection(userId);

    this.broadcastToChannel(
      channelId,
      {
        type: MessageType.AUDIO_DATA,
        userId,
        username: connection?.username,
        payload: { channelId, audioData },
        timestamp: Date.now(),
      },
      userId,
    );
  }

  private handleEndTransmission(
    userId: string,
    payload: EndTransmissionPayload,
  ) {
    const { channelId } = payload;
    const connection = connectionManager.getConnection(userId);

    const duration = connectionManager.endTransmission(channelId, userId);

    if (duration !== null) {
      this.broadcastToChannel(channelId, {
        type: MessageType.TRANSMISSION_ENDED,
        userId,
        username: connection?.username,
        payload: { channelId, userId, duration },
        timestamp: Date.now(),
      });
    }
  }

  private async handleDisconnect(userId: string) {
    const connection = connectionManager.getConnection(userId);

    console.log(`\n=== USER DISCONNECTED ===`);
    console.log(`User: ${connection?.username} (${userId})`);

    if (connection?.currentChannel) {
      await this.handleLeaveChannel(userId, {
        channelId: connection.currentChannel,
      });
    }

    await this.activeUserService!.setUserOffline(userId);

    this.broadcastPresenceUpdate(userId, "offline");

    connectionManager.removeConnection(userId);

    console.log(`👋 User ${userId} marked as offline`);
  }

  private broadcastToChannel(
    channelId: string,
    message: WebSocketMessage,
    excludeUserId?: string,
  ) {
    const connections = connectionManager.getConnectionsByChannel(channelId);

    connections.forEach((conn) => {
      if (excludeUserId && conn.userId === excludeUserId) return;
      this.sendMessage(conn.ws, message);
    });
  }

  broadcastPresenceUpdate(userId: string, status: string) {
    const message: WebSocketMessage = {
      type: "presence_update" as any,
      payload: {
        userId,
        status,
      },
      timestamp: Date.now(),
    };

    const allConnections = connectionManager.getAllConnections();
    allConnections.forEach((conn) => {
      this.sendMessage(conn.ws, message);
    });

    console.log(`📢 Broadcasted: User ${userId} is now ${status}`);
  }

  private sendMessage(ws: any, message: WebSocketMessage) {
    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("❌ Failed to send message:", error);
    }
  }

  private sendError(ws: any, error: string) {
    this.sendMessage(ws, {
      type: MessageType.ERROR,
      payload: { error },
      timestamp: Date.now(),
    });
  }

  startHeartbeat() {
    setInterval(() => {
      const connections = connectionManager.getAllConnections();
      connections.forEach(async (conn) => {
        if (!conn.isAlive) {
          console.log(`💀 Terminating dead connection: ${conn.username}`);
          conn.ws.terminate();
          await this.handleDisconnect(conn.userId);
          return;
        }
        connectionManager.markDead(conn.userId);
        if (conn.isAuthenticated) {
          await this.activeUserService!.updateLastSeen(conn.userId);
        }
        try {
          conn.ws.ping();
        } catch (error) {
          console.error(`❌ Ping failed for ${conn.username}:`, error);
        }
      });
    }, 30000);
  }

  getStats() {
    return {
      connections: connectionManager.getStats(),
      channels: channelManager.getAllChannels().map((channel) => ({
        id: channel.id,
        name: channel.name,
        activeUsers: channel.activeUsers,
      })),
    };
  }
}

export default new WebSocketHandler();
