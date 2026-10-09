import { Check, Pencil } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { PackingItem } from "../lib/packing";
import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface PackingRowProps {
  item: PackingItem;
  /** Opens the row for editing. Left out, the row is read-only. */
  onPress?: () => void;
  /** Marks the item packed, or clears the mark. Left out, the mark only shows. */
  onToggle?: () => void;
}

/** One thing to pack. Tapping the circle packs it; tapping the row edits it. */
export function PackingRow({ item, onPress, onToggle }: PackingRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Edit ${item.label}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-[44px] flex-row items-center py-2"
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Packed: ${item.label}`}
        accessibilityState={{ checked: item.is_packed }}
        hitSlop={12}
        disabled={!onToggle}
        onPress={onToggle}
        className={`mr-3 h-6 w-6 items-center justify-center rounded-full border ${
          item.is_packed ? "border-accent bg-accent" : "border-muted bg-surface"
        }`}
      >
        {item.is_packed ? <Check size={14} color={colors.surface} /> : null}
      </Pressable>

      <Text
        className={`flex-1 text-[15px] leading-5 ${
          item.is_packed ? "text-subtle line-through" : "font-medium text-ink"
        }`}
      >
        {item.label}
      </Text>

      {onPress ? (
        <View className="h-11 w-11 items-end justify-center">
          <Pencil size={16} color={colors.muted} />
        </View>
      ) : null}
    </Pressable>
  );
}
