import { create } from "zustand";
import { Platform } from "react-native";
import { MessageType, WebSocketMessage } from "@/@types/talkie";
import { supabase } from "@/lib/supabase/client";
import { Conversation } from "@/api/services/conversationServices";
import { WebSocketStore } from "@/@types/websocket";

const getWebSocketURL = (): string => {
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";
  const wsHost = process.env.EXPO_PUBLIC_WS_HOST ?? "localhost:3001";

  return Platform.OS === "web" ? wsUrl : `ws://${wsHost}/ws`;
};
const getUsernameFromSession = async (userId: string): Promise<string> => {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.username) return data.username;
  } catch (_) {}

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return (
    session?.user?.user_metadata?.username ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Anonymous"
  );
};

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const getReconnectDelay = () => Math.min(1000 * 2 ** reconnectAttempts, 30000);

const NO_RECONNECT_CODES = new Set([1000, 1001, 1008]);

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  isConnected: false,
  isAuthenticated: false,
  isInitializing: false,
  connectionError: null,
  userId: "",
  username: "",
  messages: [],
  onlineUsers: new Set<string>(),
  onChannelJoined: undefined,
  onChannelLeft: undefined,
  onPresenceUpdate: undefined,
  conversations: [],

  setConversations: (conversations) => set({ conversations }),

  updateConversationLastMessage: (conversationId, message, isOwn) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              last_message: {
                content: message.content,
                timestamp: message.timestamp,
                sender: message.sender?.username,
                isRead: isOwn,
              },
              unread_count: isOwn ? 0 : conv.unread_count + 1,
            }
          : conv,
      ),
    }));
  },

  markConversationAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              unread_count: 0,
              last_message: conv.last_message
                ? { ...conv.last_message, isRead: true }
                : conv.last_message,
            }
          : conv,
      ),
    }));
  },

  initializeWebSocket: async () => {
    const { ws, isInitializing } = get();

    if (isInitializing) return;
    if (ws?.readyState === WebSocket.OPEN) return;
    if (ws?.readyState === WebSocket.CONNECTING) return;

    set({ isInitializing: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || !session.access_token) {
        set({
          connectionError: "Authentication required",
          isInitializing: false,
        });
        return;
      }

      const userId = session.user.id;
      const token = session.access_token;
      const username = await getUsernameFromSession(userId);
      const socket = new WebSocket(getWebSocketURL());

      socket.onopen = () => {
        set({ isConnected: true, connectionError: null });
        reconnectAttempts = 0;

        socket.send(
          JSON.stringify({
            type: MessageType.AUTH,
            payload: { token, userId, username },
          }),
        );
      };

      socket.onmessage = (event) => {
        try {
          if (event.data.length > 100_000) {
            console.warn("⚠️ Oversized WebSocket message dropped");
            return;
          }

          const data: WebSocketMessage = JSON.parse(event.data);

          switch (data.type) {
            case MessageType.AUTH_SUCCESS:
              set({ isAuthenticated: true, connectionError: null });
              break;

            case MessageType.AUTH_ERROR:
              set({
                isAuthenticated: false,
                connectionError:
                  data.payload?.message || "Authentication failed",
              });
              socket.close(1008, "Auth failed");
              break;

            case MessageType.CHANNEL_JOINED:
              if (data.payload?.channelId) {
                get().onChannelJoined?.(data.payload.channelId);
              }
              break;

            case MessageType.USER_LEFT:
              if (data.payload?.channelId) {
                get().onChannelLeft?.(data.payload.channelId);
              }
              break;

            case MessageType.ERROR:
              set({ connectionError: data.payload?.error });
              break;

            case MessageType.MESSAGE: {
              const { conversationId, content, timestamp, sender } =
                data.payload;
              if (!conversationId || !content || !sender?.userId) return;

              const currentUserId = get().userId;
              const isOwn = sender.userId === currentUserId;
              const exists = get().conversations.some(
                (c) => c.id === conversationId,
              );

              if (exists) {
                get().updateConversationLastMessage(
                  conversationId,
                  { content, timestamp, sender },
                  isOwn,
                );
              }

              set((state) => ({ messages: [...state.messages, data] }));
              break;
            }

            case MessageType.PRESENCE_UPDATE: {
              const { userId: presenceUserId, status } = data.payload;
              if (!presenceUserId || !["online", "offline"].includes(status))
                return;

              set((state) => {
                const newOnlineUsers = new Set(state.onlineUsers);
                status === "online"
                  ? newOnlineUsers.add(presenceUserId)
                  : newOnlineUsers.delete(presenceUserId);
                return { onlineUsers: newOnlineUsers };
              });
              get().onPresenceUpdate?.(presenceUserId, status);
              break;
            }
          }
        } catch (err) {
          console.error("❌ Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = () => {
        set({
          isConnected: false,
          isAuthenticated: false,
          connectionError: "Connection error",
        });
      };

      socket.onclose = (event) => {
        set({
          isConnected: false,
          isAuthenticated: false,
          isInitializing: false,
          onlineUsers: new Set(),
        });

        const shouldReconnect =
          !NO_RECONNECT_CODES.has(event.code) &&
          reconnectAttempts < MAX_RECONNECT_ATTEMPTS;

        if (shouldReconnect) {
          const delay = getReconnectDelay();
          reconnectAttempts++;
          setTimeout(() => get().initializeWebSocket(), delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          set({ connectionError: "Connection lost. Please restart the app." });
        }
      };

      set({ ws: socket, userId, username, connectionError: null });
    } catch (error) {
      set({
        connectionError:
          error instanceof Error ? error.message : "Unknown error",
        isInitializing: false,
      });
    } finally {
      set({ isInitializing: false });
    }
  },

  sendMessage: (data: WebSocketMessage) => {
    const { ws, isAuthenticated } = get();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ Cannot send - WS not open");
      return;
    }
    if (!isAuthenticated) {
      console.warn("⚠️ Cannot send - not authenticated");
      return;
    }

    const payload = JSON.stringify(data);
    if (payload.length > 10_000) {
      console.warn("⚠️ Message too large, rejected");
      return;
    }

    ws.send(payload);
  },

  isUserOnline: (userId) => get().onlineUsers.has(userId),
  getOnlineUsers: () => Array.from(get().onlineUsers),

  cleanup: () => {
    const { ws, isAuthenticated, userId } = get();

    if (ws?.readyState === WebSocket.OPEN && isAuthenticated) {
      // ✅ Use enum
      ws.send(
        JSON.stringify({
          type: MessageType.PRESENCE_UPDATE,
          payload: { userId, status: "offline" },
        }),
      );
    }

    ws?.close(1000, "Client cleanup");
    reconnectAttempts = 0;

    set({
      ws: null,
      messages: [],
      conversations: [],
      isConnected: false,
      isAuthenticated: false,
      isInitializing: false, // ✅
      userId: "",
      username: "",
      connectionError: null,
      onlineUsers: new Set(),
      onChannelJoined: undefined,
      onChannelLeft: undefined,
      onPresenceUpdate: undefined,
    });
  },
}));
