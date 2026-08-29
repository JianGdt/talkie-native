import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  formatPreviewContent,
  getActiveGroupMemberCount,
  getUsersAvatar,
  getUsersName,
  getUsersProfileImage,
} from "@/utils/conversation";
import UserSearchModal from "@/components/modal/UserSearch";
import type { Conversation } from "@/api/services/conversationServices";
import { useConversations } from "@/hooks/useConversation";
import { formatRelativeTime, formatUnreadCount } from "@/utils/formats";
import { MESSAGE_FILTERS, STATUS_COLORS } from "@/constant/chats";
import { THEME } from "@/constant/theme";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocketStore } from "@/store/useWebSocketStore";

import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterBtn } from "@/components/shared/Filter";

export default function MessageScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isUserOnline = useWebSocketStore((state) => state.isUserOnline);
  const onlineUsers = useWebSocketStore((state) => state.onlineUsers);
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

  const handleUserSelect = (
    conversationId: string,
    userName: string,
    userId: string,
    avatar?: string,
  ) => {
    router.push({
      pathname: "/messages/[id]",
      params: { id: conversationId, type: "direct", name: userName, userId, avatar },
    });
    fetchConversations();
  };

  const handleConversationPress = (conv: Conversation) => {
    markAsRead(conv.id);

    if (conv.isChannel) {
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: conv.channel_id ?? conv.id,
          type: "channel",
          name: getUsersName(conv),
          avatar: getUsersProfileImage(conv),
          activeCount: String(
            getActiveGroupMemberCount(conv, onlineUsers, user?.id),
          ),
        },
      });
      return;
    }

    const directUserId =
      conv.type === "direct"
        ? (conv.participants.find((p) => p.id !== user?.id)?.id ??
          conv.participants[0]?.id)
        : undefined;

    router.push({
      pathname: "/messages/[id]",
      params: {
        id: conv.id,
        type: conv.type,
        name: getUsersName(conv),
        avatar: getUsersProfileImage(conv),
        ...(conv.type === "group"
          ? {
              activeCount: String(
                getActiveGroupMemberCount(conv, onlineUsers, user?.id),
              ),
            }
          : {}),
        ...(directUserId ? { userId: directUserId } : {}),
      },
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
    const profileImage = getUsersProfileImage(item);
    const time = formatRelativeTime(item.last_message?.timestamp);
    const unread = item.unread_count;
    const isUnread = unread > 0 && !item.last_message?.isRead;
    const activeCount = getActiveGroupMemberCount(item, onlineUsers, user?.id);

    const otherUserId =
      item.type === "direct"
        ? item.participants.find((p) => p.id !== user?.id)?.id
        : undefined;
    const isOnline = otherUserId ? isUserOnline(otherUserId) : false;
    const statusColor =
      item.type === "direct" && item.participants[0]
        ? isOnline
          ? STATUS_COLORS.online
          : (STATUS_COLORS[item.participants[0].status] ??
            STATUS_COLORS.offline)
        : null;

    const preview =
      item.type === "group" && item.last_message?.sender
        ? `${item.last_message.sender}: ${formatPreviewContent(item.last_message.content)}`
        : formatPreviewContent(item.last_message?.content) || "No messages yet";

    return (
      <TouchableOpacity
        className="flex-row items-center py-3.5 border-b"
        style={{ borderBottomColor: THEME.border }}
        activeOpacity={0.7}
        onPress={() => handleConversationPress(item)}
      >
        <View className="relative">
          {profileImage ? (
            <ProfileAvatar value={profileImage} fallbackLabel={avatar} size={56} />
          ) : (
            <AvatarBadge
              colorClass={item.type === "direct" ? "bg-emerald-500" : "bg-teal-500"}
              label={avatar}
              isActive={!!statusColor && statusColor === STATUS_COLORS.online}
              isPinned={item.is_pinned}
              memberCount={
                item.type === "group" ? item.participants.length : undefined
              }
              unreadCount={isUnread ? unread : undefined}
              size="lg"
            />
          )}
          {profileImage && !!statusColor && statusColor === STATUS_COLORS.online ? (
            <View
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ backgroundColor: "#22c55e", borderColor: THEME.bg }}
            />
          ) : null}
          {profileImage && item.is_pinned ? (
            <View className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full items-center justify-center border border-[#0b1220]">
              <Ionicons name="pin" size={12} color="white" />
            </View>
          ) : null}
          {profileImage && isUnread ? (
            <View
              className="absolute -top-1 -right-1 rounded-full items-center justify-center border"
              style={{
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                backgroundColor: "#ef4444",
                borderColor: THEME.bg,
              }}
            >
              <Text className="text-white text-xs font-bold">
                {formatUnreadCount(unread)}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-1 ml-3.5 min-w-0">
          <View className="flex-row items-center justify-between mb-0.5">
            <View className="flex-row items-center gap-2 flex-1 pr-2">
              <Text
                className={`text-[14px] ${isUnread ? "font-bold" : "font-semibold"}`}
                style={{ color: THEME.text }}
                numberOfLines={1}
              >
                {name}
              </Text>
              {item.is_muted && (
                <Ionicons
                  name="volume-mute"
                  size={16}
                color={THEME.textSubtle}
                />
              )}
            </View>
            <Text
              className={`text-[11px] ${isUnread ? "font-semibold" : ""}`}
              style={{ color: isUnread ? THEME.accent : THEME.textSubtle }}
            >
              {time}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 text-[12px] mr-2 ${isUnread ? "font-medium" : ""}`}
              style={{ color: isUnread ? THEME.textMuted : THEME.textSubtle }}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {isUnread && (
              <View
                className="min-w-[22px] h-[22px] px-1.5 rounded-full items-center justify-center"
                style={{ backgroundColor: THEME.accent }}
              >
                <Text className="text-white text-[11px] font-bold">
                  {formatUnreadCount(unread)}
                </Text>
              </View>
            )}
          </View>
          {item.type === "group" && item.participants.length > 0 && (
            <Text
              className="text-[11px] mt-1"
              style={{ color: THEME.textSubtle }}
              numberOfLines={1}
            >
              {activeCount} active - {item.participants.length} members
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: THEME.bg }}
      >
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="mt-4" style={{ color: THEME.textMuted }}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: THEME.bg }}>
      <View className="px-5 pt-12 pb-4">
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

      <FilterBtn
        filters={MESSAGE_FILTERS}
        selected={selectedFilter}
        onSelect={setSelectedFilter}
      />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 py-2"
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
