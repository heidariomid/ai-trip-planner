import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

import { colors, shadows } from "../lib/theme";

export interface AddButtonProps {
  accessibilityLabel: string;
  onPress: () => void;
}

export function AddButton({ accessibilityLabel, onPress }: AddButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={shadows.accent}
      className="h-14 w-14 items-center justify-center rounded-full bg-accent active:bg-accent-deep"
    >
      <Plus size={26} color={colors.surface} />
    </Pressable>
  );
}
