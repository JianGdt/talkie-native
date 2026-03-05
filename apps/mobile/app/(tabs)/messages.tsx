import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getUsersAvatar, getUsersName } from "@/utils/conversation";
import UserSearchModal from "@/components/modal/UserSearch";
import type { Conversation } from "@/api/services/conversationServices";
import { useConversations } from "@/hooks/useConversation";
import { formatRelativeTime, formatUnreadCount } from "@/utils/formats";
import { MESSAGE_FILTERS, STATUS_COLORS } from "@/constant/chats";

import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { BackgroundGlow } from "@/components/shared/BackgroundGlow";
import { FilterBtn } from "@/components/shared/Filter";

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
    markAsRead,
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
    markAsRead(conv.id);

    if (conv.isChannel) {
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: conv.channel_id ?? conv.id, // ✅ fallback to conv.id if channel_id is undefined
          type: "channel",
          name: getUsersName(conv),
        },
      });
      return;
    }

    router.push({
      pathname: "/messages/[id]",
      params: { id: conv.id, type: conv.type, name: getUsersName(conv) },
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getUsersName(item);
    const avatar = getUsersAvatar(item);
    const time = formatRelativeTime(item.last_message?.timestamp);
    const unread = item.unread_count;
    const isUnread = unread > 0 && !item.last_message?.isRead;
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
          className={`bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border ${item.is_pinned ? "border-blue-500/50" : "border-slate-800/50"}`}
        >
          <View className="p-4">
            <View className="flex-row items-center gap-4">
              <AvatarBadge
                colorClass={
                  item.type === "direct"
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }
                label={avatar}
                isActive={!!statusColor && statusColor === STATUS_COLORS.online}
                isPinned={item.is_pinned}
                memberCount={
                  item.type === "group" ? item.participants.length : undefined
                }
                unreadCount={isUnread ? unread : undefined}
                size="md"
              />

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text
                      className={`text-base tracking-tight ${isUnread ? "text-white font-bold" : "text-slate-300 font-medium"}`}
                    >
                      {name}
                    </Text>
                    {item.is_muted && (
                      <Ionicons name="volume-mute" size={16} color="#64748b" />
                    )}
                  </View>
                  <Text
                    className={`text-xs ${isUnread ? "text-white font-semibold" : "text-slate-500"}`}
                  >
                    {time}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text
                    className={`flex-1 text-sm ${isUnread ? "text-white font-semibold" : "text-slate-400"}`}
                    numberOfLines={1}
                  >
                    {item.type === "group" && item.last_message?.sender && (
                      <Text
                        className={
                          isUnread ? "text-slate-300" : "text-slate-500"
                        }
                      >
                        {item.last_message.sender}:{" "}
                      </Text>
                    )}
                    {item.last_message?.content || "No messages yet"}
                  </Text>
                  {isUnread && (
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
      <BackgroundGlow />

      <View className="bg-slate-900/80 backdrop-blur-xl px-6 pt-16 pb-6 border-b border-slate-800/50">
        <ScreenHeader
          title="Messages"
          subtitle={`${filteredConversations.length} conversations`}
          onAddPress={() => setShowUserSearch(true)}
        />
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search messages..."
        />
      </View>

      <View className="border-b border-slate-800/50">
        <FilterBtn
          filters={MESSAGE_FILTERS}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />
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
          <EmptyState
            iconName="chatbubbles-outline"
            title="No conversations yet"
            subtitle={
              searchQuery
                ? "No conversations match your search"
                : "Start a new conversation to get started"
            }
            ctaLabel={!searchQuery ? "Find People" : undefined}
            onCtaPress={
              !searchQuery ? () => setShowUserSearch(true) : undefined
            }
          />
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
