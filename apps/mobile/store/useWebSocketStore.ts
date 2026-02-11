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

  initializeWebSocket: () => Promise<void>;
  sendMessage: (data: WebSocketMessage) => void;
  cleanup: () => void;
}

const getWebSocketURL = (token: string, userId: string, username: string) => {
  const params = new URLSearchParams({
    token,
    userId,
    username,
  });

  let baseUrl = "";

  if (Platform.OS === "web") {
    baseUrl = "ws://localhost:3001/ws"; // Backend WS URL
  } else if (Platform.OS === "android") {
    baseUrl = "ws://localhost:3001/ws";
  } else {
    baseUrl = "ws://192.168.1.10:3001/ws";
  }

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
      const username = session.user.email?.split("@")[0] || "Anonymous";
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

          console.log("📨 Received:", data.type);

          switch (messageType) {
            case "auth_success":
              set({
                isAuthenticated: true,
                connectionError: null,
              });
              break;

            case "auth_error":
              console.error("❌ Auth failed:", data.payload?.message);
              set({
                isAuthenticated: false,
                connectionError:
                  data.payload?.message || "Authentication failed",
              });
              break;

            case "__connected":
              console.log("📡 Connected, waiting for auth...");
              break;

            case "error":
              console.error("❌ Error:", data.payload?.error);
              set({
                connectionError: data.payload?.error,
              });
              break;

            default:
              console.log("📥 Message:", messageType);
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
        });
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

  // ============================================
  // SEND MESSAGE
  // ============================================
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
    ws.send(JSON.stringify(data));
  },

  cleanup: () => {
    const { ws } = get();

    if (ws) {
      console.log("🧹 Cleaning up WebSocket");
      ws.close();
    }

    set({
      ws: null,
      messages: [],
      isConnected: false,
      isAuthenticated: false,
      userId: "",
      username: "",
      connectionError: null,
    });
  },
}));
