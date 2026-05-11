import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";

interface EmptyStateProps {
  iconName: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({
  iconName,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-4 my-12">
      <View
        className="w-16 h-16 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: THEME.accentSoft }}
      >
        <Ionicons name={iconName as any} size={28} color={THEME.accent} />
      </View>
      <Text className="text-gray-900 text-lg font-semibold text-center">
        {title}
      </Text>
      <Text className="text-gray-500 text-sm text-center px-8 mt-2">
        {subtitle}
      </Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          className="px-6 py-3 rounded-2xl mt-6"
          style={{ backgroundColor: THEME.accent }}
          onPress={onCtaPress}
        >
          <Text className="text-white font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
