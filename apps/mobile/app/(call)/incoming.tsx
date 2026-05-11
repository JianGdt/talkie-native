import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWebSocketStore } from "@/store/useWebSocketStore";
import { AvatarBadge } from "@/components/shared/AvatarBadge";
import { THEME } from "@/constant/theme";

export default function IncomingCallScreen() {
  const router = useRouter();
  const activeCall = useWebSocketStore((s) => s.activeCall);
  const sendCallAccept = useWebSocketStore((s) => s.sendCallAccept);
  const sendCallReject = useWebSocketStore((s) => s.sendCallReject);

  useEffect(() => {
    if (!activeCall || !activeCall.isIncoming) {
      router.replace("/(tabs)/messages");
    }
  }, [activeCall, router]);

  if (!activeCall) return null;

  const name = activeCall.otherUserName ?? "Unknown";

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="items-center">
        <AvatarBadge
          colorClass="bg-emerald-500"
          label={name.slice(0, 1).toUpperCase()}
          size="lg"
          isActive
        />
        <Text className="text-gray-900 text-2xl font-bold mt-5">{name}</Text>
        <Text className="text-gray-500 text-sm mt-2">Incoming video call</Text>
      </View>

      <View className="flex-row gap-5 mt-10">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            sendCallReject({
              toUserId: activeCall.otherUserId,
              callId: activeCall.callId,
            });
            router.replace("/(tabs)/messages");
          }}
          className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            sendCallAccept({
              toUserId: activeCall.otherUserId,
              callId: activeCall.callId,
            });
            router.replace({
              pathname: "/(call)/active",
              params: {
                callId: activeCall.callId,
                otherUserId: activeCall.otherUserId,
                name,
                role: "callee",
              },
            });
          }}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: THEME.accent }}
        >
          <Ionicons name="videocam" size={26} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
