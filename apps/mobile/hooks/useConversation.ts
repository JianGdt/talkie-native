import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  Conversation,
  conversationService,
} from "@/api/services/conversationServices";
import { ApiError } from "@/api/client";
import { MessageFilterType } from "@/constant/chats";
import { useWebSocketStore } from "@/store/useWebSocketStore";

interface UseConversationsReturn {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  selectedFilter: MessageFilterType;
  setSearchQuery: (q: string) => void;
  setSelectedFilter: (f: MessageFilterType) => void;
  fetchConversations: () => Promise<void>;
  handleRefresh: () => void;
  markAsRead: (conversationId: string) => void;
}

export function useConversations(): UseConversationsReturn {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<MessageFilterType>("all");

  const { conversations, markConversationAsRead, setConversations } =
    useWebSocketStore();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await conversationService.getConversations();
      setConversations(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
      } else {
        Alert.alert("Error", "Failed to load conversations.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const markAsRead = useCallback(
    (conversationId: string) => {
      markConversationAsRead(conversationId);

      conversationService.markAsRead(conversationId).catch((err) => {
        console.warn("Failed to mark conversation as read on server:", err);
      });
    },
    [markConversationAsRead],
  );

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      conv.name?.toLowerCase().includes(q) ||
      conv.participants?.some((p) => p.name.toLowerCase().includes(q));

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "direct" && conv.type === "direct") ||
      (selectedFilter === "groups" && conv.type === "group");

    return matchesSearch && matchesFilter;
  });

  return {
    conversations,
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
  };
}
