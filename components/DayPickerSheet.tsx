import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DayCard } from "../lib/chat";
import type { DaySaveMode, TripDayOption } from "../lib/chat-actions";
import { formatDayLabel, pluralize } from "../lib/dates";
import { colors } from "../lib/theme";
import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";

interface ModeOptionProps {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

/** One of the two things to do with what the day already has. */
function ModeOption({ label, selected, disabled, onPress }: ModeOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-[44px] flex-1 items-center justify-center rounded-2xl px-3 py-2 ${
        selected ? "bg-accent-soft" : "bg-canvas"
      }`}
    >
      <Text
        className={`text-center text-[13px] font-medium leading-[18px] ${
          selected ? "text-accent" : "text-subtle"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface DayPickerSheetProps {
  /** Null keeps the sheet closed. */
  card: DayCard | null;
  tripTitle: string;
  /** The days the trip already has. Null while they are being read. */
  days: TripDayOption[] | null;
  isSaving: boolean;
  error: string | null;
  onConfirm: (day: TripDayOption, mode: DaySaveMode) => void;
  onCancel: () => void;
}

/**
 * Asks which day of the trip a day card goes onto, and whether it joins what the
 * day has or takes its place. It is the confirmation for writing it. Only days the trip already has are offered: the chat never adds
 * a day.
 */
export function DayPickerSheet({
  card,
  tripTitle,
  days,
  isSaving,
  error,
  onConfirm,
  onCancel,
}: DayPickerSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<DaySaveMode>("add");

  // The card's own day is chosen to begin with, when the trip has that day.
  useEffect(() => {
    const match = card && days ? days.find((day) => day.dayNumber === card.day) : undefined;
    setSelectedId(match?.id ?? null);
    // Adding is the safe default every time the sheet opens.
    setMode("add");
  }, [card, days]);

  const selected = days?.find((day) => day.id === selectedId) ?? null;
  const count = card?.items.length ?? 0;
  const existing = selected?.activityCount ?? 0;
  const isReplacing = mode === "replace" && existing > 0;
  const addLabel = count === 1 ? "Add 1 activity" : `Add ${count} activities`;
  const isPastTheEnd = card !== null && days !== null && days.length > 0 && card.day > days.length;

  return (
    <Modal visible={card !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        className="flex-1 items-center justify-end px-5"
        style={{ paddingBottom: Math.max(bottom, 12) + 8 }}
      >
        <Pressable
          accessibilityLabel="Cancel"
          disabled={isSaving}
          onPress={onCancel}
          className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
        />
        <View className="max-h-[75%] w-full max-w-[380px]">
          <Card>
            <Text className="text-[20px] font-semibold tracking-tight text-ink">
              Add to {tripTitle}
            </Text>
            <Text className="mb-3 mt-1 text-[14px] leading-5 text-subtle">
              {card?.title}. Choose the day these go on.
            </Text>

            {isPastTheEnd ? (
              <FormMessage
                tone="info"
                message={`This plan is for day ${card.day}, and the trip has ${pluralize(
                  days.length,
                  "day",
                )}. To add a day, change the trip's dates on the trip screen.`}
              />
            ) : null}

            {days === null ? (
              <View className="py-6">
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : (
              <FlatList
                data={days}
                keyExtractor={(day) => day.id}
                showsVerticalScrollIndicator={false}
                className="mb-3"
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.id === selectedId }}
                    disabled={isSaving}
                    onPress={() => {
                      setSelectedId(item.id);
                      setMode("add");
                    }}
                    className={`h-12 flex-row items-center rounded-2xl px-3 ${
                      item.id === selectedId ? "bg-accent-soft" : "active:bg-canvas"
                    }`}
                  >
                    <Text
                      className={`flex-1 text-[16px] font-medium ${
                        item.id === selectedId ? "text-accent" : "text-ink"
                      }`}
                    >
                      Day {item.dayNumber}
                      {item.date ? (
                        <Text className="text-[14px] text-subtle">
                          {"  "}
                          {formatDayLabel(item.date)}
                        </Text>
                      ) : null}
                    </Text>
                    {item.id === selectedId ? <Check size={18} color={colors.accent} /> : null}
                  </Pressable>
                )}
              />
            )}

            {existing > 0 ? (
              <View className="mb-4 flex-row gap-2">
                <ModeOption
                  label={`Keep the ${existing} already there`}
                  selected={!isReplacing}
                  disabled={isSaving}
                  onPress={() => setMode("add")}
                />
                <ModeOption
                  label={existing === 1 ? "Replace it" : `Replace those ${existing}`}
                  selected={isReplacing}
                  disabled={isSaving}
                  onPress={() => setMode("replace")}
                />
              </View>
            ) : null}

            <FormMessage message={error} />
            <View className="flex-row justify-end gap-3">
              <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={isSaving} />
              <Button
                label={isReplacing ? `Replace with ${count}` : addLabel}
                onPress={() => {
                  if (selected) onConfirm(selected, isReplacing ? "replace" : "add");
                }}
                disabled={!selected}
                loading={isSaving}
              />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
