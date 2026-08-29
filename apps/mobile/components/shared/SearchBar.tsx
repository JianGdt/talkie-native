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
    <View
      className="rounded-lg flex-row items-center px-3 py-2 border"
      style={{ backgroundColor: THEME.inputBg, borderColor: THEME.border }}
    >
      <Ionicons name="search" size={20} color={THEME.textSubtle} />
      <TextInput
        className="flex-1 text-[13px]"
        style={{
          paddingVertical: 0,
          outline: "none",
          borderBottomWidth: 0,
          marginLeft: 8,
          color: THEME.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={THEME.textSubtle}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
      {loading && <ActivityIndicator size="small" color={THEME.accent} />}
      {!loading && value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: THEME.surfaceRaised }}
          >
            <Ionicons name="close" size={18} color={THEME.textMuted} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
