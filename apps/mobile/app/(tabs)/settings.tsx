import { SettingItem } from "@/components/shared/SettingItems";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/useSettingStore";
import { THEME } from "@/constant/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebSelfieCamera } from "@/components/shared/WebSelfieCamera";
import { NftAvatarView, ProfileAvatar } from "@/components/shared/ProfileAvatar";
import {
  getNftAvatarByValue,
  getNftAvatarValue,
  NFT_AVATARS,
} from "@/constants/nftAvatars";

export default function SettingsScreen() {
  const { signOut, user, updateProfileImage, updateProfileAvatarUrl } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const selectedNftAvatar = getNftAvatarByValue(user?.profileImage);
  const avatarLabel = user?.name ?? user?.username ?? "?";

  const {
    pushNotifications,
    soundEffects,
    hapticFeedback,
    autoJoin,
    setPushNotifications,
    setSoundEffects,
    setHapticFeedback,
    setAutoJoin,
    hydrate,
  } = useSettingsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const captureProfileSelfie = async (blob: Blob) => {
    if (savingAvatar) return;
    try {
      setSavingAvatar(true);
      await updateProfileImage(blob);
      setCameraStream(null);
      setCameraError(null);
      setCameraOpen(false);
      Alert.alert("Profile updated", "Your selfie was saved.");
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error instanceof Error ? error.message : "Could not save selfie.",
      );
    } finally {
      setSavingAvatar(false);
    }
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

  const saveNftAvatar = async (avatarUrl: string) => {
    if (savingAvatar) return;
    try {
      setSavingAvatar(true);
      await updateProfileAvatarUrl(avatarUrl);
      Alert.alert("Profile updated", "Your avatar was saved.");
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : "Could not save avatar.",
      );
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const switchProps = (value: boolean, onChange: (v: boolean) => void) => ({
    rightElement: (
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#e5e7eb", true: THEME.accent }}
        thumbColor="white"
      />
    ),
    showChevron: false,
  });

  return (
    <View className="flex-1" style={{ backgroundColor: THEME.bg }}>
      <View className="px-5 pt-12 pb-5">
        <Text className="text-[13px] font-semibold" style={{ color: THEME.text }}>
          Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
      >
        <View
          className="items-center p-5 mb-5"
          style={{ backgroundColor: THEME.bg }}
        >
          <ProfileAvatar
            value={user?.profileImage}
            fallbackLabel={avatarLabel}
            size={96}
          />
          <Text className="mt-4 text-base font-semibold" style={{ color: THEME.text }}>
            {user?.name}
          </Text>
          <Text className="mt-1 text-[11px]" style={{ color: THEME.textMuted }}>
            {user?.email}
          </Text>
          <TouchableOpacity
            className="rounded-lg py-3 px-4 flex-row items-center justify-center border mt-5 w-full"
            style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
            onPress={openSelfieCamera}
            disabled={savingAvatar}
          >
            <Ionicons name="camera-outline" size={20} color={THEME.accent} />
            <Text
              className="font-semibold ml-2"
              style={{ color: THEME.accent }}
            >
              {user?.profileImage ? "Retake Selfie" : "Take Selfie"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase mb-3" style={{ color: THEME.textMuted }}>
            NFT avatar
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {NFT_AVATARS.map((avatar) => {
              const isSelected = selectedNftAvatar?.id === avatar.id;
              return (
                <TouchableOpacity
                  key={avatar.id}
                  className="w-[31%] aspect-square rounded-xl border-2 overflow-hidden"
                  style={{
                    borderColor: isSelected ? THEME.accent : THEME.border,
                    opacity: savingAvatar ? 0.6 : 1,
                    backgroundColor: THEME.surface,
                  }}
                  onPress={() => saveNftAvatar(getNftAvatarValue(avatar.id))}
                  disabled={savingAvatar}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${avatar.name} avatar`}
                >
                  <NftAvatarView avatar={avatar} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {Platform.OS === "web" && cameraOpen && (
          <WebSelfieCamera
            disabled={savingAvatar}
            captureLabel="Save Selfie"
            initialError={cameraError}
            initialStream={cameraStream}
            onCancel={() => {
              setCameraOpen(false);
              setCameraStream(null);
              setCameraError(null);
            }}
            onCapture={captureProfileSelfie}
          />
        )}

        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase mb-3 ml-1" style={{ color: THEME.textMuted }}>
            Account
          </Text>
          <SettingItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Update your details"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => {}}
          />
          <SettingItem
            icon="key-outline"
            title="Change Password"
            onPress={() => {}}
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase mb-3 ml-1" style={{ color: THEME.textMuted }}>
            Notifications
          </Text>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Get notified of new messages"
            {...switchProps(pushNotifications, setPushNotifications)}
          />
          <SettingItem
            icon="volume-high-outline"
            title="Sound Effects"
            subtitle="Play sounds for actions"
            {...switchProps(soundEffects, setSoundEffects)}
          />
          <SettingItem
            icon="phone-portrait-outline"
            title="Haptic Feedback"
            subtitle="Feel vibrations for interactions"
            {...switchProps(hapticFeedback, setHapticFeedback)}
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase mb-3 ml-1" style={{ color: THEME.textMuted }}>
            App Settings
          </Text>
          <SettingItem
            icon="chatbubbles-outline"
            title="Auto-join Last Channel"
            subtitle="Automatically rejoin on launch"
            {...switchProps(autoJoin, setAutoJoin)}
          />
          <SettingItem
            icon="mic-outline"
            title="Audio Quality"
            subtitle="High quality"
            onPress={() => {}}
          />
          <SettingItem
            icon="color-palette-outline"
            title="Theme"
            subtitle="Light"
            onPress={() => {}}
          />
          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </View>

        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase mb-3 ml-1" style={{ color: THEME.textMuted }}>
            Support
          </Text>
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => {}}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
        </View>

        <TouchableOpacity
          className={`py-4 rounded-xl border-2 border-red-500 ${
            isSigningOut ? "opacity-50" : "active:bg-red-50"
          }`}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-red-500 text-center font-semibold text-base">
              Sign Out
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
