import { View } from "react-native";

import { Text } from "./Text";

export interface ProgressBarProps {
  label: string;
  /** From 0 to 1. */
  value: number;
}

export function ProgressBar({ label, value }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-[13px] text-subtle">{label}</Text>
        <Text className="text-[13px] font-semibold text-ink">{percent}%</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-canvas">
        <View className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}
