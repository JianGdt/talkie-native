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

  typingUsers: Record<string, Set<string>>; 
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  isUserTyping: (conversationId: string, userId: string) => boolean;

  // Calls (WebRTC)
  activeCall:
    | null
    | {
        callId: string;
        otherUserId: string;
        conversationId?: string;
        otherUserName?: string;
        isIncoming: boolean;
        status:
          | "idle"
          | "ringing"
          | "connecting"
          | "in_call"
          | "ended"
          | "rejected";
        offer?: any;
      };
  setActiveCall: (call: WebSocketStore["activeCall"]) => void;
  sendCallInvite: (params: {
    toUserId: string;
    callId: string;
    conversationId?: string;
    name?: string;
  }) => void;
  sendCallAccept: (params: { toUserId: string; callId: string }) => void;
  sendCallReject: (params: { toUserId: string; callId: string }) => void;
  sendCallEnd: (params: { toUserId: string; callId: string }) => void;
  sendWebRTCOffer: (params: { toUserId: string; callId: string; offer: any }) => void;
  sendWebRTCAnswer: (params: { toUserId: string; callId: string; answer: any }) => void;
  sendWebRTCIceCandidate: (params: {
    toUserId: string;
    callId: string;
    candidate: any;
  }) => void;
}
