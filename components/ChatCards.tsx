import { MapPin } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import type { ChatCards as ChatCardsData, DayCard, PlaceCard } from "../lib/chat";
import { PLACEHOLDER_IMAGE } from "../lib/storage";
import { colors, shadows } from "../lib/theme";
import { Text } from "./Text";

const PLACE_IMAGE_SIZE = { width: 56, height: 56 } as const;

interface LockedActionProps {
  label: string;
}

/**
 * A button for something the assistant cannot do yet. It is drawn so the
 * traveller can see what is coming, and it is disabled: it does nothing and
 * shows nothing that could pass for a save.
 */
export function LockedAction({ label }: LockedActionProps) {
  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={`${label}, not available yet`}
      accessibilityState={{ disabled: true }}
      className="h-9 items-center justify-center rounded-full border border-line px-3.5 opacity-45"
    >
      <Text className="text-[13px] font-medium text-ink">{label}</Text>
    </View>
  );
}

function PlaceCardView({ place }: { place: PlaceCard }) {
  return (
    <View style={shadows.soft} className="flex-row items-center rounded-2xl bg-surface p-3">
      {/* Always the placeholder: there is no place-photo source, and a picture
          address from the model is never used. */}
      <Image
        source={PLACEHOLDER_IMAGE}
        resizeMode="cover"
        style={PLACE_IMAGE_SIZE}
        className="rounded-2xl bg-canvas"
        accessible={false}
      />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <MapPin size={14} color={colors.subtle} />
          <Text numberOfLines={1} className="ml-1 flex-1 text-[15px] font-semibold text-ink">
            {place.name}
          </Text>
        </View>
        {place.line ? (
          <Text className="mt-0.5 text-[13px] leading-[18px] text-subtle">{place.line}</Text>
        ) : null}
      </View>
    </View>
  );
}

function DayCardView({ day }: { day: DayCard }) {
  return (
    <View style={shadows.soft} className="rounded-2xl bg-surface p-4">
      <Text className="text-[16px] font-semibold tracking-tight text-ink">{day.title}</Text>
      <View className="mt-2 gap-2.5">
        {day.items.map((item, index) => (
          <View key={index} className="flex-row">
            <Text className="w-14 text-[13px] leading-5 text-subtle">{item.time ?? ""}</Text>
            <View className="flex-1">
              <Text className="text-[14px] leading-5 text-ink">{item.activity}</Text>
              {item.place ? (
                <Text className="text-[13px] leading-[18px] text-subtle">{item.place}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View className="mt-3 flex-row">
        <LockedAction label="Add to Trip" />
      </View>
    </View>
  );
}

export interface ChatCardsProps {
  cards: ChatCardsData;
  /** Chips can be tapped only on the newest reply, and not while one is being written. */
  onPickChip?: (chip: string) => void;
}

/** What the assistant attached to a reply: day cards, place cards, then chips. */
export function ChatCards({ cards, onPickChip }: ChatCardsProps) {
  return (
    <View className="mt-2 gap-2">
      {cards.days.map((day, index) => (
        <DayCardView key={`day-${index}`} day={day} />
      ))}
      {cards.days.length > 0 ? (
        <View className="flex-row gap-2">
          <LockedAction label="Create Trip" />
          <LockedAction label="Save Draft" />
        </View>
      ) : null}

      {cards.places.map((place, index) => (
        <PlaceCardView key={`place-${index}`} place={place} />
      ))}

      {onPickChip && cards.chips.length > 0 ? (
        <View className="mt-1 flex-row flex-wrap gap-2">
          {cards.chips.map((chip) => (
            <Pressable
              key={chip}
              accessibilityRole="button"
              onPress={() => onPickChip(chip)}
              style={shadows.soft}
              className="min-h-[44px] justify-center rounded-full bg-surface px-4 py-2 active:bg-canvas"
            >
              <Text className="text-[14px] font-medium text-ink">{chip}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
