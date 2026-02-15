import React, { useState, useEffect, useRef } from "react";
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
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { channelService } from "@/api/services/channelServices";
import { conversationService } from "@/api/services/conversationServices";
import { useAuth } from "@/hooks/useAuth";

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const { sendMessage, messages: wsMessages } = useWebSocketStore();

  const conversationId = params.id as string;
  const type = params.type as string;
  const name = params.name as string;
  const description = params.description as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  // Keep track of processed message IDs to avoid duplicates
  const processedMessageIds = useRef(new Set<string>());

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  // Listen for new WebSocket messages
  useEffect(() => {
    // Filter WebSocket messages for this conversation
    const relevantMessages = wsMessages.filter((msg) => {
      if (msg.type === "message") {
        const payload = msg.payload;
        // Check if message belongs to this conversation
        if (type === "channel") {
          return payload.channelId === conversationId;
        } else {
          return payload.conversationId === conversationId;
        }
      }
      return false;
    });

    // Add new messages to the list
    relevantMessages.forEach((wsMessage) => {
      const payload = wsMessage.payload;
      const messageId = payload.messageId;

      // Skip if we've already processed this message
      if (!messageId || processedMessageIds.current.has(messageId)) {
        return;
      }

      // Skip if this is our own message (we already added it optimistically)
      if (wsMessage.userId === session?.user?.id) {
        processedMessageIds.current.add(messageId);
        return;
      }

      // Add to processed set
      processedMessageIds.current.add(messageId);

      // Check if message already exists in the list
      const messageExists = messages.some((m) => m.id === messageId);

      if (!messageExists) {
        // Handle both string and number timestamps
        const timestamp = payload.timestamp || wsMessage.timestamp;
        const timestampValue =
          typeof timestamp === "string" ? parseFloat(timestamp) : timestamp;

        const newMessage = {
          id: messageId,
          content: payload.content,
          sender_id: payload.sender?.userId || wsMessage.userId,
          sender_username: payload.sender?.username || wsMessage.username,
          created_at: new Date(timestampValue).toISOString(),
          timestamp: timestampValue,
        };

        console.log(
          "📨 Adding message from:",
          newMessage.sender_username,
          "at",
          new Date(timestampValue).toLocaleTimeString(),
        );
        setMessages((prev) => [...prev, newMessage]);
      }
    });
  }, [wsMessages, conversationId, type, session?.user?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      let messagesData;
      if (type === "channel") {
        messagesData = await channelService.getMessages(
          conversationId,
          50,
          undefined,
          session?.access_token,
        );
      } else {
        messagesData = await conversationService.getMessages(
          conversationId,
          50,
          undefined,
          session?.access_token,
        );
      }

      setMessages(messagesData);

      // Mark all fetched messages as processed
      messagesData.forEach((msg: any) => {
        if (msg.id) {
          processedMessageIds.current.add(msg.id);
        }
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const content = inputText.trim();

    // Clear input immediately
    setInputText("");

    // Optimistically add message to UI (only for sender)
    const optimisticMessage = {
      id: tempId,
      content: content,
      sender_id: session?.user?.id,
      sender_username: session?.user?.email?.split("@")[0],
      timestamp: Date.now(),
    };

    console.log("📤 Sending message:", content);
    setMessages((prev) => [...prev, optimisticMessage]);

    // Mark this temp message as processed so we don't add it again
    processedMessageIds.current.add(tempId);

    // Send via WebSocket
    const messageData = {
      type: "message",
      payload: {
        ...(type === "channel"
          ? { channelId: conversationId }
          : { conversationId }),
        content: content,
        sender: {
          userId: session?.user?.id,
          username: session?.user?.email?.split("@")[0],
        },
      },
      timestamp: Date.now(),
    };

    sendMessage(messageData);
  };
  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.sender_id === session?.user?.id;

    // Handle multiple timestamp formats
    const getMessageTime = () => {
      if (item.created_at) {
        return new Date(item.created_at);
      }

      // Handle both number and string timestamps
      const timestamp = item.timestamp;
      if (typeof timestamp === "string") {
        // Parse string timestamp (may have decimal precision)
        return new Date(parseFloat(timestamp));
      }

      return new Date(timestamp);
    };

    const messageTime = getMessageTime();

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
        <Text className="text-slate-500 text-xs mt-1 mx-2">
          {messageTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </Text>
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
      <View className="bg-slate-900/80 backdrop-blur-xl px-4 pt-16 pb-4 border-b border-slate-800/50">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white text-xl font-bold">{name}</Text>
              {type === "channel" && (
                <View className="bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
                  <Text className="text-indigo-300 text-xs font-semibold">
                    CHANNEL
                  </Text>
                </View>
              )}
            </View>
            {description && (
              <Text className="text-slate-400 text-sm">{description}</Text>
            )}
          </View>

          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="call" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="videocam" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || `message-${index}`}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        inverted={false}
      />

      {/* Input */}
      <View className="bg-slate-900/80 backdrop-blur-xl px-4 py-4 border-t border-slate-800/50">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="happy-outline" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#64748b" />
          </TouchableOpacity>

          <TextInput
            className="flex-1 bg-slate-800/50 rounded-full px-4 py-3 text-white"
            placeholder="Type a message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
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
