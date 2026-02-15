import { apiClient } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import { Message } from "./conversationServices";

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

export const channelService = {
  getChannels: (token?: string) => {
    return apiClient.get<Channel[]>(API_ENDPOINTS.CHANNELS, { token });
  },

  getChannel: (channelId: string, token?: string) => {
    return apiClient.get<Channel>(API_ENDPOINTS.CHANNEL(channelId), { token });
  },

  getMessages: (
    channelId: string,
    limit: number = 50,
    before?: number,
    token?: string,
  ) => {
    const endpoint = API_ENDPOINTS.CHANNEL_MESSAGES(channelId);
    const query = new URLSearchParams();
    query.append("limit", limit.toString());
    if (before) query.append("before", before.toString());

    return apiClient.get<Message[]>(`${endpoint}?${query.toString()}`, {
      token,
    });
  },

  getMembers: (channelId: string, token?: string) => {
    return apiClient.get<ChannelMember[]>(
      API_ENDPOINTS.CHANNEL_MEMBERS(channelId),
      { token },
    );
  },

  createChannel: (
    name: string,
    description?: string,
    category?: "public" | "private" | "team",
    token?: string,
  ) => {
    return apiClient.post<Channel>(
      API_ENDPOINTS.CHANNELS,
      { name, description, category },
      { token },
    );
  },

  updateChannel: (
    channelId: string,
    updates: {
      name?: string;
      description?: string;
      category?: "public" | "private" | "team";
    },
    token?: string,
  ) => {
    return apiClient.patch<Channel>(API_ENDPOINTS.CHANNEL(channelId), updates, {
      token,
    });
  },

  deleteChannel: (channelId: string, token?: string) => {
    return apiClient.delete<{ success: boolean }>(
      API_ENDPOINTS.CHANNEL(channelId),
      { token },
    );
  },

  getUserChannels: (userId: string, token?: string) => {
    return apiClient.get<Channel[]>(API_ENDPOINTS.USER_CHANNELS(userId), {
      token,
    });
  },
};
