// components/talkie/TalkScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useAuth } from "@/hooks/useAuth";
import { MessageType, WebSocketMessage } from "@/@types/talkie";

export default function MessageScreen() {
  const {
    isConnected,
    isAuthenticated,
    sendMessage,
    messages,
    userId,
    username,
    connectionError,
    initializeWebSocket,
  } = useWebSocketStore();

  const { session, loading: authLoading } = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Channel state
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [availableChannels] = useState([
    { id: "1", name: "General" },
    { id: "2", name: "Team Alpha" },
    { id: "3", name: "Emergency" },
  ]);

  // ============================================
  // INITIALIZE WEBSOCKET
  // ============================================
  useEffect(() => {
    if (session && !isConnected) {
      console.log("📱 Session detected, initializing WebSocket...");
      initializeWebSocket();
    }
  }, [session, isConnected, initializeWebSocket]);

  // ============================================
  // CHANNEL MANAGEMENT
  // ============================================
  const handleJoinChannel = (channelId: string) => {
    if (!isAuthenticated) {
      Alert.alert("Error", "Not authenticated yet");
      return;
    }

    sendMessage({
      type: MessageType.JOIN_CHANNEL,
      payload: {
        channelId,
        user: { userId, username },
      },
      timestamp: Date.now(),
    });

    setCurrentChannel(channelId);
  };

  const handleLeaveChannel = () => {
    if (!currentChannel || !isAuthenticated) return;

    sendMessage({
      type: MessageType.LEAVE_CHANNEL,
      payload: { channelId: currentChannel },
      timestamp: Date.now(),
    });

    setCurrentChannel(null);
  };

  // ============================================
  // TEXT MESSAGE
  // ============================================
  const handleSendMessage = () => {
    if (!currentChannel) {
      Alert.alert("Error", "Join a channel first");
      return;
    }

    if (!messageContent.trim()) return;

    sendMessage({
      type: MessageType.MESSAGE,
      payload: {
        content: messageContent,
        channelId: currentChannel,
      },
      timestamp: Date.now(),
    });

    setMessageContent("");
  };

  // ============================================
  // AUDIO TRANSMISSION
  // ============================================
  const handleStartRecording = () => {
    if (!currentChannel) {
      Alert.alert("Error", "Join a channel first");
      return;
    }

    setIsRecording(true);

    sendMessage({
      type: MessageType.START_TRANSMISSION,
      payload: { channelId: currentChannel },
      timestamp: Date.now(),
    });

    console.log("🎤 Started transmission");
  };

  const handleStopRecording = () => {
    if (!currentChannel) return;

    setIsRecording(false);

    sendMessage({
      type: MessageType.END_TRANSMISSION,
      payload: { channelId: currentChannel },
      timestamp: Date.now(),
    });

    console.log("🛑 Ended transmission");
  };

  // ============================================
  // RENDER MESSAGES
  // ============================================
  const renderMessage = (msg: WebSocketMessage, index: number) => {
    if (!msg?.type) return null;

    const messageType = String(msg.type).toLowerCase();

    switch (messageType) {
      case "audio_data":
        return (
          <View
            key={index}
            className="bg-green-50 rounded-lg p-3 mb-2 border-l-4 border-green-500"
          >
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-semibold text-green-600 uppercase">
                🎙️ VOICE
              </Text>
              <Text className="text-xs text-gray-400">
                {new Date(Number(msg.timestamp)).toLocaleTimeString()}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-green-800 mt-1">
              From: {msg.username || "Unknown"}
            </Text>
          </View>
        );

      case "transmission_started":
        return (
          <View
            key={index}
            className="bg-gray-100 rounded-lg p-2 mb-2 items-center"
          >
            <Text className="text-sm text-gray-700">
              🔴 {msg.username} started speaking
            </Text>
          </View>
        );

      case "transmission_ended":
        return (
          <View
            key={index}
            className="bg-gray-100 rounded-lg p-2 mb-2 items-center"
          >
            <Text className="text-sm text-gray-700">
              ⚪ {msg.username} stopped speaking
            </Text>
          </View>
        );

      case "user_joined":
        return (
          <View
            key={index}
            className="bg-gray-100 rounded-lg p-2 mb-2 items-center"
          >
            <Text className="text-sm text-gray-700">
              👤 {msg.payload?.user?.username} joined
            </Text>
          </View>
        );

      case "user_left":
        return (
          <View
            key={index}
            className="bg-gray-100 rounded-lg p-2 mb-2 items-center"
          >
            <Text className="text-sm text-gray-700">👋 User left</Text>
          </View>
        );

      case "channel_update":
        return (
          <View
            key={index}
            className="bg-gray-100 rounded-lg p-2 mb-2 items-center"
          >
            <Text className="text-sm text-gray-700">
              📻 {msg.payload?.activeCount} users online
            </Text>
          </View>
        );

      case "message":
        return (
          <View
            key={index}
            className="bg-gray-50 rounded-lg p-3 mb-2 border-l-4 border-blue-500"
          >
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-semibold text-blue-600 uppercase">
                💬 TEXT
              </Text>
              <Text className="text-xs text-gray-400">
                {new Date(Number(msg.timestamp)).toLocaleTimeString()}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-gray-700 mt-1">
              From: {msg.username}
            </Text>
            <Text className="text-sm text-gray-900 mt-1 leading-5">
              {msg.payload?.content}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // ============================================
  // LOADING & ERROR
  // ============================================
  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-3 text-base text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-base text-red-500 font-semibold">
          Please log in
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 p-4">
      {/* STATUS CARD */}
      <View className="bg-gray-800  rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Text className="text-sm font-semibold text-gray-700 w-24">
            Channel:
          </Text>
          <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                currentChannel ? "bg-blue-500" : "bg-gray-400"
              }`}
            />
            <Text className="text-sm font-medium text-gray-900">
              {currentChannel
                ? availableChannels.find((c) => c.id === currentChannel)?.name
                : "Not in channel"}
            </Text>
          </View>
        </View>

        {/* User Info */}
        {userId && (
          <View className="mt-2 pt-3 border-t border-gray-200">
            <Text className="text-base font-semibold text-gray-900 mb-0.5">
              {username}
            </Text>
            <Text className="text-xs text-gray-400 font-mono">
              {userId.substring(0, 8)}...
            </Text>
          </View>
        )}

        {/* Connection Error */}
        {connectionError && (
          <View className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500 flex-row justify-between items-center">
            <Text className="flex-1 text-sm text-red-800">
              ⚠️ {connectionError}
            </Text>
            <TouchableOpacity
              onPress={initializeWebSocket}
              className="bg-red-500 px-3 py-1.5 rounded-md"
            >
              <Text className="text-white font-semibold text-xs">Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CHANNEL SELECTOR */}
      <View className="mb-4">
        <Text className="text-base font-bold text-gray-900 mb-2">Channels</Text>
        <View className="flex-row gap-2">
          {availableChannels.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              className={`flex-1 py-3 rounded-lg border-2 items-center ${
                currentChannel === channel.id
                  ? "bg-blue-500 border-blue-500"
                  : "bg-gray-800  border-gray-200"
              } ${!isAuthenticated ? "opacity-50" : ""}`}
              onPress={() => {
                if (currentChannel === channel.id) {
                  handleLeaveChannel();
                } else {
                  handleJoinChannel(channel.id);
                }
              }}
              disabled={!isAuthenticated}
            >
              <Text
                className={`text-sm font-semibold ${
                  currentChannel === channel.id ? "text-white" : "text-gray-700"
                }`}
              >
                {currentChannel === channel.id ? "✓ " : ""}
                {channel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TEXT MESSAGE INPUT */}
      <View className="flex-row mb-3 gap-2">
        <TextInput
          className="flex-1 bg-gray-800  rounded-xl p-3 text-base border border-gray-200"
          placeholder={
            currentChannel ? "Type a message..." : "Join a channel first"
          }
          placeholderTextColor="#9ca3af"
          value={messageContent}
          onChangeText={setMessageContent}
          editable={isConnected && !!currentChannel}
          multiline
          style={{ maxHeight: 100 }}
        />
        <TouchableOpacity
          className={`px-5 rounded-xl justify-center items-center ${
            !isConnected || !currentChannel || !messageContent.trim()
              ? "bg-gray-400 opacity-50"
              : "bg-blue-500"
          }`}
          onPress={handleSendMessage}
          disabled={!isConnected || !currentChannel || !messageContent.trim()}
        >
          <Text className="text-xl">📤</Text>
        </TouchableOpacity>
      </View>

      {/* PUSH-TO-TALK BUTTON */}
      <TouchableOpacity
        className={`p-4 rounded-xl items-center mb-4 shadow-lg ${
          isRecording
            ? "bg-red-500"
            : !isConnected || !currentChannel
              ? "bg-gray-400 opacity-50"
              : "bg-green-500"
        }`}
        onPressIn={handleStartRecording}
        onPressOut={handleStopRecording}
        disabled={!isConnected || !currentChannel}
      >
        <Text className="text-white text-base font-semibold">
          {isRecording
            ? "🔴 Recording... Release to stop"
            : currentChannel
              ? "🎙️ Hold to Talk"
              : "Join a channel first"}
        </Text>
      </TouchableOpacity>

      {/* MESSAGES */}
      <View className="flex-1 bg-gray-800  rounded-xl p-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-gray-900">Messages</Text>
          <View className="bg-blue-500 px-2.5 py-1 rounded-xl">
            <Text className="text-white text-xs font-semibold">
              {messages.length}
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="pb-4">
          {messages.length === 0 ? (
            <View className="p-8 items-center">
              <Text className="text-sm text-gray-400 text-center">
                {!isAuthenticated
                  ? "Connecting..."
                  : "No messages yet. Join a channel!"}
              </Text>
            </View>
          ) : (
            messages.map((msg, i) => renderMessage(msg, i))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
