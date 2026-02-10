import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-900"
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-4xl font-bold text-white mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-400 text-base">Sign in to continue</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-300 mb-2 text-sm font-medium">
              Email
            </Text>
            <TextInput
              className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
              placeholder="your@email.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View>
            <Text className="text-gray-300 mb-2 text-sm font-medium">
              Password
            </Text>
            <TextInput
              className="bg-gray-800 text-white px-4 py-4 rounded-xl text-base"
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className={`bg-blue-600 py-4 rounded-xl mt-6 ${
              loading ? "opacity-50" : ""
            }`}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-400">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="text-blue-500 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
