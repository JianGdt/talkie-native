export interface ConversationParams {
  conversationId: string;
}

export interface CreateDirectMessageBody {
  otherUserId: string;
}

export interface CreateGroupBody {
  name: string;
  participantIds: string[];
}

export interface GetMessagesQuery {
  limit?: string;
  before?: string;
}

export interface TogglePinBody {
  isPinned: boolean;
}

export interface ToggleMuteBody {
  isMuted: boolean;
}
