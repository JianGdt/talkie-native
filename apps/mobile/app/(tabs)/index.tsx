import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversation";
import {
  formatPreviewContent,
  getActiveGroupMemberCount,
  getUsersAvatar,
  getUsersName,
  getUsersProfileImage,
} from "@/utils/conversation";
import type { Conversation } from "@/api/services/conversationServices";
import { formatRelativeTime, formatUnreadCount } from "@/utils/formats";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import UserSearchModal from "@/components/modal/UserSearch";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { THEME } from "@/constant/theme";

type HomeFilter = "all" | "unread" | "private" | "groups";

const HOME_FILTERS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "private", label: "Private" },
  { id: "groups", label: "Groups" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isUserOnline = useWebSocketStore((s) => s.isUserOnline);
  const onlineUsers = useWebSocketStore((s) => s.onlineUsers);
  const {
    conversations,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    fetchConversations,
    handleRefresh,
    markAsRead,
  } = useConversations();

  const [homeFilter, setHomeFilter] = useState<HomeFilter>("all");
  const [showUserSearch, setShowUserSearch] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  const displayName = user?.name || user?.username || user?.email?.split("@")[0] || "there";

  const userInitial = displayName.slice(0, 1).toUpperCase();

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let items = conversations.filter((conv) => {
      if (!q) return true;
      return (
        conv.name?.toLowerCase().includes(q) ||
        conv.participants?.some((p) => p.name.toLowerCase().includes(q))
      );
    });

    if (homeFilter === "unread") {
      items = items.filter((c) => (c.unread_count ?? 0) > 0);
    } else if (homeFilter === "private") {
      items = items.filter((c) => c.type === "direct");
    } else if (homeFilter === "groups") {
      items = items.filter((c) => c.type === "group");
    }

    return items;
  }, [conversations, searchQuery, homeFilter]);

  const storyItems = useMemo(() => {
    const directs = conversations.filter((c) => c.type === "direct");
    return directs.slice(0, 12);
  }, [conversations]);

  const handleUserSelect = (
    conversationId: string,
    userName: string,
    otherUserId: string,
    avatar?: string,
  ) => {
    router.push({
      pathname: "/messages/[id]",
      params: {
        id: conversationId,
        type: "direct",
        name: userName,
        userId: otherUserId,
        avatar,
      },
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
        ? conv.participants.find((p) => p.id !== user?.id)?.id ??
          conv.participants[0]?.id
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

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getUsersName(item);
    const avatar = getUsersAvatar(item);
    const profileImage = getUsersProfileImage(item);
    const time = formatRelativeTime(item.last_message?.timestamp);
    const unread = item.unread_count ?? 0;
    const isUnread = unread > 0 && !item.last_message?.isRead;
    const activeCount = getActiveGroupMemberCount(item, onlineUsers, user?.id);
    const otherUserId =
      item.type === "direct"
        ? item.participants.find((p) => p.id !== user?.id)?.id
        : undefined;
    const isOnline = otherUserId ? isUserOnline(otherUserId) : false;

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
              colorClass={
                item.type === "direct"
                  ? "bg-emerald-500"
                  : "bg-gradient-to-br from-emerald-400 to-teal-500"
              }
              label={avatar}
              isActive={!!isOnline}
              size="lg"
            />
          )}
          {profileImage && isOnline ? (
            <View
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ backgroundColor: "#22c55e", borderColor: THEME.bg }}
            />
          ) : null}
        </View>
        <View className="flex-1 ml-3.5 min-w-0">
          <View className="flex-row items-center justify-between mb-0.5">
              <Text
              className={`text-[14px] ${isUnread ? "font-bold" : "font-semibold"}`}
              style={{ color: THEME.text }}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className={`text-[11px] ml-2 ${isUnread ? "font-semibold" : ""}`}
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
              {item.type === "group"
                ? `${activeCount} active - ${preview}`
                : preview}
            </Text>
            {isUnread ? (
              <View
                className="min-w-[22px] h-[22px] px-1.5 rounded-full items-center justify-center"
                style={{ backgroundColor: THEME.accent }}
              >
                <Text className="text-white text-[11px] font-bold">
                  {formatUnreadCount(unread)}
                </Text>
              </View>
            ) : item.last_message?.isRead ? (
              <Ionicons name="checkmark-done" size={18} color={THEME.accent} />
            ) : null}
          </View>
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
        <Text className="mt-4 text-sm" style={{ color: THEME.textMuted }}>
          Loading chats...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: THEME.bg }}>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <View className="pt-12 px-5 pb-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="mr-3">
                    <ProfileAvatar
                      value={user?.profileImage}
                      fallbackLabel={userInitial}
                      size={40}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px]" style={{ color: THEME.textSubtle }}>
                      Welcome,
                    </Text>
                    <Text
                      className="text-[15px] font-semibold"
                      style={{ color: THEME.text }}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="w-10 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: THEME.accent }}
                  activeOpacity={0.7}
                  onPress={() => setShowUserSearch(true)}
                >
                  <Ionicons name="add" size={22} color="white" />
                </TouchableOpacity>
              </View>

              <View
                className="flex-row items-center rounded-lg px-3 py-2 mt-4 border"
                style={{ backgroundColor: THEME.inputBg, borderColor: THEME.border }}
              >
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-[13px] py-0"
                  placeholder="Search..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ outline: "none", color: THEME.text } as any}
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {storyItems.length > 0 ? (
              <View className="mt-2 mb-1">
                <Text
                  className="px-5 mb-3 text-[13px] font-semibold"
                  style={{ color: THEME.text }}
                >
                  Chatrooms
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                  {storyItems.map((conv, index) => {
                    const name = getUsersName(conv);
                    const otherId =
                      conv.participants.find((p) => p.id !== user?.id)?.id ??
                      conv.participants[0]?.id;
                    const online = otherId ? isUserOnline(otherId) : false;
                    const gradients = [
                      ["#f7ff00", "#00d1ff"],
                      ["#0ea5e9", "#0057d9"],
                      ["#d300ff", "#00e6b8"],
                      ["#f97316", "#ef4444"],
                    ];
                    const colors = gradients[index % gradients.length];
                    return (
                      <TouchableOpacity
                        key={conv.id}
                        className="w-[76px] h-[104px] rounded-2xl justify-between p-2 overflow-hidden"
                        style={{ backgroundColor: colors[1] }}
                        activeOpacity={0.7}
                        onPress={() => handleConversationPress(conv)}
                      >
                        <View
                          className="absolute inset-0"
                          style={{ backgroundColor: colors[0], opacity: 0.86 }}
                        />
                        <View className="h-8" />
                        <Text
                          className="text-white text-[10px] font-bold"
                          numberOfLines={2}
                        >
                          {name}
                        </Text>
                        <View className="flex-row justify-end">
                          <Ionicons
                            name={online ? "heart" : "heart-outline"}
                            size={12}
                            color="white"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View className="px-5 mt-4 mb-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {HOME_FILTERS.map((f) => {
                  const active = homeFilter === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setHomeFilter(f.id)}
                      activeOpacity={0.7}
                      className="px-4 py-2.5 rounded-full"
                      style={{
                        backgroundColor: active ? THEME.accent : "#f3f4f6",
                      }}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active ? "text-white" : "text-gray-600"
                        }`}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="px-5 pt-2 pb-1">
              <Text className="text-[13px] font-semibold" style={{ color: THEME.text }}>
                Favourites
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="px-5 py-16 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: THEME.surfaceRaised }}
            >
              <Ionicons name="chatbubbles-outline" size={28} color={THEME.accent} />
            </View>
            <Text className="font-semibold text-base" style={{ color: THEME.text }}>
              No conversations yet
            </Text>
            <Text className="text-sm text-center mt-2 px-8" style={{ color: THEME.textMuted }}>
              {searchQuery
                ? "Try a different search"
                : "Tap the pencil to start a new chat"}
            </Text>
            {!searchQuery ? (
              <TouchableOpacity
                className="mt-6 px-6 py-3 rounded-full"
                style={{ backgroundColor: THEME.accent }}
                onPress={() => setShowUserSearch(true)}
              >
                <Text className="text-white font-semibold">New message</Text>
              </TouchableOpacity>
            ) : null}
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
