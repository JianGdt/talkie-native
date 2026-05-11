import { reconnectAttempts } from "@/store/useWebSocketStore";

export type MessageFilterType = "all" | "direct" | "groups";
export type ChannelCategoryType = "all" | "public" | "private" | "team";
export type ConversationType = "direct" | "group" | "channel";
export type UserStatus = "online" | "away" | "offline";

export const MESSAGE_FILTERS: {
  id: MessageFilterType;
  label: string;
  icon: string;
}[] = [
  { id: "all", label: "All", icon: "apps" },
  { id: "direct", label: "Direct", icon: "person" },
  { id: "groups", label: "Groups", icon: "people" },
];

export const CHANNEL_CATEGORIES: {
  id: ChannelCategoryType;
  label: string;
  icon: string;
}[] = [
  { id: "all", label: "All Channels", icon: "apps" },
  { id: "public", label: "Public", icon: "globe-outline" },
  { id: "private", label: "Private", icon: "lock-closed-outline" },
  { id: "team", label: "Team", icon: "people-outline" },
];

export const STATUS_COLORS: Record<UserStatus | string, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-slate-600",
};

export const CHANNEL_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export const MAX_UNREAD_DISPLAY = 99;

export const MESSAGE_MAX_LENGTH = 500;

export const MAX_RECONNECT_ATTEMPTS = 5;
export const getReconnectDelay = () =>
  Math.min(1000 * 2 ** reconnectAttempts, 30000);

export const NO_RECONNECT_CODES = new Set([1000, 1001, 1008]);
