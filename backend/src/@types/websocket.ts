export enum MessageType {
  CONNECT = "connect",
  JOIN_CHANNEL = "join_channel",
  LEAVE_CHANNEL = "leave_channel",
  USER_JOINED = "user_joined",
  USER_LEFT = "user_left",
  START_TRANSMISSION = "start_transmission",
  AUDIO_CHUNK = "audio_chunk",
  END_TRANSMISSION = "end_transmission",
  TRANSMISSION_STARTED = "transmission_started",
  AUDIO_DATA = "audio_data",
  TRANSMISSION_ENDED = "transmission_ended",
  CHANNEL_UPDATE = "channel_update",
  ERROR = "error",
}

export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
}

export interface User {
  userId: string;
  username: string;
}
