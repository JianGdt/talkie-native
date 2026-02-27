import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        <Text className="text-white text-3xl font-bold tracking-tight mb-1">
          {title}
        </Text>
        <Text className="text-slate-400 text-sm">{subtitle}</Text>
      </View>
      {onAddPress && (
        <TouchableOpacity
          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30"
          onPress={onAddPress}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
