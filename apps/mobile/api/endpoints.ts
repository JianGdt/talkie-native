export const API_ENDPOINTS = {
  // Conversations
  CONVERSATIONS: (userId: string) => `/api/conversations/${userId}`,
  CONVERSATION_MESSAGES: (conversationId: string) =>
    `/api/conversations/${conversationId}/messages`,
  CONVERSATION_READ: (conversationId: string) =>
    `/api/conversations/${conversationId}/read`,
  CONVERSATION_PIN: (conversationId: string) =>
    `/api/conversations/${conversationId}/pin`,
  CONVERSATION_MUTE: (conversationId: string) =>
    `/api/conversations/${conversationId}/mute`,
  CREATE_DIRECT: "/api/conversations/direct",
  CREATE_GROUP: "/api/conversations/group",

  // Channels
  CHANNELS: "/api/channels",
  CHANNEL: (channelId: string) => `/api/channels/${channelId}`,
  CHANNEL_MESSAGES: (channelId: string) =>
    `/api/channels/${channelId}/messages`,
  CHANNEL_MEMBERS: (channelId: string) => `/api/channels/${channelId}/members`,

  // Users
  USERS_SEARCH: "/api/users/search",
  USER: (userId: string) => `/api/users/${userId}`,
  USERS: "/api/users",
  USER_CHANNELS: (userId: string) => `/api/users/${userId}/channels`,
} as const;
