import { useWebSocketStore } from "@/store/useWebSocketStore";
import React from "react";
import { View, StyleSheet } from "react-native";

interface OnlineBadgeProps {
  userId: string;
  size?: number;
}

export const OnlineBadge = ({ userId, size = 12 }: OnlineBadgeProps) => {
  const isOnline = useWebSocketStore((state) => state.isUserOnline(userId));

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? "#3bf690" : "#808080",
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 2,
    borderColor: "#fff",
  },
});
