import type { Channel as APIChannel } from "@/api/services/channelServices";
import { getChannelColor, getTimeAgo } from "./formats";

export interface Channel {
  id: string;
  name: string;
  description: string;
  members: number;
  isActive: boolean;
  category: "public" | "private" | "team";
  color: string;
  unreadCount?: number;
  lastActivity?: string;
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case "private":
      return "lock-closed";
    case "team":
      return "people";
    default:
      return "globe";
  }
}

export function transformChannel(channel: APIChannel): Channel {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description || "No description",
    members: channel.member_count || 0,
    isActive: false,
    category: channel.category || "public",
    color: getChannelColor(channel.id),
    unreadCount: 0,
    lastActivity: getTimeAgo(channel.updated_at || channel.created_at),
  };
}
