import { View, Text, ActivityIndicator } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";

export default function LoginScreen() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 justify-center px-6">
      <View className="mb-16">
        <Text
          style={{ fontFamily: "Poppins_600SemiBold" }}
          className="text-6xl text-white mb-2"
        >
          Wave
        </Text>
        <Text className="text-gray-400 text-base">Sign in to continue</Text>
      </View>

      <GoogleSignInButton />
    </View>
  );
}
