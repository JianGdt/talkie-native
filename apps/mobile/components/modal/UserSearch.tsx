import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/api/endpoints";
import { apiClient, ApiError } from "@/api/client";
import { conversationService } from "@/api/services/conversationServices";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { debounce } from "lodash";

import { SearchBar } from "@/components/shared/SearchBar";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { THEME } from "@/constant/theme";

interface User {
  id: string;
  name: string;
  full_name?: string;
  avatar?: string;
  email?: string;
  status: string;
}

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSelect: (
    conversationId: string,
    userName: string,
    userId: string,
    avatar?: string,
  ) => void;
}

export default function UserSearchModal({
  visible,
  onClose,
  onUserSelect,
}: UserSearchModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isUserOnline } = useWebSocketStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchUsers = useMemo(
    () => async (query: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    try {
      setLoading(true);
      setError(null);
      const results = await apiClient.get<User[]>(API_ENDPOINTS.USERS_SEARCH, {
        params: { q: query.trim().slice(0, 100) },
        signal: abortControllerRef.current.signal,
      });
      setUsers(results.filter((u) => u.id !== user?.id));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(
        err instanceof ApiError
          ? "Search failed. Please try again."
          : "Unable to connect to user search.",
      );
    } finally {
      setLoading(false);
    }
  },
    [user?.id],
  );

  const debouncedSearch = useMemo(
    () => debounce((query: string) => searchUsers(query), 500),
    [searchUsers],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setError(null);
      debouncedSearch.cancel();
      return;
    }
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    };
  }, [debouncedSearch, searchQuery]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setUsers([]);
      setError(null);
      debouncedSearch.cancel();
      abortControllerRef.current?.abort();
    }
  }, [debouncedSearch, visible]);

  const handleUserSelect = async (selectedUser: User) => {
    try {
      setCreating(true);
      const result = await conversationService.createDirect(selectedUser.id);
      onClose();
      onUserSelect(
        result.conversationId,
        selectedUser.name,
        selectedUser.id,
        selectedUser.avatar,
      );
    } catch {
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const initials = item.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const online = isUserOnline(item.id);

    return (
      <TouchableOpacity
        className="flex-row items-center gap-4 p-4 border-b"
        style={{ borderBottomColor: THEME.border }}
        activeOpacity={0.7}
        onPress={() => handleUserSelect(item)}
        disabled={creating}
      >
        <View className="relative">
          {item.avatar ? (
            <ProfileAvatar value={item.avatar} fallbackLabel={initials} size={40} />
          ) : (
            <AvatarBadge
              colorClass="bg-emerald-500"
              label={initials}
              isActive={online}
              size="sm"
            />
          )}
          {item.avatar && online ? (
            <View
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: "#22c55e", borderColor: THEME.bg }}
            />
          ) : null}
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: THEME.text }}>
            {item.name}
          </Text>
          {item.full_name && (
            <Text className="text-sm" style={{ color: THEME.textMuted }}>
              {item.full_name}
            </Text>
          )}
          <Text className="text-xs capitalize" style={{ color: THEME.textSubtle }}>
            {online ? "online" : "offline"}
          </Text>
        </View>

        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: THEME.accentSoft }}
        >
          <Ionicons name="chatbubble" size={20} color={THEME.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: THEME.bg }}>
        <View
          className="px-5 pb-6 border-b"
          style={{ backgroundColor: THEME.bg, borderBottomColor: THEME.border }}
        >
          <View className="flex-row items-center gap-4 mb-6 pt-4">
            <TouchableOpacity
              className="w-10 h-10 rounded-lg items-center justify-center"
              style={{ backgroundColor: THEME.surface }}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={THEME.textMuted} />
            </TouchableOpacity>
            <Text className="text-xl font-bold flex-1" style={{ color: THEME.text }}>
              New Message
            </Text>
          </View>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
            loading={loading}
            autoFocus
          />

          {error && (
            <Text className="text-red-500 text-sm mt-3 text-center">
              {error}
            </Text>
          )}
        </View>

        {searchQuery.trim() === "" ? (
          <EmptyState
            iconName="search"
            title="Search for people"
            subtitle="Type a name, username, or email to find someone to message"
          />
        ) : users.length === 0 && !loading && !error ? (
          <EmptyState
            iconName="person-outline"
            title="No users found"
            subtitle="Try a different name, username, or email"
          />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerClassName="py-2"
          />
        )}

        {creating && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: "rgba(37,41,61,0.92)" }}
          >
            <ActivityIndicator size="large" color={THEME.accent} />
            <Text className="mt-4" style={{ color: THEME.textMuted }}>
              Starting conversation...
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
