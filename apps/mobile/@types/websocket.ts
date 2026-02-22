import { Conversation } from "@/api/services/conversationServices";
import { WebSocketMessage } from "./talkie";

export interface LastMessage {
  content: string;
  timestamp: number;
  sender: { userId: string; username: string };
}

export interface WebSocketStore {
  ws: WebSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
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
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  updateConversationLastMessage: (
    conversationId: string,
    message: LastMessage,
    isOwn: boolean,
  ) => void;
  markConversationAsRead: (conversationId: string) => void;
}
