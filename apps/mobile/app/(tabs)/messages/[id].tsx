import React, { useState, useRef, useEffect } from "react";
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatMessages } from "@/hooks/useChatMessages";
import { formatMessageTime } from "@/utils/formats";
import { MESSAGE_MAX_LENGTH } from "@/constant/chats";
import { THEME } from "@/constant/theme";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { AvatarBadge } from "@/components/shared/AvatarBadge";

export default function ChatScreen() {
  const router = useRouter();
  const { id, type, name, description, userId: otherUserId } =
    useLocalSearchParams<{
      id: string;
      type: string;
      name: string;
      description: string;
      userId?: string;
    }>();

  const markConversationAsRead = useWebSocketStore(
    (state) => state.markConversationAsRead,
  );
  const isOnline = useWebSocketStore((state) =>
    otherUserId ? state.onlineUsers.has(otherUserId) : false,
  );

  useFocusEffect(() => {
    if (id) markConversationAsRead(id);
  });

  const { messages, loading, send, userId } = useChatMessages(id, type);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const sendCallInvite = useWebSocketStore((s) => s.sendCallInvite);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    send(inputText.trim());
    setInputText("");
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === userId;
    const time = formatMessageTime(item.created_at);

    return (
      <View className={`mb-3 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <Text className="text-gray-500 text-[11px] mb-1 ml-2">
            {item.sender_username}
          </Text>
        )}

        <View
          className={`max-w-[82%] px-4 py-2.5 ${
            isOwn
              ? "rounded-[22px] rounded-br-md"
              : "bg-gray-200 rounded-[22px] rounded-bl-md"
          }`}
          style={isOwn ? { backgroundColor: THEME.accent } : undefined}
        >
          <Text
            className={`text-[15px] leading-5 ${isOwn ? "text-white" : "text-gray-900"}`}
          >
            {item.content}
          </Text>
        </View>

        <Text className="text-gray-400 text-[10px] mt-1 mx-2">{time}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="text-gray-500 mt-4">Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="bg-white px-4 pt-12 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5 flex-1 pr-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color={THEME.text} />
            </TouchableOpacity>

            <AvatarBadge
              colorClass="bg-emerald-500"
              label={String(name ?? "?").slice(0, 1).toUpperCase()}
              isActive={!!isOnline}
              size="sm"
            />

            <View className="flex-1">
              <Text
                className="text-gray-900 text-[16px] font-semibold tracking-tight"
                numberOfLines={1}
              >
                {name}
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isOnline ? "#22c55e" : "#9ca3af",
                    borderWidth: 2,
                    borderColor: "#ffffff",
                  }}
                />
                <Text className="text-gray-500 text-[12px]" numberOfLines={1}>
                  {description ? description : isOnline ? "online" : "offline"}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
              activeOpacity={0.7}
              onPress={() => {
                if (!otherUserId) return;
                const newCallId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                sendCallInvite({
                  toUserId: otherUserId,
                  callId: newCallId,
                  conversationId: id,
                  name: String(name ?? ""),
                });
                router.replace({
                  pathname: "/(call)/active",
                  params: {
                    callId: newCallId,
                    otherUserId,
                    name: String(name ?? ""),
                    role: "caller",
                  },
                });
              }}
            >
              <Ionicons name="call-outline" size={20} color={THEME.text} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
              activeOpacity={0.7}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={THEME.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, i) => item.id ?? `msg-${i}`}
        className="flex-1 px-4 bg-gray-50"
        contentContainerStyle={{ paddingVertical: 16 }}
      />

      <View className="bg-white px-4 pt-3 pb-4 border-t border-gray-100">
        <View className="flex-row items-end gap-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={THEME.text} />
          </TouchableOpacity>

          <View className="flex-1 bg-gray-100 rounded-[22px] border border-gray-200 flex-row items-end px-4 py-2.5">
            <TextInput
              className="flex-1 text-gray-900 text-[15px]"
              placeholder="Message..."
              placeholderTextColor={THEME.textSubtle}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
              style={{ paddingVertical: 0, outline: "none" }}
            />
            <TouchableOpacity
              className="ml-2 w-9 h-9 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="happy-outline" size={22} color={THEME.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`w-10 h-10 rounded-full items-center justify-center border ${
              inputText.trim()
                ? "border-emerald-400"
                : "bg-gray-100 border-gray-200"
            }`}
            style={inputText.trim() ? { backgroundColor: THEME.accent } : undefined}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? "white" : THEME.textSubtle}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
