import { TransmissionStatus } from "@/@types/talkie";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface PTTButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  transmissionStatus: TransmissionStatus;
  disabled?: boolean;
}

export const PushButton: React.FC<PTTButtonProps> = ({
  onPressIn,
  onPressOut,
  transmissionStatus,
  disabled = false,
}) => {
  const getButtonClassName = (): string => {
    const baseClasses =
      "w-48 h-48 rounded-full items-center justify-center shadow-lg active:scale-95 transition-transform";

    if (disabled) {
      return `${baseClasses} bg-gray-400`;
    }

    switch (transmissionStatus) {
      case "transmitting":
        return `${baseClasses} bg-red-500 shadow-red-500/50`;
      case "receiving":
        return `${baseClasses} bg-green-500 shadow-green-500/50`;
      default:
        return `${baseClasses} bg-blue-500 shadow-blue-500/50`;
    }
  };

  const getButtonText = (): string => {
    switch (transmissionStatus) {
      case "transmitting":
        return "TRANSMITTING";
      case "receiving":
        return "RECEIVING";
      default:
        return "PUSH TO TALK";
    }
  };

  const getStatusEmoji = (): string => {
    switch (transmissionStatus) {
      case "transmitting":
        return "🎤";
      case "receiving":
        return "🔊";
      default:
        return "📻";
    }
  };

  const getInstructionText = (): string => {
    switch (transmissionStatus) {
      case "transmitting":
        return "Release to send";
      case "receiving":
        return "Someone is speaking...";
      default:
        return "Hold to talk";
    }
  };

  return (
    <View className="items-center justify-center p-8">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || transmissionStatus === "receiving"}
        className={getButtonClassName()}
      >
        <Text className="text-5xl mb-2">{getStatusEmoji()}</Text>
        <Text className="text-white text-lg font-bold text-center px-4">
          {getButtonText()}
        </Text>
      </Pressable>

      <View className="mt-6 px-6">
        <Text className="text-center text-gray-600 dark:text-gray-400 text-sm">
          {getInstructionText()}
        </Text>
      </View>
    </View>
  );
};
