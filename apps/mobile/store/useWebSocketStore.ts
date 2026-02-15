import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { Platform } from "react-native";
import { WebSocketMessage } from "@/@types/talkie";

interface WebSocketStore {
  ws: WebSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;

  userId: string;
  username: string;

  messages: WebSocketMessage[];

  // Presence tracking
  onlineUsers: Set<string>;

  // Add callback for channel events
  onChannelJoined?: (channelId: string) => void;
  onChannelLeft?: (channelId: string) => void;
  onPresenceUpdate?: (userId: string, status: string) => void;

  initializeWebSocket: () => Promise<void>;
  sendMessage: (data: WebSocketMessage) => void;
  cleanup: () => void;

  // Add methods to set callbacks
  setOnChannelJoined: (callback: (channelId: string) => void) => void;
  setOnChannelLeft: (callback: (channelId: string) => void) => void;
  setOnPresenceUpdate: (
    callback: (userId: string, status: string) => void,
  ) => void;

  // Presence methods
  isUserOnline: (userId: string) => boolean;
  getOnlineUsers: () => string[];
}

const getWebSocketURL = (token: string, userId: string, username: string) => {
  const params = new URLSearchParams({
    token,
    userId,
    username,
  });

  let baseUrl = "ws://localhost:3001/ws";

  if (Platform.OS === "web") {
    baseUrl = "ws://localhost:3001/ws";
  } else {
    // For mobile/native apps, use your computer's local IP
    baseUrl = "ws://192.168.1.10:3001/ws"; // Update with your IP
  }

  console.log("🔌 WebSocket URL:", baseUrl);
  return `${baseUrl}?${params.toString()}`;
};

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  isConnected: false,
  isAuthenticated: false,
  connectionError: null,
  userId: "",
  username: "",
  messages: [],
  onlineUsers: new Set<string>(),
  onChannelJoined: undefined,
  onChannelLeft: undefined,
  onPresenceUpdate: undefined,

  initializeWebSocket: async () => {
    try {
      const { ws } = get();
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("⚠️ WebSocket already connected");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        set({ connectionError: "Authentication required - please log in" });
        return;
      }

      const userId = session.user.id;
      const username =
        session.user.user_metadata?.username ||
        session.user.email?.split("@")[0] ||
        "Anonymous";
      const token = session.access_token;

      const wsUrl = getWebSocketURL(token, userId, username);

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        set({
          isConnected: true,
          connectionError: null,
        });
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          const messageType = String(data.type).toLowerCase();

          console.log("📨 Received:", data.type, data);

          switch (messageType) {
            case "auth_success":
              console.log("✅ Authenticated successfully - user is now online");
              set({
                isAuthenticated: true,
                connectionError: null,
              });
              break;

            case "auth_error":
              set({
                isAuthenticated: false,
                connectionError:
                  data.payload?.message || "Authentication failed",
              });
              break;

            case "__connected":
              console.log("🔌 Connected to WebSocket server");
              break;

            // ✨ PRESENCE UPDATE HANDLING
            case "presence_update":
              const { userId: presenceUserId, status } = data.payload;

              set((state) => {
                const newOnlineUsers = new Set(state.onlineUsers);

                if (status === "online") {
                  newOnlineUsers.add(presenceUserId);
                  console.log(
                    `👤 User ${presenceUserId} is now online (${newOnlineUsers.size} online)`,
                  );
                } else {
                  newOnlineUsers.delete(presenceUserId);
                  console.log(
                    `👋 User ${presenceUserId} is now offline (${newOnlineUsers.size} online)`,
                  );
                }

                return { onlineUsers: newOnlineUsers };
              });

              // Call callback if set
              const { onPresenceUpdate } = get();
              if (onPresenceUpdate) {
                onPresenceUpdate(presenceUserId, status);
              }
              break;

            case "channel_joined":
              const { onChannelJoined } = get();
              if (onChannelJoined && data.payload?.channelId) {
                onChannelJoined(data.payload.channelId);
              }
              break;

            case "user_left":
            case "channel_left":
              const { onChannelLeft } = get();
              if (onChannelLeft && data.payload?.channelId) {
                onChannelLeft(data.payload.channelId);
              }
              break;

            case "error":
              set({
                connectionError: data.payload?.error,
              });
              break;

            default:
              set((state) => ({
                messages: [...state.messages, data],
              }));
              break;
          }
        } catch (err) {
          console.error("❌ Failed to parse message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        set({
          isConnected: false,
          isAuthenticated: false,
          connectionError: "Connection error",
        });
      };

      socket.onclose = (event) => {
        console.log("🔌 WebSocket closed:", event.code, event.reason);
        set({
          isConnected: false,
          isAuthenticated: false,
          onlineUsers: new Set(), // Clear online users on disconnect
        });

        // Auto-reconnect after 5 seconds if not a normal closure
        if (event.code !== 1000 && session?.user) {
          console.log("🔄 Attempting to reconnect in 5 seconds...");
          setTimeout(() => {
            get().initializeWebSocket();
          }, 5000);
        }
      };

      set({
        ws: socket,
        userId,
        username,
        connectionError: null,
      });
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      set({
        connectionError:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  sendMessage: (data: WebSocketMessage) => {
    const { ws, isAuthenticated } = get();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("⚠️ WebSocket not ready");
      return;
    }

    if (!isAuthenticated) {
      console.error("⚠️ Not authenticated - message blocked");
      return;
    }

    console.log("📤 Sending:", data.type);
    ws.send(JSON.stringify(data));
  },

  setOnChannelJoined: (callback) => {
    set({ onChannelJoined: callback });
  },

  setOnChannelLeft: (callback) => {
    set({ onChannelLeft: callback });
  },

  setOnPresenceUpdate: (callback) => {
    set({ onPresenceUpdate: callback });
  },

  // ✨ PRESENCE UTILITY METHODS
  isUserOnline: (userId: string) => {
    return get().onlineUsers.has(userId);
  },

  getOnlineUsers: () => {
    return Array.from(get().onlineUsers);
  },

  cleanup: () => {
    const { ws } = get();

    if (ws) {
      console.log("🧹 Cleaning up WebSocket");
      ws.close(1000, "Client cleanup"); // 1000 = normal closure
    }

    set({
      ws: null,
      messages: [],
      isConnected: false,
      isAuthenticated: false,
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
