import React, { useState } from "react";
import { DimensionValue, Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getNftAvatarByValue,
  NftAvatarOption,
} from "@/constants/nftAvatars";
import { THEME } from "@/constant/theme";

interface NftAvatarViewProps {
  avatar: NftAvatarOption;
  size?: DimensionValue;
}

export function NftAvatarView({ avatar, size = "100%" }: NftAvatarViewProps) {
  return (
    <View
      className="overflow-hidden items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        backgroundColor: avatar.secondary,
      }}
    >
      <View
        className="absolute inset-0"
        style={{ backgroundColor: avatar.background, opacity: 0.88 }}
      />
      <View
        className="absolute w-[70%] h-[70%] rounded-full"
        style={{
          top: "13%",
          backgroundColor: "#f8fafc",
          opacity: 0.98,
        }}
      />
      <View
        className="absolute w-[74%] h-[32%] rounded-full"
        style={{
          bottom: "-4%",
          backgroundColor: avatar.accent,
        }}
      />
      <View
        className="absolute w-[54%] h-[21%] rounded-t-full"
        style={{
          top: "13%",
          backgroundColor: avatar.detail,
        }}
      />
      <View
        className="absolute w-[9%] h-[9%] rounded-full"
        style={{ top: "42%", left: "34%", backgroundColor: "#111827" }}
      />
      <View
        className="absolute w-[9%] h-[9%] rounded-full"
        style={{ top: "42%", right: "34%", backgroundColor: "#111827" }}
      />
      <View
        className="absolute w-[34%] h-[7%] rounded-full"
        style={{ top: "64%", backgroundColor: avatar.detail }}
      />
      <View
        className="absolute w-[18%] h-[18%] rounded-full"
        style={{
          top: "7%",
          left: "8%",
          backgroundColor: "rgba(255,255,255,0.36)",
        }}
      />
      <View className="absolute right-[11%] top-[12%]">
        <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.78)" />
      </View>
    </View>
  );
}

interface ProfileAvatarProps {
  value?: string | null;
  fallbackLabel?: string;
  size?: number;
}

export function ProfileAvatar({
  value,
  fallbackLabel = "?",
  size = 96,
}: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const nftAvatar = getNftAvatarByValue(value);

  if (nftAvatar) {
    return (
      <View
        className="overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <NftAvatarView avatar={nftAvatar} size={size} />
      </View>
    );
  }

  if (value && !imageFailed) {
    return (
      <Image
        source={{ uri: value }}
        className="rounded-full bg-white"
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View
      className="rounded-full items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: THEME.surfaceRaised,
      }}
    >
      <Text className="text-white text-3xl font-bold">
        {fallbackLabel.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}
