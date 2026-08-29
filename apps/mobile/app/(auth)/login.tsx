import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";

export default function LoginScreen() {
  const { signInWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    try {
      setSubmitting(true);
      await signInWithEmail(email.trim(), password);
    } catch (err: any) {
      Alert.alert("Sign-in failed", err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator color={THEME.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-12">
          <Text className="text-5xl text-gray-900 mb-2 font-bold">Wave</Text>
          <Text className="text-gray-500 text-base">Sign in to continue</Text>
        </View>

        <View className="gap-y-4">
          <TextInput
            className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-4 text-base border border-gray-100"
            placeholder="Email"
            placeholderTextColor={THEME.textSubtle}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <View className="relative">
            <TextInput
              className="bg-gray-100 text-gray-900 rounded-2xl pl-4 pr-12 py-4 text-base border border-gray-100"
              placeholder="Password"
              placeholderTextColor={THEME.textSubtle}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="absolute right-3 top-0 bottom-0 justify-center"
              activeOpacity={0.7}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={THEME.textSubtle}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="items-end"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: THEME.accent }}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-2"
            style={{ backgroundColor: THEME.accent }}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500 text-sm">Dont have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text
              className="text-sm font-semibold"
              style={{ color: THEME.accent }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
