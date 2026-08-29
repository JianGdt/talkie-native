import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/api/endpoints";
import { conversationService } from "@/api/services/conversationServices";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { THEME } from "@/constant/theme";
import { useAuth } from "@/hooks/useAuth";

interface CreateChannelModalProps {
  visible: boolean;
  onClose: () => void;
  onChannelCreated: (channelId: string, channelName: string) => void;
}

interface SearchableUser {
  id: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

const GROUP_TAGS = ["Group work", "Team relationship"];

export default function CreateChannelModal({
  visible,
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<SearchableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const canCreate = selectedUserIds.length > 0;

  useEffect(() => {
    if (!visible) return;

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const result = await apiClient.get<SearchableUser[]>(
          API_ENDPOINTS.USERS,
        );
        setUsers(result.filter((item) => item.id !== user?.id));
      } catch (error) {
        console.error("Failed to load users:", error);
        Alert.alert("Error", "Could not load users to invite.");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [user?.id, visible]);

  const invitedMembers = useMemo(
    () => users.filter((item) => selectedUserIds.includes(item.id)),
    [selectedUserIds, users],
  );

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedUserIds([]);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleCreate = async () => {
    if (selectedUserIds.length === 0) {
      Alert.alert("Invite members", "Please invite at least one member.");
      return;
    }

    try {
      setCreating(true);
      const name = groupName.trim() || description.trim() || "Team Work";
      const result = await conversationService.createGroup(
        name,
        selectedUserIds,
      );
      resetForm();
      onClose();
      onChannelCreated(result.conversationId, result.name);
      Alert.alert("Group created", `"${result.name}" is ready.`);
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="px-5 pt-12 pb-4 bg-white">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center"
              onPress={onClose}
              disabled={creating}
            >
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <Text className="text-gray-950 text-sm font-semibold">
              Create Group
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="px-5 pb-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-gray-500 text-xs mb-2">Group Description</Text>
          <TextInput
            className="text-gray-950 text-3xl font-bold leading-9 px-0 py-0 mb-4"
            placeholder={"Make Group\nfor Team Work"}
            placeholderTextColor="#111827"
            value={groupName}
            onChangeText={setGroupName}
            multiline
            maxLength={60}
            autoFocus
            style={{ outline: "none" } as any}
          />

          <View className="flex-row gap-3 mb-6">
            {GROUP_TAGS.map((tag) => (
              <View key={tag} className="px-4 py-2 rounded-full bg-teal-50">
                <Text className="text-teal-900 text-[11px] font-medium">
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <TextInput
            className="bg-gray-50 rounded-2xl border border-gray-100 px-4 py-3 text-gray-900 text-sm mb-6"
            placeholder="Optional group description"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={160}
            style={{ outline: "none" } as any}
          />

          <Text className="text-gray-500 text-xs mb-3">Group Admin</Text>
          <View className="flex-row items-center mb-7">
            <ProfileAvatar
              value={user?.profileImage}
              fallbackLabel={user?.name ?? user?.username ?? "?"}
              size={44}
            />
            <View className="ml-3">
              <Text className="text-gray-950 text-sm font-bold">
                {user?.name ?? user?.username}
              </Text>
              <Text className="text-gray-500 text-[11px]">Group Admin</Text>
            </View>
          </View>

          <Text className="text-gray-500 text-xs mb-4">Invited Members</Text>
          {loadingUsers ? (
            <View className="py-8 items-center">
              <ActivityIndicator color={THEME.accent} />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {users.map((item) => {
                const selected = selectedUserIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    className="relative"
                    activeOpacity={0.75}
                    onPress={() => toggleUser(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Invite ${item.username}`}
                  >
                    <ProfileAvatar
                      value={item.avatar}
                      fallbackLabel={item.fullName ?? item.username}
                      size={48}
                    />
                    <View
                      className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full items-center justify-center border border-white"
                      style={{
                        backgroundColor: selected ? THEME.accent : "#ffffff",
                      }}
                    >
                      <Ionicons
                        name={selected ? "checkmark" : "add"}
                        size={13}
                        color={selected ? "white" : "#111827"}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View className="w-12 h-12 rounded-full border border-dashed border-gray-300 items-center justify-center">
                <Ionicons name="add" size={18} color="#d1d5db" />
              </View>
            </View>
          )}

          {invitedMembers.length > 0 ? (
            <Text className="text-gray-400 text-xs mt-5">
              {invitedMembers.length} member
              {invitedMembers.length === 1 ? "" : "s"} selected
            </Text>
          ) : null}
        </ScrollView>

        <View className="px-5 pb-7 pt-4 bg-white">
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{
              backgroundColor:
                canCreate && !creating
                  ? "#0db39e"
                  : "#d1d5db",
            }}
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={!canCreate || creating}
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-sm font-bold">Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
