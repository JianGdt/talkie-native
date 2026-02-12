import { FastifyInstance, FastifyRequest } from "fastify";
import { WebSocket } from "ws";
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

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

class WebSocketHandler {
  private fastify: FastifyInstance | null = null;

  initialize(fastify: FastifyInstance) {
    this.fastify = fastify;
    console.log("initialized from backend");
  }

  async handleConnection(ws: WebSocket, req: FastifyRequest) {
    const { userId, username, token } = req.query as {
      userId: string;
      username: string;
      token?: string;
    };

    if (!userId || !username) {
      ws.close(1008, "Missing userId or username");
      return;
    }

    const clientConnection: ClientConnection = {
      ws,
      userId,
      username,
      isAlive: true,
      isAuthenticated: false,
    };

    connectionManager.addConnection(userId, clientConnection);

    if (token) {
      await this.authenticateUser(userId, token, ws);
    } else {
      this.sendMessage(ws, {
        type: "__connected",
        payload: {
          message: "Connected, send AUTH message with token",
        },
        timestamp: Date.now(),
      });
    }

    this.setupSocketListeners(userId, ws);
  }

  private setupSocketListeners(userId: string, ws: any) {
    ws.on("message", (message: Buffer) => {
      try {
        const parsed = JSON.parse(message.toString());
        this.routeMessage(userId, parsed, ws);
      } catch (error) {
        console.error("❌ Failed to parse message:", error);
        this.sendError(ws, "Invalid message format");
      }
    });

    ws.on("pong", () => {
      connectionManager.markAlive(userId);
    });

    ws.on("close", () => {
      this.handleDisconnect(userId);
    });

    ws.on("error", (error: Error) => {
      console.error(`🔥 WebSocket error for ${userId}:`, error);
    });
  }

  private async authenticateUser(userId: string, token: string, ws: any) {
    console.log(`auth user ${userId}`);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: {
            message: "Invalid or expired token",
          },
          timestamp: Date.now(),
        });

        setTimeout(() => ws.close(1008, "Authentication failed"), 1000);
        return;
      }

      if (user.id !== userId) {
        this.sendMessage(ws, {
          type: MessageType.AUTH_ERROR,
          payload: {
            message: "UserId mismatch",
          },
          timestamp: Date.now(),
        });

        setTimeout(() => ws.close(1008, "Authentication failed"), 1000);
        return;
      }

      connectionManager.markAuthenticated(userId, true);
      const connection = connectionManager.getConnection(userId);

      this.sendMessage(ws, {
        type: MessageType.AUTH_SUCCESS,
        payload: {
          userId,
          username: connection?.username,
          message: "Authentication successful",
        },
        timestamp: Date.now(),
      });

      console.log(`✅ User ${userId} authenticated successfully`);
    } catch (error) {
      console.error("❌ Authentication error:", error);
      this.sendMessage(ws, {
        type: MessageType.AUTH_ERROR,
        payload: {
          message: "Authentication error occurred",
        },
        timestamp: Date.now(),
      });

      setTimeout(() => ws.close(1011, "Internal error"), 1000);
    }
  }

  private routeMessage(
    userId: string,
    message: WebSocketMessage,
    ws: WebSocket,
  ) {
    const connection = connectionManager.getConnection(userId);

    if (message.type === MessageType.AUTH || message.type === "AUTH") {
      const { token } = message.payload;
      if (token) {
        this.authenticateUser(userId, token, ws);
      }
      return;
    }

    if (!connection?.isAuthenticated) {
      this.sendError(ws, "Not authenticated");
      return;
    }

    // COMMUNICATE OR MESSAGE CYCLE

    switch (message.type) {
      case MessageType.START_TRANSMISSION:
        this.handleStartTransmission(userId, message.payload);
        break;

      case MessageType.END_TRANSMISSION:
        this.handleEndTransmission(userId, message.payload);
        break;

      case MessageType.AUDIO_DATA:
        this.handleAudioChunk(userId, message.payload);
        break;

      case MessageType.JOIN_CHANNEL:
        this.handleJoinChannel(userId, message.payload);
        break;

      case MessageType.LEAVE_CHANNEL:
        this.handleLeaveChannel(userId, message.payload);
        break;

      case MessageType.MESSAGE:
        this.handleTextMessage(userId, message.payload);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleTextMessage(userId: string, payload: any) {
    const connection = connectionManager.getConnection(userId);
    if (!connection?.currentChannel) {
      this.sendError(connection!.ws, "Not in a channel");
      return;
    }

    this.broadcastToChannel(connection.currentChannel, {
      type: MessageType.MESSAGE,
      userId,
      username: connection.username,
      payload: payload,
      timestamp: Date.now(),
    });
  }

  private handleJoinChannel(userId: string, payload: JoinChannelPayload) {
    const { channelId, user } = payload;
    const connection = connectionManager.getConnection(userId);

    if (!connection) return;

    console.log(`👤 ${user.username} joining channel ${channelId}`);

    if (connection.currentChannel) {
      this.handleLeaveChannel(userId, { channelId: connection.currentChannel });
    }

    // Create a proper User object from the payload
    const userObject: User = {
      id: user.userId,
      email: "", // You might want to store this in connection or fetch from DB
      username: user.username,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const success = channelManager.addUserToChannel(channelId, userObject);

    if (!success) {
      this.sendError(connection.ws, "Channel not found");
      return;
    }

    connectionManager.updateConnectionChannel(userId, channelId);

    this.broadcastToChannel(channelId, {
      type: MessageType.USER_JOINED,
      payload: { channelId, user },
      timestamp: Date.now(),
    });

    const channelInfo = channelManager.getChannelInfo(channelId);
    this.broadcastToChannel(channelId, {
      type: MessageType.CHANNEL_UPDATE,
      payload: channelInfo,
      timestamp: Date.now(),
    });
  }

  private handleLeaveChannel(userId: string, payload: LeaveChannelPayload) {
    const { channelId } = payload;
    const connection = connectionManager.getConnection(userId);

    if (!connection) return;

    const transmission = connectionManager.getActiveTransmission(channelId);
    if (transmission && transmission.userId === userId) {
      connectionManager.endTransmission(channelId, userId);

      this.broadcastToChannel(channelId, {
        type: MessageType.TRANSMISSION_ENDED,
        payload: { channelId, userId },
        timestamp: Date.now(),
      });
    }

    channelManager.removeUserFromChannel(channelId, userId);
    connectionManager.updateConnectionChannel(userId, undefined);

    this.broadcastToChannel(channelId, {
      type: MessageType.USER_LEFT,
      payload: { channelId, userId },
      timestamp: Date.now(),
    });

    // Send updated channel info
    const channelInfo = channelManager.getChannelInfo(channelId);
    this.broadcastToChannel(channelId, {
      type: MessageType.CHANNEL_UPDATE,
      payload: channelInfo,
      timestamp: Date.now(),
    });
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

    // Broadcast to all EXCEPT sender
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

  private handleDisconnect(userId: string) {
    const connection = connectionManager.getConnection(userId);

    console.log(`\n=== USER DISCONNECTED ===`);
    console.log(`User: ${connection?.username} (${userId})`);

    if (connection?.currentChannel) {
      this.handleLeaveChannel(userId, { channelId: connection.currentChannel });
    }

    connectionManager.removeConnection(userId);
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
      connections.forEach((conn) => {
        if (!conn.isAlive) {
          console.log(`💀 Terminating dead connection: ${conn.username}`);
          conn.ws.terminate();
          this.handleDisconnect(conn.userId);
          return;
        }

        connectionManager.markDead(conn.userId);

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
