import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function TalkScreen() {
  const [isPressing, setIsPressing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [currentChannel, setCurrentChannel] = useState("Team Alpha");
  const [activeUsers, setActiveUsers] = useState(12);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Pulse animation for outer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const handlePressOut = () => {
    setIsPressing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 px-6 pt-14 pb-6 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <View
              className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}
            />
            <Text className="text-slate-400 text-sm font-medium">
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
          <TouchableOpacity
            className="p-2"
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text className="text-white text-3xl font-bold mb-2">
          {currentChannel}
        </Text>
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="people" size={16} color="#64748b" />
            <Text className="text-slate-400 text-sm">{activeUsers} active</Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => router.push("/channels")}
          >
            <Ionicons name="swap-horizontal" size={16} color="#3b82f6" />
            <Text className="text-blue-500 text-sm font-medium">
              Change Channel
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Feed */}
      <View className="flex-1 px-6 py-4">
        <Text className="text-slate-500 text-xs font-semibold uppercase mb-4">
          Recent Activity
        </Text>

        {/* Activity Items */}
        <View className="gap-3">
          <View className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                  <Text className="text-blue-400 font-semibold">JD</Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">John Doe</Text>
                  <Text className="text-slate-500 text-xs">2 min ago</Text>
                </View>
              </View>
              <View className="bg-blue-500/10 px-3 py-1 rounded-full">
                <Text className="text-blue-400 text-xs font-medium">00:12</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden">
                <View
                  className="h-full bg-blue-500/30 rounded-lg"
                  style={{ width: "65%" }}
                />
              </View>
            </View>
          </View>

          <View className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                  <Text className="text-purple-400 font-semibold">SK</Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">Sarah Kim</Text>
                  <Text className="text-slate-500 text-xs">5 min ago</Text>
                </View>
              </View>
              <View className="bg-purple-500/10 px-3 py-1 rounded-full">
                <Text className="text-purple-400 text-xs font-medium">
                  00:08
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden">
                <View
                  className="h-full bg-purple-500/30 rounded-lg"
                  style={{ width: "45%" }}
                />
              </View>
            </View>
          </View>

          <View className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center">
                  <Text className="text-emerald-400 font-semibold">MJ</Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">Mike Johnson</Text>
                  <Text className="text-slate-500 text-xs">8 min ago</Text>
                </View>
              </View>
              <View className="bg-emerald-500/10 px-3 py-1 rounded-full">
                <Text className="text-emerald-400 text-xs font-medium">
                  00:15
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="flex-1 h-8 bg-slate-800 rounded-lg overflow-hidden">
                <View
                  className="h-full bg-emerald-500/30 rounded-lg"
                  style={{ width: "80%" }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Push to Talk Button */}
      <View className="px-6 pb-12 items-center">
        {isPressing && (
          <View className="absolute top-8 bg-blue-500/10 px-6 py-3 rounded-full border border-blue-500/30">
            <Text className="text-blue-400 font-semibold text-sm">
              🔴 Recording...
            </Text>
          </View>
        )}

        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            opacity: isPressing ? 0.3 : 0,
          }}
          className="absolute w-64 h-64 bg-blue-500 rounded-full"
        />

        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="active:opacity-90"
        >
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className={`w-52 h-52 rounded-full items-center justify-center shadow-2xl ${
              isPressing ? "bg-blue-600" : "bg-blue-500"
            }`}
          >
            <View className="w-44 h-44 rounded-full bg-slate-950/30 items-center justify-center">
              <Ionicons
                name={isPressing ? "mic" : "mic-outline"}
                size={80}
                color="white"
              />
            </View>
          </Animated.View>
        </Pressable>

        <Text className="text-slate-400 text-sm mt-6 font-medium">
          {isPressing ? "Release to send" : "Hold to talk"}
        </Text>
      </View>
    </View>
  );
}
