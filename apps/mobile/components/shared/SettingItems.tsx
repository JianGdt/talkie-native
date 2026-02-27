import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export const SettingItem = ({
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
