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
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";
import { authService } from "@/api/services/authServices";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const accessToken = hash.get("access_token") ?? query.get("access_token");
    const refreshToken = hash.get("refresh_token") ?? query.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await authService.resetPassword(password);
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => router.replace("/(auth)/login"), 1200);
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error instanceof Error ? error.message : "Could not update password.",
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
        {success && (
          <View
            className="absolute top-14 left-6 right-6 rounded-2xl px-4 py-3"
            style={{ backgroundColor: THEME.accent }}
          >
            <Text className="text-white text-center font-semibold">
              Password updated successfully
            </Text>
          </View>
        )}

        <View className="mb-10">
          <Text className="text-4xl text-gray-900 mb-2 font-bold">
            Set New Password
          </Text>
          <Text className="text-gray-500 text-base">
            Choose a new password for your account
          </Text>
        </View>

        <View className="gap-y-4">
          <View className="relative">
            <TextInput
              className="bg-gray-100 text-gray-900 rounded-2xl pl-4 pr-12 py-4 text-base border border-gray-100"
              placeholder="New password"
              placeholderTextColor={THEME.textSubtle}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              className="absolute right-3 top-0 bottom-0 justify-center"
              activeOpacity={0.7}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={THEME.textSubtle}
              />
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-4 text-base border border-gray-100"
            placeholder="Confirm new password"
            placeholderTextColor={THEME.textSubtle}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-2"
            style={{ backgroundColor: THEME.accent }}
            onPress={handleReset}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
