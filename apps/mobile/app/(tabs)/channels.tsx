import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Channel {
  id: string;
  name: string;
  description: string;
  members: number;
  isActive: boolean;
  category: "public" | "private" | "team";
  color: string;
}

export default function ChannelsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "public" | "private" | "team"
  >("all");

  const channels: Channel[] = [
    {
      id: "1",
      name: "Team Alpha",
      description: "Main team communication channel",
      members: 12,
      isActive: true,
      category: "team",
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "General Discussion",
      description: "Open channel for everyone",
      members: 45,
      isActive: false,
      category: "public",
      color: "bg-emerald-500",
    },
    {
      id: "3",
      name: "Project Phoenix",
      description: "Private project channel",
      members: 8,
      isActive: false,
      category: "private",
      color: "bg-purple-500",
    },
    {
      id: "4",
      name: "Emergency Alert",
      description: "Critical communications only",
      members: 23,
      isActive: false,
      category: "team",
      color: "bg-red-500",
    },
    {
      id: "5",
      name: "Customer Support",
      description: "Support team coordination",
      members: 15,
      isActive: false,
      category: "team",
      color: "bg-orange-500",
    },
    {
      id: "6",
      name: "Social Club",
      description: "Casual conversations and fun",
      members: 67,
      isActive: false,
      category: "public",
      color: "bg-pink-500",
    },
  ];

  const categories = [
    { id: "all", label: "All", icon: "apps" },
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

  const renderChannel = ({ item }: { item: Channel }) => (
    <TouchableOpacity
      className={`bg-slate-900 rounded-2xl p-4 mb-3 border ${
        item.isActive ? "border-blue-500" : "border-slate-800"
      }`}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className={`w-12 h-12 ${item.color} rounded-xl items-center justify-center`}
          >
            <Ionicons
              name={
                item.category === "private"
                  ? "lock-closed"
                  : item.category === "team"
                    ? "people"
                    : "globe"
              }
              size={24}
              color="white"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-white text-lg font-bold">{item.name}</Text>
              {item.isActive && (
                <View className="bg-blue-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    Active
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-slate-400 text-sm">{item.description}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="people" size={16} color="#64748b" />
            <Text className="text-slate-400 text-sm">{item.members}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View
              className={`w-2 h-2 rounded-full ${item.members > 20 ? "bg-emerald-500" : "bg-slate-600"}`}
            />
            <Text className="text-slate-400 text-sm">
              {item.members > 20 ? "Active" : "Quiet"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${
            item.isActive ? "bg-slate-800" : "bg-blue-500"
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              item.isActive ? "text-slate-400" : "text-white"
            }`}
          >
            {item.isActive ? "Leave" : "Join"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 px-6 pt-14 pb-6 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-bold">Channels</Text>
          <TouchableOpacity className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-slate-800 rounded-xl flex-row items-center px-4 py-3 border border-slate-700">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Search channels..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-4 border-b border-slate-800"
      >
        <View className="flex-row gap-3">
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                selectedCategory === category.id
                  ? "bg-blue-500"
                  : "bg-slate-900 border border-slate-800"
              }`}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? "white" : "#64748b"}
              />
              <Text
                className={`font-semibold ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-slate-400"
                }`}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Channels List */}
      <FlatList
        data={filteredChannels}
        renderItem={renderChannel}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-4"
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="search" size={64} color="#334155" />
            <Text className="text-slate-500 text-lg font-semibold mt-4">
              No channels found
            </Text>
            <Text className="text-slate-600 text-sm mt-2 text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
    </View>
  );
}
