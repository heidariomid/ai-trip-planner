import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

import { colors, shadows } from "../lib/theme";

export interface RoundButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
}

/** A 44pt white circle with one icon, for a control that sits on a picture. */
export function RoundButton({ icon: Icon, accessibilityLabel, onPress }: RoundButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={shadows.soft}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-canvas"
    >
      <Icon size={20} color={colors.ink} />
    </Pressable>
  );
}
