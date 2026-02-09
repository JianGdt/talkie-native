import { Channel, ConnectionStatus } from "@/@types/talkie";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ChannelHeaderProps {
  channel: Channel | null;
  connectionStatus: ConnectionStatus;
  activeTransmitter: { userId: string; username: string } | null;
  onLeave?: () => void;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channel,
  connectionStatus,
  activeTransmitter,
  onLeave,
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  return (
    <View className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <View className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {getStatusText()}
            </Text>
          </View>

          {channel && (
            <>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {channel.name}
              </Text>
              {channel.description && (
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {channel.description}
                </Text>
              )}
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {channel.activeUsers.length} active user
                {channel.activeUsers.length !== 1 ? "s" : ""}
              </Text>
            </>
          )}

          {!channel && (
            <Text className="text-lg text-gray-400 dark:text-gray-500">
              No channel selected
            </Text>
          )}
        </View>

        {channel && onLeave && (
          <TouchableOpacity
            onPress={onLeave}
            className="bg-red-500 px-4 py-2 rounded-lg active:bg-red-600"
          >
            <Text className="text-white font-semibold">Leave</Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTransmitter && (
        <View className="mt-3 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
          <Text className="text-green-800 dark:text-green-400 font-medium">
            🎤 {activeTransmitter.username} is speaking...
          </Text>
        </View>
      )}
    </View>
  );
};
