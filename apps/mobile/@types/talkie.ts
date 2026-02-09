export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  participants: User[];
  activeUsers: string[];
  createdAt?: Date;
}

export interface AudioMessage {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  timestamp: number;
  duration: number;
}

export interface SocketEvents {
  // Client to Server
  JOIN_CHANNEL: "join_channel";
  LEAVE_CHANNEL: "leave_channel";
  START_TRANSMISSION: "start_transmission";
  AUDIO_CHUNK: "audio_chunk";
  END_TRANSMISSION: "end_transmission";

  // Server to Client
  USER_JOINED: "user_joined";
  USER_LEFT: "user_left";
  TRANSMISSION_STARTED: "transmission_started";
  AUDIO_DATA: "audio_data";
  TRANSMISSION_ENDED: "transmission_ended";
  CHANNEL_UPDATE: "channel_update";
  ERROR: "error";
}

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";
export type TransmissionStatus = "idle" | "transmitting" | "receiving";

export interface WalkieTalkieState {
  connectionStatus: ConnectionStatus;
  currentChannel: Channel | null;
  activeTransmitter: { userId: string; username: string } | null;
  transmissionStatus: TransmissionStatus;
}
