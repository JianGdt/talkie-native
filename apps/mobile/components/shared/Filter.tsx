import React from "react";
import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface FilterItem<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
}

interface FilterBtnProps<T extends string = string> {
  filters: FilterItem<T>[];
  selected: T;
  onSelect: (id: T) => void;
  activeCount?: number;
  scrollable?: boolean;
}

export function FilterBtn<T extends string = string>({
  filters,
  selected,
  onSelect,
  activeCount,
  scrollable = false,
}: FilterBtnProps<T>) {
  const pills = filters.map((filter) => {
    const isActive = selected === filter.id;
    return (
      <TouchableOpacity
        key={filter.id}
        onPress={() => onSelect(filter.id)}
        className={`px-4 py-3 rounded-2xl flex-row items-center gap-3 ${
          isActive
            ? "border border-blue-500 bg-blue-500/20 backdrop-blur-sm"
            : "bg-slate-900/50 backdrop-blur-sm border border-slate-800/50"
        }`}
        activeOpacity={0.7}
      >
        {filter.icon && (
          <Ionicons
            name={filter.icon as any}
            size={18}
            color={isActive ? "white" : "#64748b"}
          />
        )}
        <Text
          className={`font-semibold text-xs ${
            isActive ? "text-white" : "text-slate-400"
          }`}
        >
          {filter.label}
        </Text>
        {isActive && activeCount !== undefined && (
          <View className="ml-1 bg-white/20 rounded-full px-2 py-2">
            <Text className="text-white text-xs font-bold">{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-5"
        contentContainerClassName="gap-3"
      >
        {pills}
      </ScrollView>
    );
  }

  return <View className="flex-row px-6 py-4 gap-4">{pills}</View>;
}
