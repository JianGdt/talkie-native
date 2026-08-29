import React, { useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useChannels } from "@/hooks/useChannels";
import { getCategoryIcon, type Channel } from "@/utils/channels";
import CreateChannelModal from "@/components/modal/CreateChannel";
import { CHANNEL_CATEGORIES } from "@/constant/chats";
import { THEME } from "@/constant/theme";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBtn } from "@/components/shared/Filter";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ChannelsScreen() {
  const {
    filteredChannels,
    loading,
    refreshing,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    handleRefresh,
    handleJoinChannel,
    handleLeaveChannel,
    reloadData,
  } = useChannels();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      className="mb-3"
      activeOpacity={0.7}
      onPress={() => handleJoinChannel(item)}
    >
      <View
        className="rounded-2xl overflow-hidden border"
        style={
          item.isActive
            ? {
                backgroundColor: THEME.surface,
                borderColor: THEME.accent,
                shadowColor: THEME.accent,
                shadowOpacity: 0.12,
                shadowRadius: 8,
              }
            : { backgroundColor: THEME.surface, borderColor: THEME.border }
        }
      >
        {item.isActive && (
          <View className="h-1" style={{ backgroundColor: THEME.accent }} />
        )}

        <View className="p-5">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-start gap-4 flex-1">
              <AvatarBadge
                colorClass={item.color}
                label=""
                iconName={getCategoryIcon(item.category)}
                isActive={item.isActive}
                unreadCount={item.unreadCount}
              />

              <View className="flex-1 pt-0.5">
                <View className="flex-row items-center gap-2 mb-1.5">
                  <Text
                    className="text-base font-bold"
                    style={{ color: THEME.text }}
                  >
                    {item.name}
                  </Text>
                  {item.isActive && (
                    <View
                      className="px-2.5 py-1 rounded-full border"
                      style={{
                        backgroundColor: THEME.accentSoft,
                        borderColor: THEME.accent,
                      }}
                    >
                      <Text
                        className="text-xs font-semibold tracking-wide"
                        style={{ color: THEME.accent }}
                      >
                        JOINED
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm leading-5 mb-2" style={{ color: THEME.textMuted }}>
                  {item.description}
                </Text>
                {item.lastActivity && (
                  <Text className="text-xs" style={{ color: THEME.textSubtle }}>
                    Last activity: {item.lastActivity}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View
            className="flex-row items-center justify-between pt-4 border-t"
            style={{ borderTopColor: THEME.border }}
          >
            <View className="flex-row items-center gap-5">
              <View className="flex-row items-center gap-2">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: THEME.inputBg }}
                >
                  <Ionicons name="people" size={16} color={THEME.textMuted} />
                </View>
                <View>
                  <Text className="text-xs" style={{ color: THEME.textSubtle }}>
                    Members
                  </Text>
                  <Text className="text-sm font-semibold" style={{ color: THEME.text }}>
                    {item.members}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View
                  className="w-8 h-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: THEME.inputBg }}
                >
                  <View
                    className={`w-2.5 h-2.5 rounded-full ${item.members > 5 ? "bg-emerald-500" : "bg-gray-300"}`}
                  />
                </View>
                <View>
                  <Text className="text-xs" style={{ color: THEME.textSubtle }}>
                    Status
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${item.members > 5 ? "text-emerald-600" : "text-gray-400"}`}
                  >
                    {item.members > 5 ? "Active" : "Quiet"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="px-6 py-3 rounded-xl border"
              style={
                item.isActive
                  ? { backgroundColor: THEME.inputBg, borderColor: THEME.border }
                  : { backgroundColor: THEME.accent, borderColor: THEME.accent }
              }
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                if (item.isActive) {
                  handleLeaveChannel(item);
                } else {
                  handleJoinChannel(item);
                }
              }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name={item.isActive ? "exit-outline" : "enter-outline"}
                  size={18}
                  color={item.isActive ? THEME.textMuted : "white"}
                />
                <Text
                  className={`font-bold text-sm ${item.isActive ? "text-gray-600" : "text-white"}`}
                >
                  {item.isActive ? "Leave" : "Join"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: THEME.bg }}
      >
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="mt-4" style={{ color: THEME.textMuted }}>
          Loading channels...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: THEME.bg }}>
      <View className="px-5 pt-12 pb-4">
        <ScreenHeader
          title="Channels"
          subtitle={`${filteredChannels.length} joined`}
          onAddPress={() => setShowCreateModal(true)}
        />
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your groups..."
        />
      </View>

      <FilterBtn
        filters={CHANNEL_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        activeCount={filteredChannels.length}
        scrollable
      />

      <FlatList
        data={filteredChannels}
        renderItem={renderChannel}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 py-5"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            iconName="add-circle-outline"
            title="No groups yet"
            subtitle={
              searchQuery
                ? "Try adjusting your search"
                : "Groups will appear here after someone adds you"
            }
            ctaLabel={!searchQuery ? "Create Group" : undefined}
            onCtaPress={
              !searchQuery ? () => setShowCreateModal(true) : undefined
            }
          />
        }
      />

      <CreateChannelModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChannelCreated={reloadData}
      />
    </View>
  );
}
