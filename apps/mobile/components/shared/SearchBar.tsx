import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <View className="bg-slate-800/50 backdrop-blur-sm rounded-2xl flex-row items-center px-6 py-4 border border-slate-700/50 shadow-xl">
      <Ionicons name="search" size={22} color="#64748b" />
      <TextInput
        className="flex-1 text-white text-base"
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
      />
      {loading && <ActivityIndicator size="small" color="#3b82f6" />}
      {!loading && value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <View className="w-8 h-8 bg-slate-700/50 rounded-full items-center justify-center">
            <Ionicons name="close" size={18} color="#94a3b8" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
