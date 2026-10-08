import { Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface AddHeaderProps {
  title: string;
  /** Quiet text beside the title, such as a count. */
  detail?: string;
  /** What the add control says to a screen reader. */
  addLabel: string;
  onAdd: () => void;
  /** Replaces "Add" while the add is under way, and blocks a second tap. */
  busyLabel?: string | null;
}

/** A section title in the card-title style with a quiet "+ Add" on the right. */
export function AddHeader({ title, detail, addLabel, onAdd, busyLabel }: AddHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 flex-row items-baseline">
        <Text numberOfLines={1} className="shrink text-[20px] font-semibold tracking-tight text-ink">
          {title}
        </Text>
        {detail ? <Text className="ml-2 text-[13px] text-subtle">{detail}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        accessibilityState={{ busy: Boolean(busyLabel), disabled: Boolean(busyLabel) }}
        disabled={Boolean(busyLabel)}
        onPress={onAdd}
        className="h-11 flex-row items-center pl-3 active:opacity-60"
      >
        {busyLabel ? (
          <Text className="text-[14px] font-medium text-subtle">{busyLabel}</Text>
        ) : (
          <>
            <Plus size={16} color={colors.ink} />
            <Text className="ml-1 text-[14px] font-medium text-ink">Add</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
