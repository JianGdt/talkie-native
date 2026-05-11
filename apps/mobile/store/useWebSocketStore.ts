import { create } from "zustand";
import { Platform } from "react-native";
import { MessageType, WebSocketMessage } from "@/@types/talkie";
import { supabase } from "@/lib/supabase/client";
import { WebSocketStore } from "@/@types/websocket";
import {
  getReconnectDelay,
  MAX_RECONNECT_ATTEMPTS,
  NO_RECONNECT_CODES,
} from "@/constant/chats";
const getWebSocketURL = (): string => {
  const wsUrl = "ws://localhost:3001/ws";
  const wsHost = "localhost:3001";

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
  } catch (error) {
    console.log("error ", error);
  }

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

export let reconnectAttempts = 0;

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

  typingUsers: {},

  activeCall: null,
  setActiveCall: (call) => set({ activeCall: call }),

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

  setTypingUser: (conversationId, userId, isTyping) => {
    set((state) => {
      const current = new Set(state.typingUsers[conversationId] ?? []);
      isTyping ? current.add(userId) : current.delete(userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: current },
      };
    });
  },

  isUserTyping: (conversationId, userId) => {
    return get().typingUsers[conversationId]?.has(userId) ?? false;
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
            case MessageType.TYPING: {
              const {
                conversationId,
                userId: typingUserId,
                isTyping,
              } = data.payload;
              if (!conversationId || !typingUserId) return;
              get().setTypingUser(conversationId, typingUserId, isTyping);
              break;
            }

            // ─────────────────────────────────────────────
            // Calls (WebRTC signaling)
            // ─────────────────────────────────────────────
            case MessageType.CALL_INVITE: {
              const { callId, fromUserId, conversationId, name } =
                (data.payload as any) ?? {};
              if (!callId || !fromUserId) return;
              set({
                activeCall: {
                  callId,
                  otherUserId: fromUserId,
                  conversationId,
                  otherUserName: name,
                  isIncoming: true,
                  status: "ringing",
                },
              });
              break;
            }
            case MessageType.CALL_ACCEPT: {
              const { callId } = (data.payload as any) ?? {};
              if (!callId) return;
              set((state) => {
                const current = state.activeCall;
                if (!current || current.callId !== callId) return {};
                return {
                  activeCall: { ...current, status: "connecting" },
                };
              });
              break;
            }
            case MessageType.CALL_REJECT: {
              const { callId } = (data.payload as any) ?? {};
              if (!callId) return;
              set((state) => {
                const current = state.activeCall;
                if (!current || current.callId !== callId) return {};
                return { activeCall: { ...current, status: "rejected" } };
              });
              break;
            }
            case MessageType.CALL_END: {
              const { callId } = (data.payload as any) ?? {};
              if (!callId) return;
              set((state) => {
                const current = state.activeCall;
                if (!current || current.callId !== callId) return {};
                return { activeCall: { ...current, status: "ended" } };
              });
              break;
            }
            case MessageType.WEBRTC_OFFER: {
              const { callId, offer, fromUserId } = (data.payload as any) ?? {};
              if (!callId || !offer || !fromUserId) return;
              set((state) => {
                const existing = state.activeCall;
                if (existing && existing.callId === callId) {
                  return { activeCall: { ...existing, offer } };
                }
                return {
                  activeCall: {
                    callId,
                    otherUserId: fromUserId,
                    isIncoming: true,
                    status: "connecting",
                    offer,
                  },
                };
              });
              break;
            }
            case MessageType.WEBRTC_ANSWER:
            case MessageType.WEBRTC_ICE_CANDIDATE:
              // handled in-call screen via store ws messages (kept in `messages`)
              break;
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

  sendCallInvite: ({ toUserId, callId, conversationId, name }) => {
    get().sendMessage({
      type: MessageType.CALL_INVITE,
      payload: { toUserId, callId, conversationId, name },
      timestamp: Date.now(),
    });
    set({
      activeCall: {
        callId,
        otherUserId: toUserId,
        conversationId,
        otherUserName: name,
        isIncoming: false,
        status: "ringing",
      },
    });
  },
  sendCallAccept: ({ toUserId, callId }) => {
    get().sendMessage({
      type: MessageType.CALL_ACCEPT,
      payload: { toUserId, callId },
      timestamp: Date.now(),
    });
    set((state) => {
      const current = state.activeCall;
      if (!current || current.callId !== callId) return {};
      return { activeCall: { ...current, status: "connecting" } };
    });
  },
  sendCallReject: ({ toUserId, callId }) => {
    get().sendMessage({
      type: MessageType.CALL_REJECT,
      payload: { toUserId, callId },
      timestamp: Date.now(),
    });
    set((state) => {
      const current = state.activeCall;
      if (!current || current.callId !== callId) return {};
      return { activeCall: { ...current, status: "rejected" } };
    });
  },
  sendCallEnd: ({ toUserId, callId }) => {
    get().sendMessage({
      type: MessageType.CALL_END,
      payload: { toUserId, callId },
      timestamp: Date.now(),
    });
    set((state) => {
      const current = state.activeCall;
      if (!current || current.callId !== callId) return {};
      return { activeCall: { ...current, status: "ended" } };
    });
  },
  sendWebRTCOffer: ({ toUserId, callId, offer }) => {
    get().sendMessage({
      type: MessageType.WEBRTC_OFFER,
      payload: { toUserId, callId, offer },
      timestamp: Date.now(),
    });
  },
  sendWebRTCAnswer: ({ toUserId, callId, answer }) => {
    get().sendMessage({
      type: MessageType.WEBRTC_ANSWER,
      payload: { toUserId, callId, answer },
      timestamp: Date.now(),
    });
  },
  sendWebRTCIceCandidate: ({ toUserId, callId, candidate }) => {
    get().sendMessage({
      type: MessageType.WEBRTC_ICE_CANDIDATE,
      payload: { toUserId, callId, candidate },
      timestamp: Date.now(),
    });
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
      isInitializing: false,
      userId: "",
      username: "",
      connectionError: null,
      onlineUsers: new Set(),
      onChannelJoined: undefined,
      onChannelLeft: undefined,
      onPresenceUpdate: undefined,
      activeCall: null,
    });
  },
}));
