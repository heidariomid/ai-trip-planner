import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { colors, shadows } from "../lib/theme";
import { Text } from "./Text";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container. Off by default — a centred capsule reads lighter. */
  fullWidth?: boolean;
  /** Drawn before the label, in the label's colour. */
  icon?: LucideIcon;
  /** Less side padding, for two buttons that share a row. */
  compact?: boolean;
}

const CONTAINER = {
  primary: "bg-accent active:bg-accent-deep",
  secondary: "border border-line bg-surface active:bg-canvas",
} as const;

const LABEL = {
  primary: "text-white",
  secondary: "text-ink",
} as const;

const SHADOW = {
  primary: shadows.accent,
  secondary: shadows.soft,
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  compact = false,
}: ButtonProps) {
  const isBlocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      disabled={isBlocked}
      onPress={onPress}
      style={SHADOW[variant]}
      className={`h-12 flex-row items-center justify-center rounded-full ${compact ? "px-4" : "px-8"} ${
        fullWidth ? "w-full" : "self-center"
      } ${CONTAINER[variant]} ${isBlocked ? "opacity-45" : ""}`}
    >
      {loading ? (
        <View className="mr-2">
          <ActivityIndicator
            size="small"
            color={variant === "primary" ? colors.surface : colors.ink}
          />
        </View>
      ) : Icon ? (
        <View className="mr-2">
          <Icon size={18} color={variant === "primary" ? colors.surface : colors.ink} />
        </View>
      ) : null}
      <Text className={`text-[16px] font-semibold tracking-tight ${LABEL[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
