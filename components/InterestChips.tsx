import { Pressable, View } from "react-native";

import { INTERESTS, MAX_INTERESTS, toInterestLabel } from "../lib/profiles";
import { Text } from "./Text";

export interface InterestChipsProps {
  /** Tags as stored, lowercase. */
  selected: string[];
  onChange: (interests: string[]) => void;
  disabled?: boolean;
}

/**
 * The fixed list of interest tags, wrapping onto as many lines as it needs.
 * A picked tag is tinted rather than filled, so a form with six of them
 * picked still has one accent element: Save.
 */
export function InterestChips({ selected, onChange, disabled = false }: InterestChipsProps) {
  const isFull = selected.length >= MAX_INTERESTS;

  function toggle(interest: string) {
    if (selected.includes(interest)) onChange(selected.filter((item) => item !== interest));
    else if (!isFull) onChange([...selected, interest]);
  }

  return (
    <View className="mb-3.5">
      <View className="mb-1.5 ml-1 flex-row items-center justify-between">
        <Text className="text-[13px] font-medium text-subtle">Interests</Text>
        <Text className="mr-1 text-[13px] text-muted">
          {selected.length}/{MAX_INTERESTS}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest);
          const isBlocked = disabled || (isFull && !isSelected);
          return (
            <Pressable
              key={interest}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isBlocked }}
              disabled={isBlocked}
              onPress={() => toggle(interest)}
              className={`h-11 items-center justify-center rounded-full px-4 ${
                isSelected ? "bg-accent-soft" : "bg-canvas"
              } ${isBlocked ? "opacity-45" : ""}`}
            >
              <Text
                className={`text-[14px] font-medium ${
                  isSelected ? "text-accent" : "text-subtle"
                }`}
              >
                {toInterestLabel(interest)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
