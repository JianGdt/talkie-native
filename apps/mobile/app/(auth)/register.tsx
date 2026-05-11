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

export default function RegisterScreen() {
  const { signUpWithEmail } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);
      await signUpWithEmail(email.trim(), password, fullName.trim());
    } catch (err: any) {
      Alert.alert("Sign-up failed", err?.message || "Something went wrong.");
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
        <View className="mb-12">
          <Text className="text-5xl text-gray-900 mb-2 font-bold">Wave</Text>
          <Text className="text-gray-500 text-base">Create your account</Text>
        </View>

        <View className="gap-y-4">
          <TextInput
            className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-4 text-base border border-gray-100"
            placeholder="Full name"
            placeholderTextColor={THEME.textSubtle}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />

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

          <View className="relative">
            <TextInput
              className="bg-gray-100 text-gray-900 rounded-2xl pl-4 pr-12 py-4 text-base border border-gray-100"
              placeholder="Confirm password"
              placeholderTextColor={THEME.textSubtle}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              className="absolute right-3 top-0 bottom-0 justify-center"
              activeOpacity={0.7}
              onPress={() => setShowConfirmPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color={THEME.textSubtle}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-2"
            style={{ backgroundColor: THEME.accent }}
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500 text-sm">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text
              className="text-sm font-semibold"
              style={{ color: THEME.accent }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
