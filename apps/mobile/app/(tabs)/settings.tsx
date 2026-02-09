import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoJoin, setAutoJoin] = useState(false);

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-900 rounded-2xl p-4 mb-3 flex-row items-center border border-slate-800"
      disabled={!onPress && !rightElement}
    >
      <View className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center">
        <Ionicons name={icon as any} size={20} color="#3b82f6" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-white font-semibold text-base">{title}</Text>
        {subtitle && (
          <Text className="text-slate-400 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      {rightElement ||
        (showChevron && (
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        ))}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 px-6 pt-14 pb-6 border-b border-slate-800">
        <Text className="text-white text-3xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-6">
        {/* Profile Section */}
        <View className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 mb-6 border border-blue-400/20">
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center">
              <Text className="text-blue-600 text-2xl font-bold">JD</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-2xl font-bold">John Doe</Text>
              <Text className="text-blue-100 text-sm mt-1">@johndoe</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-white/20 backdrop-blur rounded-xl py-3 px-4 flex-row items-center justify-center border border-white/30">
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
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

        <TouchableOpacity className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 flex-row items-center justify-center">
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-2 text-base">
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
