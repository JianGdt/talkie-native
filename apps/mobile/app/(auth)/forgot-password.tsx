import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { THEME } from "@/constant/theme";
import { authService } from "@/api/services/authServices";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }

    try {
      setSubmitting(true);
      const redirectTo =
        Platform.OS === "web" ? `${window.location.origin}/reset-password` : undefined;
      await authService.forgotPassword(email.trim(), redirectTo);
      Alert.alert(
        "Check your email",
        "We sent a password reset link to your email address.",
      );
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error instanceof Error ? error.message : "Could not send reset email.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-10">
          <Text className="text-4xl text-gray-900 mb-2 font-bold">
            Forgot Password
          </Text>
          <Text className="text-gray-500 text-base">
            Enter your email to receive a reset link
          </Text>
        </View>

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

        <TouchableOpacity
          className="rounded-2xl py-4 items-center mt-5"
          style={{ backgroundColor: THEME.accent }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center mt-6"
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text className="text-gray-600 font-semibold">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
