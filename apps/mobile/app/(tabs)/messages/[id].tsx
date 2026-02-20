import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatMessages } from "@/hooks/useChatMessages";
import { formatMessageTime } from "@/utils/formats";
import { MESSAGE_MAX_LENGTH } from "@/constant/chats";

export default function ChatScreen() {
  const router = useRouter();
  const { id, type, name, description } = useLocalSearchParams<{
    id: string;
    type: string;
    name: string;
    description: string;
  }>();

  const { messages, loading, send, userId } = useChatMessages(id, type);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    send(inputText.trim());
    setInputText("");
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === userId;
    const time = formatMessageTime(item.created_at);

    return (
      <View className={`mb-4 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <Text className="text-slate-400 text-xs mb-1 ml-2">
            {item.sender_username}
          </Text>
        )}
        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
            isOwn ? "bg-blue-500 rounded-br-sm" : "bg-slate-800 rounded-bl-sm"
          }`}
        >
          <Text className="text-white text-base">{item.content}</Text>
        </View>
        <Text className="text-slate-500 text-xs mt-1 mx-2">{time}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4">Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="bg-slate-900/80 px-4 pt-16 pb-4 border-b border-slate-800/50">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{name}</Text>
            {description && (
              <Text className="text-slate-400 text-sm">{description}</Text>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, i) => item.id ?? `msg-${i}`}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
      />

      <View className="bg-slate-900/80 px-4 py-4 border-t border-slate-800/50">
        <View className="flex-row items-center gap-3">
          <TextInput
            className="flex-1 bg-slate-800/50 rounded-full px-4 py-3 text-white"
            placeholder="Type a message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={MESSAGE_MAX_LENGTH}
          />
          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() ? "bg-blue-500" : "bg-slate-700"
            }`}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
