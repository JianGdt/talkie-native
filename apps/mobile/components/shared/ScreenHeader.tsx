import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
  onAddPress?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  onAddPress,
}: ScreenHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View>
        <Text className="text-[22px] font-bold mb-1" style={{ color: THEME.text }}>
          {title}
        </Text>
        <Text className="text-xs" style={{ color: THEME.textMuted }}>
          {subtitle}
        </Text>
      </View>
      {onAddPress && (
        <TouchableOpacity
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: THEME.accent }}
          onPress={onAddPress}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
