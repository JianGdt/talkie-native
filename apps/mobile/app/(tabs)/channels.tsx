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
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { BackgroundGlow } from "@/components/shared/BackgroundGlow";
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
        className={`bg-slate-900/50 backdrop-blur-xl rounded-3xl overflow-hidden border ${
          item.isActive
            ? "border-blue-500/50 shadow-lg shadow-blue-500/20"
            : "border-slate-800/50"
        }`}
      >
        {item.isActive && (
          <View className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
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
                  <Text className="text-white text-lg font-bold tracking-tight">
                    {item.name}
                  </Text>
                  {item.isActive && (
                    <View className="bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/30">
                      <Text className="text-blue-300 text-xs font-semibold tracking-wide">
                        JOINED
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-slate-400 text-sm leading-5 mb-2">
                  {item.description}
                </Text>
                {item.lastActivity && (
                  <Text className="text-slate-500 text-xs">
                    Last activity: {item.lastActivity}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-4 border-t border-slate-800/50">
            <View className="flex-row items-center gap-5">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 bg-slate-800/50 rounded-lg items-center justify-center">
                  <Ionicons name="people" size={16} color="#64748b" />
                </View>
                <View>
                  <Text className="text-slate-400 text-xs">Members</Text>
                  <Text className="text-white text-sm font-semibold">
                    {item.members}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 bg-slate-800/50 rounded-lg items-center justify-center">
                  <View
                    className={`w-2.5 h-2.5 rounded-full ${item.members > 5 ? "bg-emerald-400" : "bg-slate-600"}`}
                  />
                </View>
                <View>
                  <Text className="text-slate-400 text-xs">Status</Text>
                  <Text
                    className={`text-sm font-semibold ${item.members > 5 ? "text-emerald-400" : "text-slate-400"}`}
                  >
                    {item.members > 5 ? "Active" : "Quiet"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className={`px-6 py-3 rounded-2xl shadow-lg ${
                item.isActive
                  ? "bg-slate-800/80 border border-slate-700"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
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
                  color={item.isActive ? "#94a3b8" : "white"}
                />
                <Text
                  className={`font-bold text-sm ${item.isActive ? "text-slate-400" : "text-white"}`}
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
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4">Loading channels...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <BackgroundGlow
        glows={[
          { position: "top-left", color: "blue" },
          { position: "bottom-right", color: "purple" },
        ]}
      />

      <View className="bg-slate-900/80 backdrop-blur-xl px-6 pt-16 pb-6 border-b border-slate-800/50">
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

      <View className="border-b border-slate-800/50">
        <FilterBtn
          filters={CHANNEL_CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          activeCount={filteredChannels.length}
          scrollable
        />
      </View>

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
