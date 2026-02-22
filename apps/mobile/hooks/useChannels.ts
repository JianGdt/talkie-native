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
  const [userChannels, setUserChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ChannelCategoryType>("all");

  const fetchUserChannels = useCallback(async () => {
    try {
      const joined = await channelService.getUserChannels();
      setUserChannels(new Set(joined.map((c) => c.id)));
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        console.error("Failed to fetch user channels:", err);
      }
    }
  }, []);

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
      // ✅ Parallel fetch
      await Promise.all([fetchChannels(), fetchUserChannels()]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
      } else {
        Alert.alert("Error", "Failed to load channels.");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchChannels, fetchUserChannels]);

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    setChannels((prev) =>
      prev.map((c) => ({ ...c, isActive: userChannels.has(c.id) })),
    );
  }, [userChannels]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    reloadData().finally(() => setRefreshing(false));
  }, [reloadData]);

  const handleJoinChannel = useCallback(
    (channel: Channel) => {
      if (!isAuthenticated) {
        Alert.alert("Error", "Please wait for authentication");
        return;
      }
      if (!isConnected) {
        Alert.alert("Error", "Not connected to server");
        return;
      }

      setUserChannels((prev) => new Set(prev).add(channel.id));
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, isActive: true } : c)),
      );

      sendMessage({
        type: MessageType.JOIN_CHANNEL,
        payload: { channelId: channel.id, user: { userId, username } },
        timestamp: Date.now(),
      });

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
    },
    [isAuthenticated, isConnected, sendMessage, userId, username, router],
  );

  const handleLeaveChannel = useCallback(
    (channel: Channel) => {
      if (!isConnected) {
        Alert.alert("Error", "Not connected to server");
        return;
      }

      setUserChannels((prev) => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, isActive: false } : c)),
      );

      sendMessage({
        type: MessageType.LEAVE_CHANNEL,
        payload: { channelId: channel.id },
        timestamp: Date.now(),
      });
    },
    [isConnected, sendMessage],
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
