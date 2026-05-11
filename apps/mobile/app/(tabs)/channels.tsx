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
        className={`bg-white rounded-3xl overflow-hidden border ${
          item.isActive ? "border-emerald-300" : "border-gray-100"
        }`}
        style={
          item.isActive
            ? { shadowColor: THEME.accent, shadowOpacity: 0.12, shadowRadius: 8 }
            : undefined
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
                  <Text className="text-gray-900 text-lg font-bold tracking-tight">
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
                <Text className="text-gray-500 text-sm leading-5 mb-2">
                  {item.description}
                </Text>
                {item.lastActivity && (
                  <Text className="text-gray-400 text-xs">
                    Last activity: {item.lastActivity}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
            <View className="flex-row items-center gap-5">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center">
                  <Ionicons name="people" size={16} color={THEME.textMuted} />
                </View>
                <View>
                  <Text className="text-gray-400 text-xs">Members</Text>
                  <Text className="text-gray-900 text-sm font-semibold">
                    {item.members}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center">
                  <View
                    className={`w-2.5 h-2.5 rounded-full ${item.members > 5 ? "bg-emerald-500" : "bg-gray-300"}`}
                  />
                </View>
                <View>
                  <Text className="text-gray-400 text-xs">Status</Text>
                  <Text
                    className={`text-sm font-semibold ${item.members > 5 ? "text-emerald-600" : "text-gray-400"}`}
                  >
                    {item.members > 5 ? "Active" : "Quiet"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className={`px-6 py-3 rounded-2xl ${
                item.isActive ? "bg-gray-100 border border-gray-200" : ""
              }`}
              style={
                !item.isActive ? { backgroundColor: THEME.accent } : undefined
              }
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                item.isActive
                  ? handleLeaveChannel(item)
                  : handleJoinChannel(item);
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
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text className="text-gray-500 mt-4">Loading channels...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <ScreenHeader
          title="Channels"
          subtitle={`${filteredChannels.length} available`}
          onAddPress={() => setShowCreateModal(true)}
        />
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search channels..."
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
        contentContainerClassName="px-6 py-5"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            iconName="add-circle-outline"
            title="No channels yet"
            subtitle={
              searchQuery
                ? "Try adjusting your search"
                : "Create the first channel to get started"
            }
            ctaLabel={!searchQuery ? "Create Channel" : undefined}
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
