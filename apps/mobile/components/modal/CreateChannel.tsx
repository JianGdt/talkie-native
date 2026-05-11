import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { channelService } from "@/api/services/channelServices";
import { THEME } from "@/constant/theme";

interface CreateChannelModalProps {
  visible: boolean;
  onClose: () => void;
  onChannelCreated: (channelId: string, channelName: string) => void;
}

export default function CreateChannelModal({
  visible,
  onClose,
  onChannelCreated,
}: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "public" | "private" | "team"
  >("public");
  const [creating, setCreating] = useState(false);

  const categories = [
    {
      id: "public" as const,
      label: "Public",
      icon: "globe",
      description: "Anyone can join",
      color: "emerald",
    },
    {
      id: "private" as const,
      label: "Private",
      icon: "lock-closed",
      description: "Invite only",
      color: "purple",
    },
    {
      id: "team" as const,
      label: "Team",
      icon: "people",
      description: "For team collaboration",
      color: "blue",
    },
  ];

  const handleCreate = async () => {
    if (!channelName.trim()) {
      Alert.alert("Error", "Please enter a channel name");
      return;
    }

    try {
      setCreating(true);
      const newChannel = await channelService.createChannel({
        name: channelName.trim(),
        description: description.trim() || undefined,
        category: selectedCategory,
      });

      setChannelName("");
      setDescription("");
      setSelectedCategory("public");

      onClose();
      onChannelCreated(newChannel.id, newChannel.name);

      Alert.alert("Success", `Channel "${newChannel.name}" created!`);
    } catch (error) {
      console.error("Failed to create channel:", error);
      Alert.alert("Error", "Failed to create channel. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const getCategoryColor = (color: string) => {
    switch (color) {
      case "emerald":
        return {
          bg: "bg-emerald-500",
          bgSelected: "bg-emerald-50",
          border: "border-emerald-500",
          text: "text-emerald-600",
        };
      case "purple":
        return {
          bg: "bg-purple-500",
          bgSelected: "bg-purple-50",
          border: "border-purple-500",
          text: "text-purple-600",
        };
      case "blue":
        return {
          bg: "bg-blue-500",
          bgSelected: "bg-blue-50",
          border: "border-blue-500",
          text: "text-blue-600",
        };
      default:
        return {
          bg: "bg-gray-500",
          bgSelected: "bg-gray-50",
          border: "border-gray-500",
          text: "text-gray-600",
        };
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
        <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
              onPress={onClose}
              disabled={creating}
            >
              <Ionicons name="close" size={24} color={THEME.textMuted} />
            </TouchableOpacity>

            <Text className="text-gray-900 text-2xl font-bold tracking-tight">
              Create Channel
            </Text>

            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1 bg-gray-50"
          contentContainerClassName="px-6 py-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-gray-600 text-sm font-semibold mb-3">
              CHANNEL NAME *
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <TextInput
                className="text-gray-900 text-base"
                placeholder="e.g., General Discussion"
                placeholderTextColor={THEME.textSubtle}
                value={channelName}
                onChangeText={setChannelName}
                maxLength={50}
                autoFocus
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              {channelName.length}/50 characters
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-gray-600 text-sm font-semibold mb-3">
              DESCRIPTION (OPTIONAL)
            </Text>
            <View className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <TextInput
                className="text-gray-900 text-base"
                placeholder="What's this channel about?"
                placeholderTextColor={THEME.textSubtle}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              {description.length}/200 characters
            </Text>
          </View>

          <View className="mb-8">
            <Text className="text-gray-600 text-sm font-semibold mb-3">
              CHANNEL TYPE
            </Text>

            {categories.map((category) => {
              const colors = getCategoryColor(category.color);
              const isSelected = selectedCategory === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  className={`mb-3 p-4 rounded-2xl border bg-white ${
                    isSelected
                      ? `${colors.bgSelected} ${colors.border}`
                      : "border-gray-200"
                  }`}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View className="flex-row items-center gap-4">
                    <View
                      className={`w-12 h-12 ${colors.bg} rounded-xl items-center justify-center`}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={24}
                        color="white"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-900 text-base font-bold mb-1">
                        {category.label}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {category.description}
                      </Text>
                    </View>

                    {isSelected && (
                      <View
                        className={`w-6 h-6 ${colors.bg} rounded-full items-center justify-center`}
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <Text className="text-gray-600 text-sm font-semibold mb-3">
              PREVIEW
            </Text>

            <View className="flex-row items-center gap-4">
              <View
                className={`w-14 h-14 ${
                  getCategoryColor(
                    categories.find((c) => c.id === selectedCategory)?.color ||
                      "slate",
                  ).bg
                } rounded-2xl items-center justify-center`}
              >
                <Ionicons
                  name={
                    (categories.find((c) => c.id === selectedCategory)
                      ?.icon as any) || "chatbubbles"
                  }
                  size={26}
                  color="white"
                />
              </View>

              <View className="flex-1">
                <Text className="text-gray-900 text-lg font-bold mb-1">
                  {channelName || "Channel Name"}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {description || "No description"}
                </Text>
              </View>
            </View>
          </View>

          <View
            className="rounded-2xl border p-4 mb-6"
            style={{
              backgroundColor: THEME.accentSoft,
              borderColor: THEME.accent,
            }}
          >
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color={THEME.accent} />
              <View className="flex-1">
                <Text className="text-gray-700 text-sm leading-relaxed">
                  {selectedCategory === "public" &&
                    "Anyone can find and join this channel. Great for general discussions."}
                  {selectedCategory === "private" &&
                    "Only invited members can join. Perfect for confidential conversations."}
                  {selectedCategory === "team" &&
                    "Designed for team collaboration. Members can be added by team admins."}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-6 pb-8 pt-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            className={`py-4 rounded-2xl ${
              channelName.trim() && !creating ? "" : "bg-gray-200"
            }`}
            style={
              channelName.trim() && !creating
                ? { backgroundColor: THEME.accent }
                : undefined
            }
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={!channelName.trim() || creating}
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-base font-bold">
                Create Channel
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
