import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { API_ENDPOINTS } from "@/api/endpoints";
import { apiClient } from "@/api/client";
import { conversationService } from "@/api/services/conversationServices";
import { useWebSocketStore } from "@/store/useWebSocketStore";

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
  onUserSelect: (userId: string, userName: string) => void;
}

export default function UserSearchModal({
  visible,
  onClose,
  onUserSelect,
}: UserSearchModalProps) {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
    const { isUserOnline } = useWebSocketStore();


  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      const endpoint = `${API_ENDPOINTS.USERS_SEARCH}?q=${encodeURIComponent(query)}`;
      const results = await apiClient.get<User[]>(endpoint, {
        token: session?.access_token,
      });

      // Filter out current user
      const filteredUsers = results.filter((u) => u.id !== session?.user?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: User) => {
    try {
      setCreating(true);

      // Create or get existing DM conversation
      const result = await conversationService.createDirect(
        session?.user?.id!,
        user.id,
        session?.access_token,
      );

      // Close modal and navigate
      onClose();
      onUserSelect(result.conversationId, user.name);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (userId: string) => {
    const isOnline = isUserOnline(userId);
    return isOnline ? "bg-emerald-400" : "bg-slate-600";
  };

  const getStatusText = (userId: string) => {
    const isOnline = isUserOnline(userId);
    return isOnline ? "online" : "offline";
  };


  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      className="flex-row items-center gap-4 p-4 border-b border-slate-800/50"
      activeOpacity={0.7}
      onPress={() => handleUserSelect(item)}
      disabled={creating}
    >
      {/* Avatar */}
      <View className="relative">
        <View className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl items-center justify-center">
          <Text className="text-white text-lg font-bold">
            {item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>

        {/* ✨ Real-time status indicator */}
        <View
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusColor(item.id)} rounded-full border-2 border-slate-900`}
        />
      </View>

      {/* User Info */}
      <View className="flex-1">
        <Text className="text-white text-base font-semibold">{item.name}</Text>
        {item.full_name && (
          <Text className="text-slate-400 text-sm">{item.full_name}</Text>
        )}
        {/* ✨ Real-time status text */}
        <Text className="text-slate-500 text-xs capitalize">
          {getStatusText(item.id)}
        </Text>
      </View>

      {/* Message Icon */}
      <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center">
        <Ionicons name="chatbubble" size={20} color="#3b82f6" />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-950">
        {/* Gradient Background */}
        <View className="absolute inset-0 opacity-20">
          <View className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          <View className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
        </View>

        {/* Header */}
        <View className="bg-slate-900/80 backdrop-blur-xl px-6 pt-16 pb-6 border-b border-slate-800/50">
          <View className="flex-row items-center gap-4 mb-6">
            <TouchableOpacity
              className="w-10 h-10 bg-slate-800/50 rounded-xl items-center justify-center"
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <Text className="text-white text-2xl font-bold tracking-tight flex-1">
              New Message
            </Text>
          </View>

          {/* Search Bar */}
          <View className="bg-slate-800/50 backdrop-blur-sm rounded-2xl flex-row items-center px-5 py-4 border border-slate-700/50">
            <Ionicons name="search" size={22} color="#64748b" />
            <TextInput
              className="flex-1 ml-4 text-white text-base"
              placeholder="Search users..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color="#3b82f6" />}
          </View>
        </View>

        {/* Results */}
        {searchQuery.trim() === "" ? (
          <View className="flex-1 items-center justify-center px-12">
            <View className="w-20 h-20 bg-slate-900/50 rounded-3xl items-center justify-center mb-5">
              <Ionicons name="search" size={40} color="#334155" />
            </View>
            <Text className="text-slate-400 text-lg font-semibold text-center mb-2">
              Search for people
            </Text>
            <Text className="text-slate-600 text-sm text-center">
              Type a name or username to find someone to message
            </Text>
          </View>
        ) : users.length === 0 && !loading ? (
          <View className="flex-1 items-center justify-center px-12">
            <View className="w-20 h-20 bg-slate-900/50 rounded-3xl items-center justify-center mb-5">
              <Ionicons name="person-outline" size={40} color="#334155" />
            </View>
            <Text className="text-slate-400 text-lg font-semibold text-center mb-2">
              No users found
            </Text>
            <Text className="text-slate-600 text-sm text-center">
              Try searching with a different name
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerClassName="py-2"
          />
        )}

        {/* Creating Loader */}
        {creating && (
          <View className="absolute inset-0 bg-slate-950/80 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-white mt-4">Starting conversation...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
