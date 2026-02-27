import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatUnreadCount } from "@/utils/formats";

interface AvatarBadgeProps {
  colorClass: string;
  label: string;
  isActive?: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  memberCount?: number;
  iconName?: string;
  iconSize?: number;
  size?: "sm" | "md";
}

export function AvatarBadge({
  colorClass,
  label,
  isActive = false,
  isPinned = false,
  unreadCount,
  memberCount,
  iconName,
  iconSize = 26,
  size = "sm",
}: AvatarBadgeProps) {
  const dim = size === "sm" ? "w-14 h-14" : "w-12 h-12";
  const textSize = size === "sm" ? "text-lg" : "text-base";

  return (
    <View className="relative">
      <View
        className={`${dim} ${colorClass} rounded-2xl items-center justify-center shadow-lg`}
      >
        {iconName ? (
          <Ionicons name={iconName as any} size={iconSize} color="white" />
        ) : (
          <Text className={`text-white ${textSize} font-bold`}>{label}</Text>
        )}
      </View>

      {!!unreadCount && unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 border-2 border-slate-900">
          <Text className="text-white text-xs font-bold">
            {formatUnreadCount(unreadCount)}
          </Text>
        </View>
      )}

      {isActive && (
        <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900" />
      )}

      {isPinned && (
        <View className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
          <Ionicons name="pin" size={12} color="white" />
        </View>
      )}

      {memberCount !== undefined && !isActive && (
        <View className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full px-1.5 py-0.5 border border-slate-700">
          <Text className="text-white text-xs font-bold">{memberCount}</Text>
        </View>
      )}
    </View>
  );
}
