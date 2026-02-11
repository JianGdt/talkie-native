import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

interface ControlledInputProps<T extends FieldValues> extends TextInputProps {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...textInputProps
}: ControlledInputProps<T>) {
  return (
    <View>
      <Text className="text-gray-300 mb-2 text-sm font-medium">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`bg-gray-800 text-white px-4 py-4 rounded-xl text-base ${
              error ? "border-2 border-red-500" : ""
            }`}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            {...textInputProps}
          />
        )}
      />
      {error && <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
}
