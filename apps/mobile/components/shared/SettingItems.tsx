import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { THEME } from "@/constant/theme";

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
    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-gray-100"
    disabled={!onPress && !rightElement}
  >
    <View
      className="w-10 h-10 rounded-xl items-center justify-center"
      style={{ backgroundColor: THEME.accentSoft }}
    >
      <Ionicons name={icon as any} size={20} color={THEME.accent} />
    </View>
    <View className="flex-1 ml-4">
      <Text className="text-gray-900 font-semibold text-base">{title}</Text>
      {subtitle && (
        <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
      )}
    </View>
    {rightElement ||
      (showChevron && (
        <Ionicons name="chevron-forward" size={20} color={THEME.textSubtle} />
      ))}
  </TouchableOpacity>
);
