import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 pt-16">
      <Text className="text-4xl font-bold text-white mb-8">Profile</Text>

      <View className="bg-gray-800 rounded-2xl p-6 mb-4">
        <Text className="text-gray-400 text-sm mb-2">Email</Text>
        <Text className="text-white text-lg font-semibold">{user?.email}</Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-6 mb-4">
        <Text className="text-gray-400 text-sm mb-2">User ID</Text>
        <Text className="text-white text-sm font-mono">{user?.id}</Text>
      </View>

      <View className="bg-gray-800 rounded-2xl p-6 mb-4">
        <Text className="text-gray-400 text-sm mb-2">Username</Text>
        <Text className="text-white text-lg font-semibold">
          {user?.user_metadata?.username || "Not set"}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-red-600 py-4 rounded-xl mt-6"
        onPress={handleSignOut}
      >
        <Text className="text-white text-center font-semibold text-base">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
