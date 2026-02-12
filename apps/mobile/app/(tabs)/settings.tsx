import { SettingItem } from "@/components/SettingItems";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoJoin, setAutoJoin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  console.log("USER", user);
  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 px-6 pt-14 pb-6 border-b border-slate-800">
        <Text className="text-white text-3xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6">
        <View className=" from-blue-500 to-purple-600 rounded-3xl p-6 mb-6 border border-blue-400/20">
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center">
              <Text className="text-blue-600 text-2xl font-bold">
                {user?.user_metadata?.username}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-2xl font-bold">
                {user?.user_metadata?.username}
              </Text>
              <Text className="text-blue-100 text-sm mt-1">{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-white/20 backdrop-blur rounded-xl py-3 px-4 flex-row items-center justify-center border border-white/30">
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-semibold uppercase mb-3 ml-1">
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

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-semibold uppercase mb-3 ml-1">
            Notifications
          </Text>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Get notified of new messages"
            rightElement={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="white"
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="volume-high-outline"
            title="Sound Effects"
            subtitle="Play sounds for actions"
            rightElement={
              <Switch
                value={soundEffects}
                onValueChange={setSoundEffects}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="white"
              />
            }
            showChevron={false}
          />
          <SettingItem
            icon="phone-portrait-outline"
            title="Haptic Feedback"
            subtitle="Feel vibrations for interactions"
            rightElement={
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="white"
              />
            }
            showChevron={false}
          />
        </View>

        {/* App Settings */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-semibold uppercase mb-3 ml-1">
            App Settings
          </Text>
          <SettingItem
            icon="chatbubbles-outline"
            title="Auto-join Last Channel"
            subtitle="Automatically rejoin on launch"
            rightElement={
              <Switch
                value={autoJoin}
                onValueChange={setAutoJoin}
                trackColor={{ false: "#334155", true: "#3b82f6" }}
                thumbColor="white"
              />
            }
            showChevron={false}
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
            subtitle="Dark mode"
            onPress={() => {}}
          />
          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-semibold uppercase mb-3 ml-1">
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
          className={`py-4 rounded-xl border-2 ${
            isSigningOut
              ? "bg-red-600 border-red-600 opacity-50"
              : "bg-transparent border-red-600 active:bg-red-600/10"
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
