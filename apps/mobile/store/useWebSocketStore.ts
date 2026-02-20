import { create } from "zustand";
import { Platform } from "react-native";
import { WebSocketMessage } from "@/@types/talkie";
import { supabase } from "@/lib/supabase/client";

interface WebSocketStore {
  ws: WebSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionError: string | null;
  userId: string;
  username: string;
  messages: WebSocketMessage[];
  onlineUsers: Set<string>;
  onChannelJoined?: (channelId: string) => void;
  onChannelLeft?: (channelId: string) => void;
  onPresenceUpdate?: (userId: string, status: string) => void;
  initializeWebSocket: () => Promise<void>;
  sendMessage: (data: WebSocketMessage) => void;
  cleanup: () => void;
  isUserOnline: (userId: string) => boolean;
  getOnlineUsers: () => string[];
}

const getWebSocketURL = (token: string, userId: string, username: string) => {
  const params = new URLSearchParams({ token, userId, username });
  const baseUrl =
    Platform.OS === "web"
      ? "ws://localhost:3001/ws"
      : "ws://192.168.1.10:3001/ws";
  return `${baseUrl}?${params.toString()}`;
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
        console.error("❌ No session found");
        set({ connectionError: "Authentication required - please log in" });
        return;
      }

      const userId = session.user.id;
      const token = session.access_token;
      const username = await getUsernameFromSession(userId);
      const wsUrl = getWebSocketURL(token, userId, username);
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        set({ isConnected: true, connectionError: null });
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          const messageType = String(data.type).toLowerCase();
          console.log("📨 Received:", data.type, data);

          switch (messageType) {
            case "auth_success":
              console.log("✅ Authenticated successfully");
              set({ isAuthenticated: true, connectionError: null });
              break;

            case "auth_error":
              console.error("❌ Auth error:", data.payload?.message);
              set({
                isAuthenticated: false,
                connectionError:
                  data.payload?.message || "Authentication failed",
              });
              socket.close();
              break;

            case "__connected":
              console.log("🔌 Connected to WebSocket server");
              break;

            case "presence_update":
              const { userId: presenceUserId, status } = data.payload;
              set((state) => {
                const newOnlineUsers = new Set(state.onlineUsers);
                if (status === "online") {
                  newOnlineUsers.add(presenceUserId);
                } else {
                  newOnlineUsers.delete(presenceUserId);
                }
                return { onlineUsers: newOnlineUsers };
              });
              get().onPresenceUpdate?.(presenceUserId, status);
              break;

            case "channel_joined":
              if (data.payload?.channelId) {
                get().onChannelJoined?.(data.payload.channelId);
              }
              break;

            case "user_left":
            case "channel_left":
              if (data.payload?.channelId) {
                get().onChannelLeft?.(data.payload.channelId);
              }
              break;

            case "error":
              set({ connectionError: data.payload?.error });
              break;

            default:
              set((state) => ({ messages: [...state.messages, data] }));
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
          onlineUsers: new Set(),
        });

        if (event.code !== 1000) {
          console.log("🔄 Reconnecting in 5 seconds...");
          setTimeout(() => get().initializeWebSocket(), 5000);
        }
      };

      set({ ws: socket, userId, username, connectionError: null });
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket:", error);
      set({
        connectionError:
          error instanceof Error ? error.message : "Unknown error",
      });
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
    console.log("📤 Sending:", data.type);
    ws.send(JSON.stringify(data));
  },

  isUserOnline: (userId) => get().onlineUsers.has(userId),
  getOnlineUsers: () => Array.from(get().onlineUsers),

  cleanup: () => {
    const { ws } = get();
    if (ws) {
      console.log("🧹 Cleaning up WebSocket");
      ws.close(1000, "Client cleanup");
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
