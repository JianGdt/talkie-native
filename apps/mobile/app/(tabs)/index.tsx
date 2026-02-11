import { useAuth } from "@/hooks/useAuth";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const { user } = useAuth();

  const features = [
    {
      icon: "navigate-outline",
      title: "Message",
      description: "Message other people by joining a channel",
      color: "bg-blue-600",
      path: "/message",
    },
    {
      icon: "color-palette-outline",
      title: "Walkie talkie",
      description: "Radio or send an audio",
      color: "bg-purple-600",
      path: "audio",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-4xl font-bold text-white mb-2">
          Welcome Back! 👋
        </Text>
        <Text className="text-gray-400 text-base">{user?.email}</Text>
      </View>

      <View className="px-6 pb-6 space-y-4">
        {/* Features Grid */}
        <View className="space-y-3">
          <Text className="text-white text-xl font-bold mb-2">✨ Features</Text>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              className="bg-gray-800 rounded-2xl p-5 flex-row items-center border border-gray-700 active:bg-gray-700"
            >
              <View
                className={`w-12 h-12 ${feature.color} rounded-xl items-center justify-center mr-4`}
              >
                <Ionicons name={feature.icon as any} size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold mb-1">
                  {feature.title}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {feature.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
