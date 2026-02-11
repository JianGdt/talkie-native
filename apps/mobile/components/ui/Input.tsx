import React, { forwardRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerClassName = "",
      inputClassName = "",
      showPasswordToggle,
      secureTextEntry,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const isPassword = secureTextEntry || showPasswordToggle;
    const finalSecureTextEntry = isPassword && !isPasswordVisible;

    return (
      <View className={containerClassName}>
        {label && (
          <Text className="text-gray-300 mb-2 text-sm font-medium">
            {label}
          </Text>
        )}

        <View className="relative">
          <View
            className={`bg-gray-800 rounded-xl flex-row items-center px-4 ${
              error ? "border-2 border-red-500" : "border border-gray-700"
            }`}
          >
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={20}
                color="#9ca3af"
                style={{ marginRight: 12 }}
              />
            )}

            <TextInput
              ref={ref}
              className={`flex-1 text-white py-4 text-base ${inputClassName}`}
              placeholderTextColor="#6b7280"
              secureTextEntry={finalSecureTextEntry}
              {...props}
            />

            {isPassword && (
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                className="ml-2"
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            )}

            {rightIcon && !isPassword && (
              <TouchableOpacity onPress={onRightIconPress} className="ml-2">
                <Ionicons name={rightIcon} size={22} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {error && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="alert-circle" size={14} color="#ef4444" />
            <Text className="text-red-500 text-sm ml-1">{error}</Text>
          </View>
        )}

        {helperText && !error && (
          <Text className="text-gray-500 text-xs mt-1">{helperText}</Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
