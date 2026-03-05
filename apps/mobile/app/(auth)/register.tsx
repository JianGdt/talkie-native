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

export default function RegisterScreen() {
  const { signUpWithEmail } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      className="flex-1 bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <View className="mb-12">
          <Text
            style={{ fontFamily: "Poppins_600SemiBold" }}
            className="text-6xl text-white mb-2"
          >
            Wave
          </Text>
          <Text className="text-gray-400 text-base">Create your account</Text>
        </View>

        <View className="gap-y-4">
          <TextInput
            className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Full name"
            placeholderTextColor="#9ca3af"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            className="bg-gray-800 text-white rounded-xl px-4 py-4 text-base"
            placeholder="Confirm password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            className="bg-white rounded-xl py-4 items-center mt-2"
            onPress={handleRegister}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text
                style={{ fontFamily: "Poppins_600SemiBold" }}
                className="text-gray-900 text-base"
              >
                Create Account
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-400 text-sm">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-white text-sm font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
