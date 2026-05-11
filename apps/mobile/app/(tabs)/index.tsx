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
import { getUsersAvatar, getUsersName } from "@/utils/conversation";
import type { Conversation } from "@/api/services/conversationServices";
import { formatRelativeTime, formatUnreadCount } from "@/utils/formats";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import UserSearchModal from "@/components/modal/UserSearch";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
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
  ) => {
    router.push({
      pathname: "/messages/[id]",
      params: { id: conversationId, type: "direct", name: userName, userId: otherUserId },
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
        ...(directUserId ? { userId: directUserId } : {}),
      },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getUsersName(item);
    const avatar = getUsersAvatar(item);
    const time = formatRelativeTime(item.last_message?.timestamp);
    const unread = item.unread_count ?? 0;
    const isUnread = unread > 0 && !item.last_message?.isRead;
    const otherUserId =
      item.type === "direct"
        ? item.participants.find((p) => p.id !== user?.id)?.id
        : undefined;
    const isOnline = otherUserId ? isUserOnline(otherUserId) : false;

    const preview =
      item.type === "group" && item.last_message?.sender
        ? `${item.last_message.sender}: ${item.last_message.content ?? ""}`
        : item.last_message?.content || "No messages yet";

    return (
      <TouchableOpacity
        className="flex-row items-center py-3.5 border-b border-gray-100 active:bg-gray-50"
        activeOpacity={0.7}
        onPress={() => handleConversationPress(item)}
      >
        <View className="relative">
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
        </View>
        <View className="flex-1 ml-3.5 min-w-0">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text
              className={`text-[16px] tracking-tight ${
                isUnread ? "text-gray-900 font-bold" : "text-gray-900 font-semibold"
              }`}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className={`text-[12px] ml-2 ${
                isUnread ? "text-emerald-600 font-semibold" : "text-gray-400"
              }`}
            >
              {time}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 text-[14px] mr-2 ${
                isUnread ? "text-gray-800 font-medium" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {preview}
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
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="text-gray-500 mt-4 text-sm">Loading chats…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
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
            <View className="pt-14 px-5 pb-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: THEME.accentSoft }}
                  >
                    <Text className="text-emerald-700 text-lg font-bold">
                      {userInitial}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-sm">Welcome,</Text>
                    <Text
                      className="text-gray-900 text-xl font-bold tracking-tight"
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  className="w-11 h-11 rounded-full items-center justify-center bg-gray-100"
                  activeOpacity={0.7}
                  onPress={() => setShowUserSearch(true)}
                >
                  <Ionicons name="create-outline" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3.5 mt-5">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900 py-0"
                  placeholder="Search…"
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ outline: "none" } as any}
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                >
                  {storyItems.map((conv) => {
                    const name = getUsersName(conv);
                    const avatar = getUsersAvatar(conv);
                    const otherId =
                      conv.participants.find((p) => p.id !== user?.id)?.id ??
                      conv.participants[0]?.id;
                    const online = otherId ? isUserOnline(otherId) : false;
                    return (
                      <TouchableOpacity
                        key={conv.id}
                        className="items-center w-[64px]"
                        activeOpacity={0.7}
                        onPress={() => handleConversationPress(conv)}
                      >
                        <AvatarBadge
                          colorClass="bg-emerald-500"
                          label={avatar}
                          isActive={online}
                          size="lg"
                        />
                        <Text
                          className="text-gray-700 text-[11px] font-medium mt-2 text-center"
                          numberOfLines={1}
                        >
                          {name.split(" ")[0]}
                        </Text>
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
              <Text className="text-gray-900 text-lg font-bold">Chats</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="px-5 py-16 items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: THEME.accentSoft }}
            >
              <Ionicons name="chatbubbles-outline" size={28} color={THEME.accent} />
            </View>
            <Text className="text-gray-900 font-semibold text-base">
              No conversations yet
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-2 px-8">
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
