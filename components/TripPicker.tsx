import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Trip } from "../lib/trips";
import { colors, shadows } from "../lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

export interface TripPickerProps {
  /** Every trip the traveller may read. Not filtered by owner. */
  trips: Trip[];
  /** Null means no trip. */
  selectedId: string | null;
  onSelect: (tripId: string | null) => void;
}

interface Option {
  id: string | null;
  title: string;
  detail: string;
}

const NO_TRIP: Option = { id: null, title: "No trip", detail: "Ask about anything" };

/** Which trip the assistant is talking about: a capsule that opens a list. */
export function TripPicker({ trips, selectedId, onSelect }: TripPickerProps) {
  const { bottom } = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const options: Option[] = [
    NO_TRIP,
    ...trips.map((trip) => ({
      id: trip.id,
      title: trip.title,
      detail: [
        trip.destination,
        trip.status === "draft" ? "Draft" : null,
        trip.role === "owner" ? null : "Shared",
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  ];
  const selected = options.find((option) => option.id === selectedId) ?? NO_TRIP;

  function pick(id: string | null) {
    setIsOpen(false);
    if (id !== selectedId) onSelect(id);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Trip: ${selected.title}. Change`}
        onPress={() => setIsOpen(true)}
        style={shadows.soft}
        className="h-11 flex-row items-center self-start rounded-full bg-surface pl-4 pr-3 active:bg-canvas"
      >
        <Text className="text-[13px] text-subtle">Trip</Text>
        <Text numberOfLines={1} className="ml-2 max-w-[220px] text-[14px] font-medium text-ink">
          {selected.title}
        </Text>
        <View className="ml-1">
          <ChevronDown size={16} color={colors.subtle} />
        </View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View
          className="flex-1 items-center justify-end px-5"
          style={{ paddingBottom: Math.max(bottom, 12) + 8 }}
        >
          <Pressable
            accessibilityLabel="Close the trip list"
            onPress={() => setIsOpen(false)}
            className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
          />
          <View className="max-h-[60%] w-full max-w-[380px]">
            <Card>
              <Text className="mb-2 text-[20px] font-semibold tracking-tight text-ink">
                Talk about a trip
              </Text>
              <FlatList
                data={options}
                keyExtractor={(option) => option.id ?? "none"}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.id === selectedId }}
                    onPress={() => pick(item.id)}
                    className="min-h-[52px] flex-row items-center rounded-2xl px-2 py-1.5 active:bg-canvas"
                  >
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-[16px] font-medium text-ink">
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} className="text-[13px] text-subtle">
                        {item.detail}
                      </Text>
                    </View>
                    {item.id === selectedId ? <Check size={18} color={colors.ink} /> : null}
                  </Pressable>
                )}
              />
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}
