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
      style={shadows.accent}
      className="h-14 flex-row items-center rounded-full bg-accent px-5 active:bg-accent-deep"
    >
      <Sparkles size={20} color={colors.surface} />
      <Text className="ml-2 text-[16px] font-semibold text-white">Ask AI</Text>
    </Pressable>
  );
}
