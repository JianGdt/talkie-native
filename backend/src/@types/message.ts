export enum MessageType {
  AUTH = "auth",
  AUTH_SUCCESS = "auth_success",
  AUTH_ERROR = "auth_error",

  // Connection
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  ERROR = "error",

  // Channel Management
  JOIN_CHANNEL = "join_channel",
  LEAVE_CHANNEL = "leave_channel",
  CHANNEL_UPDATE = "channel_update",

  // User Events
  USER_JOINED = "user_joined",
  USER_LEFT = "user_left",

  // Audio Transmission
  START_TRANSMISSION = "start_transmission",
  AUDIO_CHUNK = "audio_chunk",
  AUDIO_DATA = "audio_data",
  END_TRANSMISSION = "end_transmission",
  TRANSMISSION_STARTED = "transmission_started",
  TRANSMISSION_ENDED = "transmission_ended",

  // Text Messages
  MESSAGE = "message",
}

// Base WebSocket message structure
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
// CONNECTION TYPES
// ============================================

export interface ClientConnection {
  ws: any; // WebSocket instance
  userId: string;
  username: string;
  isAlive: boolean;
  isAuthenticated: boolean;
  currentChannel?: string;
}

export interface TransmissionState {
  channelId: string;
  userId: string;
  username: string;
  startTime: number;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  activeUsers: string[];
  currentSpeaker: string | null;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  activeUsers: string[];
  activeCount: number;
  currentSpeaker: string | null;
}
