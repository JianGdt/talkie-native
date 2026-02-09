import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = () => {
    // Handle login/signup logic here
    console.log("Submit:", { email, password, username, isLogin });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl items-center justify-center mb-6 shadow-lg">
            <Ionicons name="radio" size={48} color="white" />
          </View>
          <Text className="text-white text-4xl font-bold mb-2">WalkieTalk</Text>
          <Text className="text-slate-400 text-base text-center">
            {isLogin
              ? "Welcome back! Sign in to continue"
              : "Create your account to get started"}
          </Text>
        </View>

        {/* Form Section */}
        <View className="mb-6">
          {!isLogin && (
            <View className="mb-4">
              <Text className="text-slate-300 font-semibold mb-2 ml-1">
                Username
              </Text>
              <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-4 border border-slate-800">
                <Ionicons name="person-outline" size={20} color="#64748b" />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder="johndoe"
                  placeholderTextColor="#64748b"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-slate-300 font-semibold mb-2 ml-1">
              Email
            </Text>
            <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-4 border border-slate-800">
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="your@email.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-slate-300 font-semibold mb-2 ml-1">
              Password
            </Text>
            <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-4 border border-slate-800">
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-white text-base"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View className="mb-4">
              <Text className="text-slate-300 font-semibold mb-2 ml-1">
                Confirm Password
              </Text>
              <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-4 border border-slate-800">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748b"
                />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isLogin && (
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-blue-500 font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-blue-500 rounded-xl py-4 items-center mb-4 shadow-lg active:opacity-80"
        >
          <Text className="text-white font-bold text-lg">
            {isLogin ? "Sign In" : "Create Account"}
          </Text>
        </TouchableOpacity>

        {/* OAuth Buttons */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-px bg-slate-800" />
            <Text className="text-slate-500 px-4 text-sm">
              or continue with
            </Text>
            <View className="flex-1 h-px bg-slate-800" />
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 flex-row items-center justify-center">
              <Ionicons name="logo-google" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Google</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 flex-row items-center justify-center">
              <Ionicons name="logo-apple" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle Login/Signup */}
        <View className="flex-row items-center justify-center">
          <Text className="text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text className="text-blue-500 font-semibold">
              {isLogin ? "Sign Up" : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms and Privacy */}
        {!isLogin && (
          <Text className="text-slate-500 text-xs text-center mt-6 leading-5">
            By creating an account, you agree to our{" "}
            <Text className="text-blue-500">Terms of Service</Text> and{" "}
            <Text className="text-blue-500">Privacy Policy</Text>
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
