import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/services/supabase";
import { LoginFormData, loginSchema } from "@/schema/authSchema";
import { ControlledInput } from "@/components/ui/ControlledInput";

export default function LoginScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setIsSubmitting(false);
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
          <ControlledInput
            control={control}
            name="email"
            label="Email"
            placeholder="your@email.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email?.message}
            editable={!isSubmitting}
          />

          <ControlledInput
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            error={errors.password?.message}
            editable={!isSubmitting}
          />

          <TouchableOpacity
            className={`bg-blue-600 py-4 rounded-xl mt-6 ${
              isSubmitting ? "opacity-50" : ""
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
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
