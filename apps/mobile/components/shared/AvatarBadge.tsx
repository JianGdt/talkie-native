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
  size?: "sm" | "md" | "lg";
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
  size = "md",
}: AvatarBadgeProps) {
  const dim =
    size === "sm" ? "w-10 h-10" : size === "lg" ? "w-14 h-14" : "w-12 h-12";
  const textSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

  return (
    <View className="relative">
      <View
        className={`${dim} ${colorClass} relative rounded-full items-center justify-center shadow-lg`}
      >
        {iconName ? (
          <Ionicons name={iconName as any} size={iconSize} color="white" />
        ) : (
          <Text className={`text-white ${textSize} font-bold`}>{label}</Text>
        )}
      </View>

      {!!unreadCount && unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            backgroundColor: "#ef4444",
            borderRadius: 20,
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#0b1220",
          }}
        >
          <Text className="text-white text-xs font-bold">
            {formatUnreadCount(unreadCount)}
          </Text>
        </View>
      )}

      {isActive && (
        <View className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0b1220]" />
      )}

      {isPinned && (
        <View className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center border border-[#0b1220]">
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
