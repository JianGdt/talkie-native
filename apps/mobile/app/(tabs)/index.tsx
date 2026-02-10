import { useAuth } from "@/hooks/use-auth";
import { View, Text, ScrollView } from "react-native";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-4xl font-bold text-white mb-2">
          Welcome Back! 👋
        </Text>
        <Text className="text-gray-400 text-base">{user?.email}</Text>
      </View>

      <View className="px-6 space-y-4">
        <View className="bg-gray-800 p-6 rounded-2xl">
          <Text className="text-white text-xl font-semibold mb-2">
            Getting Started
          </Text>
          <Text className="text-gray-400">
            This is your home screen. You can start building your walkie-talkie
            features here!
          </Text>
        </View>

        <View className="bg-blue-600 p-6 rounded-2xl">
          <Text className="text-white text-xl font-semibold mb-2">
            ✨ Features
          </Text>
          <Text className="text-blue-100">
            • Expo Router navigation{"\n"}• NativeWind (TailwindCSS){"\n"}•
            Supabase authentication{"\n"}• TypeScript support
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
