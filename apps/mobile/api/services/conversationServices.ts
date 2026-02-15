import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";

export interface Message {
  id: string;
  conversation_id?: string;
  channel_id?: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender_username: string;
  sender_avatar?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: string;
  }>;
  last_message?: {
    content: string;
    sender: string;
    timestamp: number;
    isRead: boolean;
  };
  unread_count: number;
  is_pinned: boolean;
  is_muted: boolean;
  created_at: string;
  updated_at: string;
}

export const conversationService = {
  getConversations: (userId: string, token?: string) => {
    return apiClient.get<Conversation[]>(API_ENDPOINTS.CONVERSATIONS(userId), {
      token,
    });
  },

  getMessages: (
    conversationId: string,
    limit: number = 50,
    before?: number,
    token?: string,
  ) => {
    const endpoint = API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId);
    const query = new URLSearchParams();
    query.append("limit", limit.toString());
    if (before) query.append("before", before.toString());

    return apiClient.get<Message[]>(`${endpoint}?${query.toString()}`, {
      token,
    });
  },

  createDirect: (userId: string, otherUserId: string, token?: string) => {
    return apiClient.post<{ conversationId: string; isNew: boolean }>(
      API_ENDPOINTS.CREATE_DIRECT,
      { userId, otherUserId },
      { token },
    );
  },

  createGroup: (
    userId: string,
    name: string,
    participantIds: string[],
    token?: string,
  ) => {
    return apiClient.post<{
      conversationId: string;
      name: string;
      participantCount: number;
    }>(API_ENDPOINTS.CREATE_GROUP, { userId, name, participantIds }, { token });
  },

  markAsRead: (conversationId: string, userId: string, token?: string) => {
    return apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.CONVERSATION_READ(conversationId),
      { userId },
      { token },
    );
  },

  togglePin: (
    conversationId: string,
    userId: string,
    isPinned: boolean,
    token?: string,
  ) => {
    return apiClient.post<{ success: boolean; isPinned: boolean }>(
      API_ENDPOINTS.CONVERSATION_PIN(conversationId),
      { userId, isPinned },
      { token },
    );
  },

  toggleMute: (
    conversationId: string,
    userId: string,
    isMuted: boolean,
    token?: string,
  ) => {
    return apiClient.post<{ success: boolean; isMuted: boolean }>(
      API_ENDPOINTS.CONVERSATION_MUTE(conversationId),
      { userId, isMuted },
      { token },
    );
  },
};
