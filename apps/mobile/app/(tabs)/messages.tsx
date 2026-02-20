import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getUsersAvatar, getUsersName } from "@/utils/conversation";
import UserSearchModal from "@/components/modal/UserSearch";
import type { Conversation } from "@/api/services/conversationServices";
import { useConversations } from "@/hooks/useConversation";
import { formatRelativeTime, formatUnreadCount } from "@/utils/formats";
import { MESSAGE_FILTERS, STATUS_COLORS } from "@/constant/chats";

export default function MessageScreen() {
  const router = useRouter();
  const {
    filteredConversations,
    loading,
    refreshing,
    searchQuery,
    selectedFilter,
    setSearchQuery,
    setSelectedFilter,
    fetchConversations,
    handleRefresh,
  } = useConversations();

  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleUserSelect = (conversationId: string, userName: string) => {
    router.push({
      pathname: "/messages/[id]",
      params: { id: conversationId, type: "direct", name: userName },
    });
    fetchConversations();
  };

  const handleConversationPress = (conv: Conversation) => {
    router.push({
      pathname: "/messages/[id]",
      params: { id: conv.id, type: conv.type, name: getUsersName(conv) },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getUsersName(item);
    const avatar = getUsersAvatar(item);
    const time = formatRelativeTime(item.last_message?.timestamp);
    const unread = item.unread_count;
    const statusColor =
      item.type === "direct" && item.participants[0]
        ? (STATUS_COLORS[item.participants[0].status] ?? STATUS_COLORS.offline)
        : null;

    return (
      <TouchableOpacity
        className="mb-3"
        activeOpacity={0.7}
        onPress={() => handleConversationPress(item)}
      >
        <View
          className={`bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border ${
            item.is_pinned ? "border-blue-500/50" : "border-slate-800/50"
          }`}
        >
          <View className="p-4">
            <View className="flex-row items-center gap-4">
              <View className="relative">
                <View
                  className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    item.type === "direct"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  }`}
                >
                  <Text className="text-white text-lg font-bold">{avatar}</Text>
                </View>

                {statusColor && (
                  <View
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${statusColor} rounded-full border-2 border-slate-900`}
                  />
                )}

                {item.is_pinned && (
                  <View className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                    <Ionicons name="pin" size={12} color="white" />
                  </View>
                )}

                {item.type === "group" && (
                  <View className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full px-1.5 py-0.5 border border-slate-700">
                    <Text className="text-white text-xs font-bold">
                      {item.participants.length}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-white text-base font-bold tracking-tight">
                      {name}
                    </Text>
                    {item.is_muted && (
                      <Ionicons name="volume-mute" size={16} color="#64748b" />
                    )}
                  </View>
                  <Text className="text-slate-500 text-xs">{time}</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text
                    className={`flex-1 text-sm ${
                      item.last_message?.isRead || unread === 0
                        ? "text-slate-400"
                        : "text-white font-semibold"
                    }`}
                    numberOfLines={1}
                  >
                    {item.type === "group" && item.last_message?.sender && (
                      <Text className="text-slate-500">
                        {item.last_message.sender}:{" "}
                      </Text>
                    )}
                    {item.last_message?.content || "No messages yet"}
                  </Text>

                  {unread > 0 && (
                    <View className="ml-3 bg-blue-500 rounded-full min-w-[24px] h-6 items-center justify-center px-2">
                      <Text className="text-white text-xs font-bold">
                        {formatUnreadCount(unread)}
                      </Text>
                    </View>
                  )}
                </View>

                {item.type === "group" && item.participants.length > 0 && (
                  <Text
                    className="text-slate-500 text-xs mt-1"
                    numberOfLines={1}
                  >
                    👥 {item.participants.map((p) => p.name).join(", ")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4">Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <View className="absolute inset-0 opacity-30">
        <View className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <View className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </View>

      {/* Header */}
      <View className="bg-slate-900/80 backdrop-blur-xl px-6 pt-16 pb-6 border-b border-slate-800/50">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight mb-1">
              Messages
            </Text>
            <Text className="text-slate-400 text-sm">
              {filteredConversations.length} conversations
            </Text>
          </View>
          <TouchableOpacity
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30"
            onPress={() => setShowUserSearch(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View className="bg-slate-800/50 backdrop-blur-sm rounded-2xl flex-row items-center px-5 py-4 border border-slate-700/50 shadow-xl">
          <Ionicons name="search" size={22} color="#64748b" />
          <TextInput
            className="flex-1 ml-4 text-white text-base"
            placeholder="Search messages..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <View className="w-8 h-8 bg-slate-700/50 rounded-full items-center justify-center">
                <Ionicons name="close" size={18} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row px-6 py-4 gap-3 border-b border-slate-800/50">
        {MESSAGE_FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              className={`px-5 py-2.5 rounded-2xl flex-row items-center gap-2 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                  : "bg-slate-900/50 border border-slate-800/50"
              }`}
            >
              {filter.id !== "all" && (
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={isActive ? "white" : "#64748b"}
                />
              )}
              <Text
                className={`font-semibold text-sm ${
                  isActive ? "text-white" : "text-slate-400"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-5"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View className="items-center justify-center py-24">
            <View className="w-20 h-20 bg-slate-900/50 rounded-3xl items-center justify-center mb-5">
              <Ionicons name="chatbubbles-outline" size={40} color="#334155" />
            </View>
            <Text className="text-slate-400 text-lg font-semibold mb-2">
              No conversations yet
            </Text>
            <Text className="text-slate-600 text-sm text-center px-12 mb-6">
              {searchQuery
                ? "No conversations match your search"
                : "Start a new conversation to get started"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                className="px-6 py-3 bg-blue-500 rounded-2xl"
                onPress={() => setShowUserSearch(true)}
              >
                <Text className="text-white font-semibold">Find People</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <UserSearchModal
        visible={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserSelect={handleUserSelect}
      />
    </View>
  );
}
