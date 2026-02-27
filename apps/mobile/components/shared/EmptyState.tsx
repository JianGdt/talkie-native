import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <View className="items-center justify-center py-24">
      <View className="w-20 h-20 bg-slate-900/50 rounded-3xl items-center justify-center mb-5">
        <Ionicons name={iconName as any} size={40} color="#334155" />
      </View>
      <Text className="text-slate-400 text-lg font-semibold mb-2">{title}</Text>
      <Text className="text-slate-600 text-sm text-center px-12 mb-6">
        {subtitle}
      </Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          className="px-6 py-3 bg-blue-500 rounded-2xl"
          onPress={onCtaPress}
        >
          <Text className="text-white font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
