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
  isChannel: boolean;
  channel_id?: string;
}

export interface PaginationParams {
  limit?: number;
  before?: number;
  signal?: AbortSignal;
}

export const conversationService = {
  getConversations: (signal?: AbortSignal) =>
    apiClient.get<Conversation[]>(API_ENDPOINTS.CONVERSATIONS, { signal }),

  getMessages: (
    conversationId: string,
    { limit = 50, before, signal }: PaginationParams = {},
  ) =>
    apiClient.get<Message[]>(
      API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
      {
        params: {
          limit,
          ...(before && { before }),
        },
        signal,
      },
    ),

  createDirect: (otherUserId: string, signal?: AbortSignal) =>
    apiClient.post<{ conversationId: string; isNew: boolean }>(
      API_ENDPOINTS.CREATE_DIRECT,
      { otherUserId },
      { signal },
    ),

  createGroup: (name: string, participantIds: string[], signal?: AbortSignal) =>
    apiClient.post<{
      conversationId: string;
      name: string;
      participantCount: number;
    }>(API_ENDPOINTS.CREATE_GROUP, { name, participantIds }, { signal }),

  markAsRead: (conversationId: string) =>
    apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.CONVERSATION_READ(conversationId),
      {},
    ),

  togglePin: (conversationId: string, isPinned: boolean) =>
    apiClient.post<{ success: boolean; isPinned: boolean }>(
      API_ENDPOINTS.CONVERSATION_PIN(conversationId),
      { isPinned },
    ),

  toggleMute: (conversationId: string, isMuted: boolean) =>
    apiClient.post<{ success: boolean; isMuted: boolean }>(
      API_ENDPOINTS.CONVERSATION_MUTE(conversationId),
      { isMuted },
    ),
};
