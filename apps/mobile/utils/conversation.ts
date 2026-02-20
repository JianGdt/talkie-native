import type { Conversation } from "@/api/services/conversationServices";
import { getInitials } from "./formats";

export function getUsersName(conv: Conversation): string {
  if (conv.type === "direct" && conv.participants.length > 0) {
    return conv.participants[0].name;
  }
  return conv.name || "Unnamed Group";
}

export function getUsersAvatar(conv: Conversation): string {
  if (conv.type === "direct" && conv.participants.length > 0) {
    return getInitials(conv.participants[0].name);
  }
  return conv.name ? getInitials(conv.name) : "G";
}
