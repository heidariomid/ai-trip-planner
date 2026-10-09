import { Sparkles } from "lucide-react-native";
import { Pressable } from "react-native";

import { colors, shadows } from "../lib/theme";
import { Text } from "./Text";

export interface AssistantButtonProps {
  onPress: () => void;
}

/** The way from a trip into its own conversation with the assistant. It floats. */
export function AssistantButton({ onPress }: AssistantButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open this trip's chat with the assistant"
      onPress={onPress}
      style={shadows.card}
      className="h-12 flex-row items-center rounded-full bg-surface px-4 active:opacity-80"
    >
      <Sparkles size={18} color={colors.ink} />
      <Text className="ml-2 text-[15px] font-semibold text-ink">Assistant</Text>
    </Pressable>
  );
}
