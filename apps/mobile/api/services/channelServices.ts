import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { Message, PaginationParams } from "./conversationServices";

export interface Channel {
  id: string;
  name: string;
  description?: string;
  category: "public" | "private" | "team";
  member_count: number;
  active_users: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ChannelMember {
  id: string;
  name: string;
  avatar?: string;
  joined_at: string;
  status: string;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string;
  category?: Channel["category"];
}

export const channelService = {
  getChannels: (signal?: AbortSignal) =>
    apiClient.get<Channel[]>(API_ENDPOINTS.CHANNELS, { signal }),

  getChannel: (channelId: string, signal?: AbortSignal) =>
    apiClient.get<Channel>(API_ENDPOINTS.CHANNEL(channelId), { signal }),

  getMessages: (
    channelId: string,
    { limit = 50, before, signal }: PaginationParams = {},
  ) =>
    apiClient.get<Message[]>(API_ENDPOINTS.CHANNEL_MESSAGES(channelId), {
      params: {
        limit,
        ...(before && { before }),
      },
      signal,
    }),

  getMembers: (channelId: string, signal?: AbortSignal) =>
    apiClient.get<ChannelMember[]>(API_ENDPOINTS.CHANNEL_MEMBERS(channelId), {
      signal,
    }),

  getUserChannels: (signal?: AbortSignal) =>
    apiClient.get<Channel[]>(API_ENDPOINTS.USER_CHANNELS, { signal }),

  createChannel: (
    payload: {
      name: string;
      description?: string;
      category?: Channel["category"];
    },
    signal?: AbortSignal,
  ) => apiClient.post<Channel>(API_ENDPOINTS.CHANNELS, payload, { signal }),

  updateChannel: (
    channelId: string,
    updates: UpdateChannelPayload,
    signal?: AbortSignal,
  ) =>
    apiClient.patch<Channel>(API_ENDPOINTS.CHANNEL(channelId), updates, {
      signal,
    }),

  deleteChannel: (channelId: string, signal?: AbortSignal) =>
    apiClient.delete<{ success: boolean }>(API_ENDPOINTS.CHANNEL(channelId), {
      signal,
    }),

  joinChannel: (channelId: string, signal?: AbortSignal) =>
    apiClient.post<{
      success: boolean;
      channelId: string;
      channelName: string;
    }>(API_ENDPOINTS.CHANNEL_JOIN(channelId), {}, { signal }),

  leaveChannel: (channelId: string, signal?: AbortSignal) =>
    apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.CHANNEL_LEAVE(channelId),
      {},
      { signal },
    ),
};
