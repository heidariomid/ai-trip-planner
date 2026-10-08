import { FlatList, Pressable } from "react-native";

import { Text } from "./Text";

export interface CategoryChipsProps {
  /** Lowercase category names, as stored. "All" is added in front. */
  categories: string[];
  /** Null means All. */
  selected: string | null;
  onSelect: (category: string | null) => void;
}

function toLabel(category: string | null): string {
  if (!category) return "All";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Filters under the Explore chip. The selected one is tinted rather than
 * filled, so it does not compete with the filled Explore chip above it.
 */
export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const options: (string | null)[] = [null, ...categories];

  return (
    <FlatList
      horizontal
      data={options}
      keyExtractor={(category) => category ?? "all"}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => {
        const isSelected = item === selected;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(item)}
            className={`h-11 items-center justify-center rounded-full px-4 ${
              isSelected ? "bg-accent-soft" : "bg-surface"
            }`}
          >
            <Text
              className={`text-[14px] font-medium ${
                isSelected ? "text-accent" : "text-subtle"
              }`}
            >
              {toLabel(item)}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}
