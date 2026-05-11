import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  loading = false,
  autoFocus = false,
}: SearchBarProps) {
  return (
    <View className="bg-gray-100 rounded-2xl flex-row items-center px-3 py-3 border border-gray-100">
      <Ionicons name="search" size={20} color={THEME.textSubtle} />
      <TextInput
        style={{
          paddingVertical: 0,
          outline: "none",
          borderBottomWidth: 0,
          marginLeft: 8,
        }}
        className="flex-1 text-gray-900 text-[15px]"
        placeholder={placeholder}
        placeholderTextColor={THEME.textSubtle}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
      {loading && <ActivityIndicator size="small" color={THEME.accent} />}
      {!loading && value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
            <Ionicons name="close" size={18} color={THEME.textMuted} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
