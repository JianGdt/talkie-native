import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constant/theme";
import { WebSelfieCamera } from "@/components/shared/WebSelfieCamera";
import { NftAvatarView } from "@/components/shared/ProfileAvatar";
import {
  getNftAvatarValue,
  NFT_AVATARS,
  NftAvatarOption,
} from "@/constants/nftAvatars";

export default function RegisterScreen() {
  const { signUpWithEmail } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | undefined>();
  const [selectedAvatar, setSelectedAvatar] = useState<NftAvatarOption | null>(
    null,
  );

  const selectAvatar = (avatar: NftAvatarOption) => {
    setSelectedAvatar(avatar);
    setSelfieBlob(undefined);
    setSelfiePreview(null);
  };

  const handleSelfieCapture = (blob: Blob, dataUrl: string) => {
    setSelectedAvatar(null);
    setSelfieBlob(blob);
    setSelfiePreview(dataUrl);
    setCameraStream(null);
    setCameraError(null);
    setCameraOpen(false);
  };

  const openSelfieCamera = async () => {
    if (Platform.OS !== "web") return;

    setCameraOpen(true);
    setCameraError(null);
    setCameraStream(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setCameraStream(stream);
    } catch (error) {
      console.error("Camera failed:", error);
      setCameraError("Camera access is blocked. Allow camera access, then try again.");
    }
  };

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
      await signUpWithEmail(
        email.trim(),
        password,
        fullName.trim(),
        selfieBlob,
        selectedAvatar ? getNftAvatarValue(selectedAvatar.id) : undefined,
      );
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-10 justify-center"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-12">
          <Text className="text-5xl text-gray-900 mb-2 font-bold">Wave</Text>
          <Text className="text-gray-500 text-base">Create your account</Text>
        </View>

        <View className="gap-y-4">
          <View className="items-center gap-y-3">
            {selfiePreview ? (
              <Image
                source={{ uri: selfiePreview }}
                className="w-24 h-24 rounded-full bg-gray-100"
              />
            ) : selectedAvatar ? (
              <View className="w-24 h-24 rounded-full overflow-hidden">
                <NftAvatarView avatar={selectedAvatar} size={96} />
              </View>
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
                <Ionicons name="camera-outline" size={30} color={THEME.textSubtle} />
              </View>
            )}
            {Platform.OS === "web" && (
              <TouchableOpacity
                className="bg-gray-100 rounded-xl px-4 py-2 border border-gray-200"
                onPress={openSelfieCamera}
              >
                <Text className="text-gray-800 font-semibold">
                  {selfiePreview ? "Retake Selfie" : "Take Selfie"}
                </Text>
              </TouchableOpacity>
            )}
            <View className="w-full">
              <Text className="text-gray-500 text-xs font-semibold uppercase mb-3 text-center">
                NFT avatar
              </Text>
              <View className="flex-row flex-wrap justify-center gap-3">
                {NFT_AVATARS.map((avatar) => {
                  const isSelected = selectedAvatar?.id === avatar.id;
                  return (
                    <TouchableOpacity
                      key={avatar.id}
                      className="rounded-full border-2"
                      style={{
                        borderColor: isSelected ? THEME.accent : "transparent",
                        padding: 2,
                      }}
                      onPress={() => selectAvatar(avatar)}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${avatar.name} avatar`}
                    >
                      <View className="w-12 h-12 rounded-full overflow-hidden">
                        <NftAvatarView avatar={avatar} size={48} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {Platform.OS === "web" && cameraOpen && (
            <WebSelfieCamera
              initialError={cameraError}
              initialStream={cameraStream}
              onCancel={() => {
                setCameraOpen(false);
                setCameraStream(null);
                setCameraError(null);
              }}
              onCapture={handleSelfieCapture}
            />
          )}

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
