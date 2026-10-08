import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface SectionHeaderProps {
  title: string;
  /** Shows "See all" on the right when given. */
  onSeeAll?: () => void;
}

/** The title of a section on a screen, with an optional way to see the rest. */
export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[20px] font-semibold tracking-tight text-ink">{title}</Text>
      {onSeeAll ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See all: ${title}`}
          onPress={onSeeAll}
          className="h-11 flex-row items-center pl-3"
        >
          <Text className="mr-0.5 text-[14px] text-subtle">See all</Text>
          <ChevronRight size={16} color={colors.subtle} />
        </Pressable>
      ) : null}
    </View>
  );
}
