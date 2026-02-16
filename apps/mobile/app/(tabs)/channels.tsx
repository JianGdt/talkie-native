import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { useAuth } from "@/hooks/useAuth";
import { MessageType } from "@/@types/talkie";
import {
  channelService,
  Channel as APIChannel,
} from "@/api/services/channelServices";
import CreateChannelModal from "@/components/modal/CreateChannel";
import { useRouter } from "expo-router";

interface Channel {
  id: string;
  name: string;
  description: string;
  members: number;
  isActive: boolean;
  category: "public" | "private" | "team";
  color: string;
  unreadCount?: number;
  lastActivity?: string;
}

export default function ChannelsScreen({ navigation }: any) {
  const { sendMessage, userId, username, isAuthenticated, isConnected } =
    useWebSocketStore();
  const { session } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "public" | "private" | "team"
  >("all");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userChannels, setUserChannels] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchChannels(), fetchUserChannels()]);
    setLoading(false);
  };

  const fetchUserChannels = async () => {
    try {
      const userJoinedChannels = await channelService.getUserChannels(
        session?.user?.id!,
        session?.access_token,
      );

      const joinedIds = new Set(userJoinedChannels.map((c: any) => c.id));
      setUserChannels(joinedIds);
    } catch (error) {
      console.error("Failed to fetch user channels:", error);
    }
  };

  const fetchChannels = async () => {
    try {
      const data = await channelService.getChannels(session?.access_token);

      const transformedChannels: Channel[] = data.map(
        (channel: APIChannel) => ({
          id: channel.id,
          name: channel.name,
          description: channel.description || "No description",
          members: channel.member_count || 0,
          isActive: false,
          category: channel.category || "public",
          color: getChannelColor(channel.id),
          unreadCount: 0,
          lastActivity: getTimeAgo(channel.updated_at || channel.created_at),
        }),
      );

      setChannels(transformedChannels);
    } catch (error) {
      console.error("Failed to fetch channels:", error);
    }
  };

  useEffect(() => {
    if (channels.length > 0 && userChannels.size > 0) {
      setChannels((prevChannels) =>
        prevChannels.map((channel) => ({
          ...channel,
          isActive: userChannels.has(channel.id),
        })),
      );
    }
  }, [userChannels.size]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  };

  const handleChannelCreated = (channelId: string, channelName: string) => {
    loadData();
    const newChannel = channels.find((c) => c.id === channelId);
    if (newChannel) {
      handleJoinChannel(newChannel);
    }
  };

  const getChannelColor = (channelId: string): string => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-indigo-500",
      "bg-amber-500",
      "bg-rose-500",
    ];

    let hash = 0;
    for (let i = 0; i < channelId.length; i++) {
      hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const categories = [
    { id: "all", label: "All Channels", icon: "apps" },
    { id: "public", label: "Public", icon: "globe-outline" },
    { id: "private", label: "Private", icon: "lock-closed-outline" },
    { id: "team", label: "Team", icon: "people-outline" },
  ];

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch =
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "private":
        return "lock-closed";
      case "team":
        return "people";
      default:
        return "globe";
    }
  };

  const handleJoinChannel = (channel: Channel) => {
    if (!isAuthenticated) {
      Alert.alert("Error", "Please wait for authentication");
      return;
    }

    if (!isConnected) {
      Alert.alert("Error", "Not connected to server");
      return;
    }

    try {
      console.log("🔌 Joining channel:", channel.name);

      sendMessage({
        type: MessageType.JOIN_CHANNEL,
        payload: {
          channelId: channel.id,
          user: { userId, username },
        },
        timestamp: Date.now(),
      });

      setUserChannels((prev) => new Set(prev).add(channel.id));
      setChannels(
        channels.map((c) =>
          c.id === channel.id ? { ...c, isActive: true } : c,
        ),
      );

      // Navigate to channel message screen
      setTimeout(() => {
        router.push({
          pathname: `/messages/${channel.id}`,
          params: {
            type: "channel",
            name: channel.name,
            description: channel.description || "",
            memberCount: channel.members?.toString() || "0",
          },
        });
      }, 300);
    } catch (error) {
      console.error("❌ Failed to join channel:", error);
      Alert.alert("Error", "Failed to join channel");
    }
  };

  const handleLeaveChannel = async (channel: Channel) => {
    if (!isConnected) {
      Alert.alert("Error", "Not connected to server");
      return;
    }

    try {
      sendMessage({
        type: MessageType.LEAVE_CHANNEL,
        payload: {
          channelId: channel.id,
        },
        timestamp: Date.now(),
      });

      setUserChannels((prev) => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });

      setChannels(
        channels.map((c) =>
          c.id === channel.id ? { ...c, isActive: false } : c,
        ),
      );
    } catch (error) {
      console.error("Failed to leave channel:", error);
      Alert.alert("Error", "Failed to leave channel");
    }
  };

  const handleChannelPress = (channel: Channel) => {
    if (channel.isActive) {
      navigation.navigate("MessageScreen", {
        conversationId: channel.id,
        type: "channel",
        name: channel.name,
        memberCount: channel.members,
        description: channel.description,
      });
    } else {
      handleJoinChannel(channel);
    }
  };

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      className="mb-3"
      activeOpacity={0.7}
      onPress={() => handleChannelPress(item)}
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
              <View className="relative">
                <View
                  className={`w-14 h-14 ${item.color} rounded-2xl items-center justify-center shadow-lg`}
                >
                  <Ionicons
                    name={getCategoryIcon(item.category)}
                    size={26}
                    color="white"
                  />
                </View>

                {item.unreadCount! > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 border-2 border-slate-900">
                    <Text className="text-white text-xs font-bold">
                      {item.unreadCount! > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                )}

                {item.isActive && (
                  <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900" />
                )}
              </View>

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
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.members > 5 ? "bg-emerald-400" : "bg-slate-600"
                    }`}
                  />
                </View>
                <View>
                  <Text className="text-slate-400 text-xs">Status</Text>
                  <Text
                    className={`text-sm font-semibold ${
                      item.members > 5 ? "text-emerald-400" : "text-slate-400"
                    }`}
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
              disabled={!isConnected}
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
                  className={`font-bold text-sm ${
                    item.isActive ? "text-slate-400" : "text-white"
                  }`}
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
      <View className="absolute inset-0 opacity-30">
        <View className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <View className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </View>

      <View className="bg-slate-900/80 backdrop-blur-xl px-6 pt-16 pb-6 border-b border-slate-800/50">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white text-3xl font-bold tracking-tight mb-1">
              Channels
            </Text>
            <Text className="text-slate-400 text-sm">
              {filteredChannels.length} available
            </Text>
          </View>

          {/* Create Channel Button */}
          <TouchableOpacity
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30"
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View className="bg-slate-800/50 backdrop-blur-sm rounded-2xl flex-row items-center px-5 py-4 border border-slate-700/50 shadow-xl">
          <Ionicons name="search" size={22} color="#64748b" />
          <TextInput
            className="flex-1 ml-4 text-white text-base"
            placeholder="Search channels..."
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

      <View className="border-b border-slate-800/50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-5"
          contentContainerClassName="gap-3"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id as any)}
              className={`px-5 py-3 rounded-2xl flex-row items-center gap-2.5 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                  : "bg-slate-900/50 backdrop-blur-sm border border-slate-800/50"
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? "white" : "#64748b"}
              />
              <Text
                className={`font-semibold text-sm ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-slate-400"
                }`}
              >
                {category.label}
              </Text>

              {selectedCategory === category.id && (
                <View className="ml-1 bg-white/20 rounded-full px-2 py-0.5">
                  <Text className="text-white text-xs font-bold">
                    {filteredChannels.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          <View className="items-center justify-center py-24">
            <View className="w-20 h-20 bg-slate-900/50 rounded-3xl items-center justify-center mb-5">
              <Ionicons name="add-circle-outline" size={40} color="#334155" />
            </View>
            <Text className="text-slate-400 text-lg font-semibold mb-2">
              No channels yet
            </Text>
            <Text className="text-slate-600 text-sm text-center px-12 mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : "Create the first channel to get started"}
            </Text>

            {!searchQuery && (
              <TouchableOpacity
                className="px-6 py-3 bg-blue-500 rounded-2xl"
                onPress={() => setShowCreateModal(true)}
              >
                <Text className="text-white font-semibold">Create Channel</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onChannelCreated={handleChannelCreated}
      />
    </View>
  );
}
