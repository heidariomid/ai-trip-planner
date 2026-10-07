import { FlatList, Pressable } from "react-native";

import { formatDayLabel } from "../lib/dates";
import type { ItineraryDay } from "../lib/trip-detail";
import { Text } from "./Text";

export interface DayChipsProps {
  days: ItineraryDay[];
  selectedId: string | null;
  onSelect: (dayId: string) => void;
}

/**
 * The days of a trip in a row. The selected one is tinted rather than filled,
 * so it does not compete with the selected section chip above it.
 */
export function DayChips({ days, selectedId, onSelect }: DayChipsProps) {
  return (
    <FlatList
      horizontal
      data={days}
      keyExtractor={(day) => day.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedId;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(item.id)}
            className={`h-14 justify-center rounded-2xl px-4 ${
              isSelected ? "bg-accent-soft" : "bg-surface"
            }`}
          >
            <Text
              className={`text-[14px] font-semibold ${isSelected ? "text-accent" : "text-ink"}`}
            >
              Day {item.day_number}
            </Text>
            {item.date ? (
              <Text className={`text-[12px] ${isSelected ? "text-accent" : "text-subtle"}`}>
                {formatDayLabel(item.date)}
              </Text>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
