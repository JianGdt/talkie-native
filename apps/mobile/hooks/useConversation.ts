import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import {
  Conversation,
  conversationService,
} from "@/api/services/conversationServices";
import { MessageFilterType } from "@/constant/chats";

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
}

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<MessageFilterType>("all");

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await conversationService.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((conv) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      conv.name?.toLowerCase().includes(q) ||
      conv.participants.some((p) => p.name.toLowerCase().includes(q));

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
  };
}
