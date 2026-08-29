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
    className="rounded-xl p-4 mb-3 flex-row items-center border"
    style={{ backgroundColor: THEME.surface, borderColor: THEME.border }}
    disabled={!onPress && !rightElement}
  >
    <View
      className="w-10 h-10 rounded-lg items-center justify-center"
      style={{ backgroundColor: THEME.inputBg }}
    >
      <Ionicons name={icon as any} size={20} color={THEME.accent} />
    </View>
    <View className="flex-1 ml-4">
      <Text className="font-semibold text-sm" style={{ color: THEME.text }}>
        {title}
      </Text>
      {subtitle && (
        <Text className="text-xs mt-1" style={{ color: THEME.textMuted }}>
          {subtitle}
        </Text>
      )}
    </View>
    {rightElement ||
      (showChevron && (
        <Ionicons name="chevron-forward" size={20} color={THEME.textSubtle} />
      ))}
  </TouchableOpacity>
);
