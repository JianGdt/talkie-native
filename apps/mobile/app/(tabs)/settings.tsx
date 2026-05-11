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
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
  }, []);

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
    <View className="flex-1 bg-white">
      <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
        <Text className="text-gray-900 text-3xl font-bold">Settings</Text>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="px-6 py-6"
      >
        <View
          className="rounded-3xl p-6 mb-6 border border-gray-100"
          style={{ backgroundColor: THEME.accentSoft }}
        >
          <View className="flex-row items-center mb-4">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: "white" }}
            >
              <Text className="text-emerald-700 text-xl font-bold">
                {(user?.name ?? user?.username ?? "?").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-xl font-bold">
                {user?.name}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-white rounded-xl py-3 px-4 flex-row items-center justify-center border border-gray-200">
            <Ionicons name="create-outline" size={20} color={THEME.accent} />
            <Text
              className="font-semibold ml-2"
              style={{ color: THEME.accent }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3 ml-1">
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
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3 ml-1">
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
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3 ml-1">
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
          <Text className="text-gray-500 text-xs font-semibold uppercase mb-3 ml-1">
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
