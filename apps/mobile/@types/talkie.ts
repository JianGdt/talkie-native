export enum MessageType {
  // Authentication
  AUTH = "auth",
  AUTH_SUCCESS = "auth_success",
  AUTH_ERROR = "auth_error",

  PRESENCE_UPDATE = "presence_update",

  // Channel Management
  JOIN_CHANNEL = "join_channel",
  LEAVE_CHANNEL = "leave_channel",

  CHANNEL_JOINED = "channel_joined",
  CHANNEL_UPDATE = "channel_update",

  // User Events
  USER_JOINED = "user_joined",
  USER_LEFT = "user_left",

  // Audio Transmission
  START_TRANSMISSION = "start_transmission",
  TRANSMISSION_STARTED = "transmission_started",
  END_TRANSMISSION = "end_transmission",
  TRANSMISSION_ENDED = "transmission_ended",

  AUDIO_DATA = "audio_data",
  AUDIO_CHUNK = "audio_chunk",

  // Text Messages
  MESSAGE = "message",

  // Error
  ERROR = "error",


  TYPING = "typing",

  // Calls (WebRTC signaling)
  CALL_INVITE = "call_invite",
  CALL_ACCEPT = "call_accept",
  CALL_REJECT = "call_reject",
  CALL_END = "call_end",
  WEBRTC_OFFER = "webrtc_offer",
  WEBRTC_ANSWER = "webrtc_answer",
  WEBRTC_ICE_CANDIDATE = "webrtc_ice_candidate",
}

export interface WebSocketMessage<T = any> {
  type: MessageType | string;
  payload?: T;
  userId?: string;
  username?: string;
  timestamp: number;
}

// ============================================
// AUTHENTICATION PAYLOADS
// ============================================

export interface AuthPayload {
  token: string;
}

export interface AuthSuccessPayload {
  userId: string;
  username: string;
  message?: string;
}

export interface AuthErrorPayload {
  message: string;
}

// ============================================
// CHANNEL PAYLOADS
// ============================================

export interface JoinChannelPayload {
  channelId: string;
  user: {
    userId: string;
    username: string;
  };
}

export interface LeaveChannelPayload {
  channelId: string;
}

export interface ChannelUpdatePayload {
  channelId: string;
  name: string;
  activeUsers: string[];
  activeCount: number;
  currentSpeaker?: string | null;
}

// ============================================
// USER EVENT PAYLOADS
// ============================================

export interface UserJoinedPayload {
  channelId: string;
  user: {
    userId: string;
    username: string;
  };
}

export interface UserLeftPayload {
  channelId: string;
  userId: string;
}

// ============================================
// AUDIO TRANSMISSION PAYLOADS
// ============================================

export interface StartTransmissionPayload {
  channelId: string;
}

export interface TransmissionStartedPayload {
  channelId: string;
  userId: string;
  username: string;
}

export interface AudioChunkPayload {
  channelId: string;
  audioData: string; // Base64 encoded
  duration?: number;
}

export interface EndTransmissionPayload {
  channelId: string;
  duration?: number;
}

export interface TransmissionEndedPayload {
  channelId: string;
  userId: string;
  duration?: number;
}

// ============================================
// TEXT MESSAGE PAYLOADS
// ============================================

export interface TextMessagePayload {
  channelId: string;
  content: string;
}

// ============================================
// ERROR PAYLOAD
// ============================================

export interface ErrorPayload {
  error: string;
  code?: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  userId: string;
  username: string;
  email?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  activeUsers: User[];
  currentSpeaker: string | null;
}
