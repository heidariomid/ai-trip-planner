import { View } from "react-native";

import { Text } from "./Text";

export interface BadgeProps {
  label: string;
  /** The one state that matters now. Every other badge stays quiet. */
  highlighted?: boolean;
}

export function Badge({ label, highlighted = false }: BadgeProps) {
  return (
    <View
      className={`rounded-full px-3 py-1.5 ${highlighted ? "bg-accent-soft" : "bg-canvas"}`}
    >
      <Text
        className={`text-[13px] font-medium ${highlighted ? "text-accent" : "text-subtle"}`}
      >
        {label}
      </Text>
    </View>
  );
}
