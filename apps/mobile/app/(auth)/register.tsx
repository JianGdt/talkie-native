import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/services/supabase";
import { RegisterFormData, registerSchema } from "@/schema/authSchema";
import { ControlledInput } from "@/components/ui/ControlledInput";

export default function RegisterScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
        },
      });

      if (error) throw error;

      Alert.alert(
        "Success",
        "Account created! Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-900"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-4xl font-bold text-white mb-2">
              Create Account
            </Text>
            <Text className="text-gray-400 text-base">
              Sign up to get started
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <ControlledInput
              control={control}
              name="username"
              label="Username"
              placeholder="johndoe"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              error={errors.username?.message}
              editable={!isSubmitting}
            />

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
              placeholder="Min. 6 characters"
              placeholderTextColor="#6b7280"
              secureTextEntry
              error={errors.password?.message}
              editable={!isSubmitting}
            />

            <ControlledInput
              control={control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter password"
              placeholderTextColor="#6b7280"
              secureTextEntry
              error={errors.confirmPassword?.message}
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-400">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
