import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { channelService } from "@/api/services/channelServices";
import { ApiError } from "@/api/client";
import { MessageType } from "@/@types/talkie";
import { transformChannel, type Channel } from "@/utils/channels";
import { useRouter } from "expo-router";
import { ChannelCategoryType } from "@/constant/chats";

interface UseChannelsReturn {
  channels: Channel[];
  filteredChannels: Channel[];
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  selectedCategory: ChannelCategoryType;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: ChannelCategoryType) => void;
  handleRefresh: () => void;
  handleJoinChannel: (channel: Channel) => void;
  handleLeaveChannel: (channel: Channel) => void;
  reloadData: () => Promise<void>;
}

export function useChannels(): UseChannelsReturn {
  const { sendMessage, userId, username, isAuthenticated, isConnected } =
    useWebSocketStore();
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ChannelCategoryType>("all");

  const fetchChannels = useCallback(async () => {
    try {
      const data = await channelService.getChannels();
      setChannels(data.map(transformChannel));
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        console.error("Failed to fetch channels:", err);
      }
    }
  }, []);

  const reloadData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchChannels();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
      } else {
        Alert.alert("Error", "Failed to load channels.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchChannels]);

  useEffect(() => {
    reloadData();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    reloadData().finally(() => setRefreshing(false));
  }, [reloadData]);

  const setMembership = useCallback((channelId: string, isMember: boolean) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isActive: isMember } : c)),
    );
  }, []);

  const handleJoinChannel = useCallback(
    async (channel: Channel) => {
      if (channel.isActive) {
        router.push({
          pathname: "/messages/[id]",
          params: {
            id: channel.id,
            type: "channel",
            name: channel.name,
            description: channel.description || "",
            memberCount: channel.members?.toString() || "0",
          },
        });
        return;
      }

      if (!isAuthenticated) {
        Alert.alert("Error", "Please wait for authentication");
        return;
      }
      if (!isConnected) {
        Alert.alert("Error", "Not connected to server");
        return;
      }

      setMembership(channel.id, true);

      try {
        // 1. Persist membership in DB
        await channelService.joinChannel(channel.id);

        // 2. Subscribe the socket to the channel room
        sendMessage({
          type: MessageType.JOIN_CHANNEL,
          payload: { channelId: channel.id, user: { userId, username } },
          timestamp: Date.now(),
        });

        // 3. Navigate into the channel
        router.push({
          pathname: "/messages/[id]",
          params: {
            id: channel.id,
            type: "channel",
            name: channel.name,
            description: channel.description || "",
            memberCount: channel.members?.toString() || "0",
          },
        });
      } catch (err) {
        // Roll back optimistic update on failure
        setMembership(channel.id, false);
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to join channel. Please try again.";
        Alert.alert("Error", message);
      }
    },
    [
      isAuthenticated,
      isConnected,
      sendMessage,
      userId,
      username,
      router,
      setMembership,
    ],
  );

  // ── Leave: REST first, then WS unsubscribe ────────────────
  const handleLeaveChannel = useCallback(
    async (channel: Channel) => {
      if (!isConnected) {
        Alert.alert("Error", "Not connected to server");
        return;
      }

      // Optimistic UI update
      setMembership(channel.id, false);

      try {
        // 1. Remove membership from DB
        await channelService.leaveChannel(channel.id);

        // 2. Unsubscribe the socket from the channel room
        sendMessage({
          type: MessageType.LEAVE_CHANNEL,
          payload: { channelId: channel.id },
          timestamp: Date.now(),
        });
      } catch (err) {
        // Roll back optimistic update on failure
        setMembership(channel.id, true);
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to leave channel. Please try again.";
        Alert.alert("Error", message);
      }
    },
    [isConnected, sendMessage, setMembership],
  );

  const filteredChannels = channels.filter((channel) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      channel.name.toLowerCase().includes(q) ||
      channel.description.toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === "all" || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return {
    channels,
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
  };
}
