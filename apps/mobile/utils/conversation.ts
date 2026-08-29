import type { Conversation } from "@/api/services/conversationServices";
import { getInitials } from "./formats";

export const formatPreviewContent = (content?: string) => {
  if (!content) return "";

  try {
    const attachment = JSON.parse(content);
    if (attachment?.url && attachment?.name) {
      if (attachment.kind === "image") return "Photo";
      if (attachment.kind === "video") return "Video";
      if (attachment.kind === "audio") return "Voice message";
      if (attachment.kind === "pdf") return "PDF";
      return attachment.name;
    }
  } catch {}

  return content;
};

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

export function getUsersProfileImage(conv: Conversation): string | undefined {
  if (conv.type === "direct" && conv.participants.length > 0) {
    return conv.participants[0].avatar;
  }
  return conv.participants.find((participant) => participant.avatar)?.avatar;
}

export function getActiveGroupMemberCount(
  conv: Conversation,
  onlineUsers: Set<string>,
  currentUserId?: string,
): number {
  if (conv.type !== "group") return 0;
  const activeParticipants = conv.participants.filter((participant) =>
    onlineUsers.has(participant.id),
  ).length;
  const currentUserAlreadyIncluded = conv.participants.some(
    (participant) => participant.id === currentUserId,
  );

  return currentUserId && !currentUserAlreadyIncluded
    ? activeParticipants + 1
    : activeParticipants;
}
