import { Pressable } from "react-native";

import { Text } from "./Text";

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-11 items-center justify-center rounded-full px-4 ${
        selected ? "bg-accent" : "bg-surface"
      }`}
    >
      <Text
        className={`text-[14px] font-medium ${selected ? "text-white" : "text-subtle"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
