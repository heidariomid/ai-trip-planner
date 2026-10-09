import {
  ArrowUpRight,
  BedDouble,
  Car,
  MapPin,
  Plane,
  Ticket,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { FlatList, Image, Pressable, View } from "react-native";

import { usePlaceInfo } from "../hooks/usePlaceInfo";
import type {
  BookingCard,
  ChatCards as ChatCardsData,
  DayCard,
  PackingCard,
  PlaceCard,
  TripSummaryCard,
} from "../lib/chat";
import { getBookingKindLabel, getBookingTitle, type ChatPlan } from "../lib/chat-actions";
import { pluralize } from "../lib/dates";
import { openInMaps, openPlace } from "../lib/maps";
import { PLACEHOLDER_IMAGE } from "../lib/storage";
import { colors, shadows } from "../lib/theme";
import type { TripStatusValue } from "../lib/trips";
import { Fact } from "./Fact";
import { Text } from "./Text";
import { TimeField } from "./TimeField";

const PLACE_CARD_WIDTH = 210;
// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image, and the placeholder is one.
const PLACE_PHOTO_SIZE = { width: "100%", height: 132 } as const;
// Wikimedia refuses the name Android's image loader sends by default.
const PHOTO_HEADERS = { "User-Agent": "AITripPlanner/1.0 (Expo; React Native)" } as const;
const PLACE_LIST_CONTENT = { gap: 10, paddingVertical: 4, paddingRight: 4 } as const;

/**
 * What a card's buttons do. The model only proposes a card; nothing is saved
 * until the traveller taps one of these and confirms.
 */
export interface ChatCardActions {
  /** False when no trip is selected, so there is nothing to add a card to. */
  hasTrip: boolean;
  /** True once the card with this key was saved. */
  isAdded: (key: string) => boolean;
  onCreateTrip: (plan: ChatPlan, status: TripStatusValue) => void;
  onAddDay: (key: string, day: DayCard) => void;
  /** A day card with the traveller's own edits, or as the assistant proposed it. */
  getDay: (key: string, proposed: DayCard) => DayCard;
  /** Keeps an edited day card. Nothing is saved to a trip by this. */
  onEditDay: (key: string, day: DayCard) => void;
  onAddBooking: (key: string, booking: BookingCard) => void;
  onAddPacking: (key: string, groups: PackingCard[]) => void;
}

export interface CardActionProps {
  label: string;
  onPress: () => void;
  /** Filled with the accent. One per card at most. */
  primary?: boolean;
  disabled?: boolean;
}

/** A small capsule under a card or a reply. */
export function CardAction({ label, onPress, primary = false, disabled = false }: CardActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-11 items-center justify-center rounded-full px-4 ${
        primary
          ? "bg-accent active:bg-accent-deep"
          : "border border-line bg-surface active:bg-canvas"
      } ${disabled ? "opacity-45" : ""}`}
    >
      <Text className={`text-[14px] font-medium ${primary ? "text-white" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function NeedsTrip() {
  return (
    <Text className="mt-2 text-[13px] leading-[18px] text-subtle">
      Pick a trip at the top to add this.
    </Text>
  );
}

interface TripSummaryProps {
  trip: TripSummaryCard;
  days: DayCard[];
  actions: ChatCardActions;
}

function TripSummaryView({ trip, days, actions }: TripSummaryProps) {
  const plan: ChatPlan = { trip, days };

  return (
    <View style={shadows.soft} className="rounded-2xl bg-surface p-4">
      <Text className="text-[13px] text-subtle">New trip</Text>
      <Text className="mt-0.5 text-[20px] font-semibold tracking-tight text-ink">
        {trip.title}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-x-6 gap-y-3">
        <Fact label="Destination" value={trip.destination} />
        <Fact label="Length" value={pluralize(trip.dayCount, "day")} />
        <Fact label="Travelers" value={String(trip.travelerCount)} />
      </View>
      {trip.description ? (
        <Text className="mt-3 text-[14px] leading-5 text-ink">{trip.description}</Text>
      ) : null}
      <View className="mt-4 flex-row flex-wrap gap-2">
        <CardAction
          label="Create Trip"
          primary
          onPress={() => actions.onCreateTrip(plan, "active")}
        />
        <CardAction label="Save Draft" onPress={() => actions.onCreateTrip(plan, "draft")} />
      </View>
    </View>
  );
}

interface PlaceCardProps {
  place: PlaceCard;
  /** The city the conversation is about, so the right place is found. */
  near: string;
}

/**
 * A place the assistant recommends, with a real photo of it from Google Places
 * when there is one. The address of the picture comes from that lookup, never
 * from the model. Tapping the card opens the place in Google Maps.
 */
function PlaceCardView({ place, near }: PlaceCardProps) {
  const info = usePlaceInfo(place.name, near);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${place.name} in Maps`}
      onPress={() => void openPlace(info?.mapsUrl ?? null, place.name, near)}
      style={[shadows.soft, { width: PLACE_CARD_WIDTH }]}
      className="rounded-2xl bg-surface active:opacity-80"
    >
      <Image
        source={
          info?.photoUrl ? { uri: info.photoUrl, headers: PHOTO_HEADERS } : PLACEHOLDER_IMAGE
        }
        resizeMode="cover"
        style={PLACE_PHOTO_SIZE}
        className="rounded-t-2xl bg-canvas"
        accessible={false}
      />
      <View className="px-3 pb-3 pt-2.5">
        <View className="flex-row items-center">
          <Text numberOfLines={1} className="flex-1 text-[15px] font-semibold text-ink">
            {place.name}
          </Text>
          <ArrowUpRight size={14} color={colors.subtle} />
        </View>
        {place.line ? (
          <Text numberOfLines={2} className="mt-0.5 text-[13px] leading-[18px] text-subtle">
            {place.line}
          </Text>
        ) : null}
        {info?.address ? (
          <View className="mt-1.5 flex-row items-center">
            <MapPin size={12} color={colors.subtle} />
            <Text numberOfLines={1} className="ml-1 flex-1 text-[12px] text-subtle">
              {info.address}
            </Text>
          </View>
        ) : null}
        {info?.photoUrl && info.photoCredit ? (
          <Text numberOfLines={1} className="mt-1 text-[11px] text-muted">
            Photo: {info.photoCredit}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** The place on a day's stop, as the one link on the row: it opens Google Maps. */
function PlaceLink({ place, near }: { place: string; near: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${place} in Maps`}
      hitSlop={8}
      onPress={() => void openInMaps(place, near)}
      className="mt-0.5 flex-row items-center self-start active:opacity-60"
    >
      <MapPin size={12} color={colors.subtle} />
      <Text className="ml-1 text-[13px] font-medium leading-[18px] text-ink">{place}</Text>
      <View className="ml-0.5">
        <ArrowUpRight size={12} color={colors.subtle} />
      </View>
    </Pressable>
  );
}

interface DayCardProps {
  day: DayCard;
  cardKey: string;
  actions: ChatCardActions;
  near: string;
  /** The day belongs to a new trip in the same reply, which Create Trip saves. */
  isPartOfNewTrip: boolean;
}

function DayCardView({ day, cardKey, actions, near, isPartOfNewTrip }: DayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  // What gets saved is the traveller's version once they have changed it.
  const current = actions.getDay(cardKey, day);
  const isAdded = actions.isAdded(cardKey);
  const isEmpty = current.items.length === 0;

  function removeStop(index: number) {
    actions.onEditDay(cardKey, {
      ...current,
      items: current.items.filter((_, position) => position !== index),
    });
  }

  function setTime(index: number, time: string | null) {
    actions.onEditDay(cardKey, {
      ...current,
      items: current.items.map((item, position) =>
        position === index ? { ...item, time } : item,
      ),
    });
  }

  return (
    <View style={shadows.soft} className="rounded-2xl bg-surface p-4">
      <Text className="text-[16px] font-semibold tracking-tight text-ink">{current.title}</Text>

      {isEditing ? (
        <View className="mt-3 gap-2">
          {current.items.map((item, index) => (
            <View key={index} className="rounded-2xl border border-line px-3 pb-0.5 pt-3">
              <View className="flex-row items-start">
                <View className="flex-1 pr-2">
                  <Text className="text-[14px] font-medium leading-5 text-ink">
                    {item.activity}
                  </Text>
                  {item.place ? (
                    <Text className="text-[13px] leading-[18px] text-subtle">{item.place}</Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.activity}`}
                  onPress={() => removeStop(index)}
                  className="-mr-2 -mt-2 h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
                >
                  <X size={18} color={colors.subtle} />
                </Pressable>
              </View>
              <View className="mt-2 flex-row">
                <TimeField
                  label="Time"
                  value={item.time}
                  onChange={(time) => setTime(index, time)}
                  optional
                />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="mt-2 gap-2.5">
          {current.items.map((item, index) => (
            <View key={index} className="flex-row">
              <Text className="w-14 text-[13px] leading-5 text-subtle">{item.time ?? ""}</Text>
              <View className="flex-1">
                <Text className="text-[14px] leading-5 text-ink">{item.activity}</Text>
                {item.place ? <PlaceLink place={item.place} near={near} /> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {isEmpty ? (
        <Text className="mt-2 text-[13px] leading-[18px] text-subtle">
          Every stop was removed. Bring them back to save this day.
        </Text>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        {actions.hasTrip && !isEditing ? (
          <CardAction
            label={isAdded ? "Added" : "Add to Trip"}
            disabled={isAdded || isEmpty}
            onPress={() => actions.onAddDay(cardKey, current)}
          />
        ) : null}
        {isAdded ? null : isEmpty ? (
          <CardAction label="Bring back" onPress={() => actions.onEditDay(cardKey, day)} />
        ) : (
          <CardAction
            label={isEditing ? "Done" : "Edit"}
            onPress={() => setIsEditing((editing) => !editing)}
          />
        )}
      </View>
      {actions.hasTrip || isPartOfNewTrip ? null : <NeedsTrip />}
    </View>
  );
}

const BOOKING_ICONS = {
  hotel: BedDouble,
  car: Car,
  extra: Ticket,
  flight: Plane,
} as const satisfies Record<BookingCard["kind"], LucideIcon>;

function getBookingDetail(booking: BookingCard): string | null {
  switch (booking.kind) {
    case "hotel":
      return booking.line;
    case "car":
      return [booking.pickupLocation, booking.line].filter(Boolean).join(" · ") || null;
    case "extra":
      return booking.detail;
    case "flight":
      return null;
  }
}

interface BookingCardProps {
  booking: BookingCard;
  cardKey: string;
  actions: ChatCardActions;
}

function BookingCardView({ booking, cardKey, actions }: BookingCardProps) {
  const Icon = BOOKING_ICONS[booking.kind];
  const detail = getBookingDetail(booking);
  const isAdded = actions.isAdded(cardKey);

  return (
    <View style={shadows.soft} className="rounded-2xl bg-surface p-4">
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
          <Icon size={18} color={colors.ink} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[13px] text-subtle">{getBookingKindLabel(booking)}</Text>
          <Text className="text-[15px] font-semibold text-ink">{getBookingTitle(booking)}</Text>
          {detail ? (
            <Text className="mt-0.5 text-[13px] leading-[18px] text-subtle">{detail}</Text>
          ) : null}
        </View>
      </View>
      {actions.hasTrip ? (
        <View className="mt-3 flex-row">
          <CardAction
            label={isAdded ? "Added" : "Add to Bookings"}
            disabled={isAdded}
            onPress={() => actions.onAddBooking(cardKey, booking)}
          />
        </View>
      ) : (
        <NeedsTrip />
      )}
    </View>
  );
}

interface PackingCardProps {
  groups: PackingCard[];
  cardKey: string;
  actions: ChatCardActions;
}

/** Every packing group of a reply as one card, saved with one tap. */
function PackingCardView({ groups, cardKey, actions }: PackingCardProps) {
  const isAdded = actions.isAdded(cardKey);

  return (
    <View style={shadows.soft} className="rounded-2xl bg-surface p-4">
      <Text className="text-[13px] text-subtle">Packing list</Text>
      {groups.map((group, index) => (
        <View key={index} className="mt-2">
          <Text className="text-[15px] font-semibold text-ink">{group.category}</Text>
          {group.items.map((item, itemIndex) => (
            <Text key={itemIndex} className="mt-0.5 text-[14px] leading-5 text-subtle">
              {item}
            </Text>
          ))}
        </View>
      ))}
      {actions.hasTrip ? (
        <View className="mt-3 flex-row">
          <CardAction
            label={isAdded ? "Added" : "Add to Packing"}
            disabled={isAdded}
            onPress={() => actions.onAddPacking(cardKey, groups)}
          />
        </View>
      ) : (
        <NeedsTrip />
      )}
    </View>
  );
}

const MAX_PLACES_FROM_DAYS = 6;

/**
 * When a plan came with no place cards of its own, the places its days stop
 * at are shown instead, so a plan always has something to look at.
 */
function getPlacesFromDays(days: DayCard[]): PlaceCard[] {
  const seen = new Set<string>();
  const places: PlaceCard[] = [];

  for (const day of days) {
    for (const item of day.items) {
      const key = item.place?.trim().toLowerCase();
      if (!item.place || !key || seen.has(key)) continue;
      seen.add(key);
      places.push({ name: item.place, line: item.activity });
      if (places.length === MAX_PLACES_FROM_DAYS) return places;
    }
  }
  return places;
}

export interface ChatCardsProps {
  /** The message the cards belong to. Makes each card's key. */
  messageId: string;
  cards: ChatCardsData;
  actions: ChatCardActions;
  /** The destination of the selected trip, or empty. A map search adds it. */
  near: string;
  /** Chips can be tapped only on the newest reply, and not while one is being written. */
  onPickChip?: (chip: string) => void;
}

/** What the assistant attached to a reply: the trip, its days, bookings, packing, places, then chips. */
export function ChatCards({ messageId, cards, actions, near, onPickChip }: ChatCardsProps) {
  // A new trip proposed in this reply names its own city.
  const city = cards.trip?.destination ?? near;
  const places = cards.places.length > 0 ? cards.places : getPlacesFromDays(cards.days);

  return (
    <View className="mt-2 gap-2">
      {cards.trip ? (
        <TripSummaryView
          trip={cards.trip}
          // Create Trip saves the days as the traveller left them.
          days={cards.days
            .map((day, index) => actions.getDay(`${messageId}:day:${index}`, day))
            .filter((day) => day.items.length > 0)}
          actions={actions}
        />
      ) : null}

      {cards.days.map((day, index) => (
        <DayCardView
          key={`day-${index}`}
          day={day}
          cardKey={`${messageId}:day:${index}`}
          actions={actions}
          near={city}
          isPartOfNewTrip={cards.trip !== null}
        />
      ))}

      {cards.bookings.map((booking, index) => (
        <BookingCardView
          key={`booking-${index}`}
          booking={booking}
          cardKey={`${messageId}:booking:${index}`}
          actions={actions}
        />
      ))}

      {cards.packing.length > 0 ? (
        <PackingCardView
          groups={cards.packing}
          cardKey={`${messageId}:packing`}
          actions={actions}
        />
      ) : null}

      {places.length > 0 ? (
        <FlatList
          horizontal
          data={places}
          keyExtractor={(place, index) => `${index}-${place.name}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={PLACE_LIST_CONTENT}
          renderItem={({ item }) => <PlaceCardView place={item} near={city} />}
        />
      ) : null}

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
