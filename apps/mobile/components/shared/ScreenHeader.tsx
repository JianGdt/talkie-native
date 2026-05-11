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
    <View className="flex-row items-center justify-between mb-6">
      <View>
        <Text className="text-gray-900 text-3xl font-bold tracking-tight mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-sm">{subtitle}</Text>
      </View>
      {onAddPress && (
        <TouchableOpacity
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: THEME.accent }}
          onPress={onAddPress}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
