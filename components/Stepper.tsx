import { Minus, Plus, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Names what is being counted, for example "1 traveler". */
  describe: (value: number) => string;
  disabled?: boolean;
}

interface StepButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
  disabled: boolean;
}

function StepButton({ icon: Icon, accessibilityLabel, onPress, disabled }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-line"
    >
      <Icon size={18} color={disabled ? colors.muted : colors.ink} />
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  describe,
  disabled = false,
}: StepperProps) {
  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 ml-1 text-[13px] font-medium text-subtle">{label}</Text>
      <View className="h-[50px] flex-row items-center justify-between rounded-2xl bg-canvas pl-4 pr-1">
        <Text className="text-[16px] text-ink">{describe(value)}</Text>
        <View className="flex-row gap-1">
          <StepButton
            icon={Minus}
            accessibilityLabel={`Fewer: ${label}`}
            onPress={() => onChange(value - 1)}
            disabled={disabled || value <= min}
          />
          <StepButton
            icon={Plus}
            accessibilityLabel={`More: ${label}`}
            onPress={() => onChange(value + 1)}
            disabled={disabled || value >= max}
          />
        </View>
      </View>
    </View>
  );
}
