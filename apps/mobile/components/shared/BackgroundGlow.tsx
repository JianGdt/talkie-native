import React from "react";
import { View } from "react-native";

type GlowPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface GlowConfig {
  position: GlowPosition;
  color: "blue" | "purple" | "pink" | "cyan";
}

interface BackgroundGlowProps {
  glows?: GlowConfig[];
}

const POSITION_CLASSES: Record<GlowPosition, string> = {
  "top-left": "absolute top-0 left-0",
  "top-right": "absolute top-0 right-0",
  "bottom-left": "absolute bottom-0 left-0",
  "bottom-right": "absolute bottom-0 right-0",
};

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500/20",
  purple: "bg-purple-500/20",
  pink: "bg-pink-500/20",
  cyan: "bg-cyan-500/20",
};

const DEFAULT_GLOWS: GlowConfig[] = [
  { position: "top-right", color: "blue" },
  { position: "bottom-left", color: "purple" },
];

export function BackgroundGlow({ glows = DEFAULT_GLOWS }: BackgroundGlowProps) {
  return (
    <View className="absolute inset-0 opacity-30">
      {glows.map((glow, i) => (
        <View
          key={i}
          className={`${POSITION_CLASSES[glow.position]} w-96 h-96 ${COLOR_CLASSES[glow.color]} rounded-full blur-3xl`}
        />
      ))}
    </View>
  );
}
