import { Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { Booking } from "../lib/bookings";
import { colors } from "../lib/theme";
import type { BookingDraft, BookingKind } from "../lib/validation";
import { BookingForm } from "./BookingForm";
import { BookingRow } from "./BookingRow";
import { Text } from "./Text";

/** Which row is open as a form: a booking's id, or "new" under one kind. */
export type BookingEditing = { kind: BookingKind; id: string | "new" } | null;

/** One row of the Bookings list: a section's title, a booking, or what ends a section. */
export type BookingItem =
  | { type: "header"; key: string; kind: BookingKind }
  | { type: "booking"; key: string; booking: Booking }
  | { type: "footer"; key: string; kind: BookingKind; isEmpty: boolean };

const KINDS: readonly BookingKind[] = ["flight", "car", "hotel", "extra"];

// `none` is the empty sentence for someone who cannot add one.
const SECTIONS: Record<BookingKind, { title: string; add: string; empty: string; none: string }> = {
  flight: { title: "Flights", add: "Add a flight", empty: "No flights yet.", none: "No flights yet." },
  car: {
    title: "Car rental",
    add: "Add a car rental",
    empty: "No car rental yet.",
    none: "No car rental yet.",
  },
  hotel: { title: "Hotels", add: "Add a hotel", empty: "No hotels yet.", none: "No hotels yet." },
  extra: {
    title: "Extras",
    add: "Add an extra",
    empty: "No extras yet. Add a rail pass, a bus, or an event ticket.",
    none: "No extras yet.",
  },
};

/** The four sections laid end to end, so one list can render them. */
export function buildBookingItems(bookings: Booking[]): BookingItem[] {
  return KINDS.flatMap((kind): BookingItem[] => {
    const ofKind = bookings.filter((booking) => booking.kind === kind);
    return [
      { type: "header", key: `${kind}-header`, kind },
      ...ofKind.map((booking): BookingItem => ({ type: "booking", key: booking.id, booking })),
      { type: "footer", key: `${kind}-footer`, kind, isEmpty: ofKind.length === 0 },
    ];
  });
}

export interface BookingListItemProps {
  item: BookingItem;
  editing: BookingEditing;
  tripStart: string;
  tripEnd: string;
  /** False for a viewer: nothing can be added or opened for editing. */
  canEdit: boolean;
  onEdit: (target: BookingEditing) => void;
  onSave: (draft: BookingDraft, existing: Booking | null) => Promise<string | null>;
  onDelete: (booking: Booking) => Promise<string | null>;
}

export function BookingListItem({
  item,
  editing,
  tripStart,
  tripEnd,
  canEdit,
  onEdit,
  onSave,
  onDelete,
}: BookingListItemProps) {
  if (item.type === "header") {
    const section = SECTIONS[item.kind];
    return (
      <View className="flex-row items-center justify-between">
        <Text className="text-[20px] font-semibold tracking-tight text-ink">{section.title}</Text>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={section.add}
            onPress={() => onEdit({ kind: item.kind, id: "new" })}
            className="h-11 flex-row items-center pl-3 active:opacity-60"
          >
            <Plus size={16} color={colors.ink} />
            <Text className="ml-1 text-[14px] font-medium text-ink">Add</Text>
          </Pressable>
        ) : (
          // Keeps the title on the same line height as a header with "Add".
          <View className="h-11" />
        )}
      </View>
    );
  }

  if (item.type === "booking") {
    const { booking } = item;
    if (!canEdit) return <BookingRow booking={booking} />;
    if (editing?.id !== booking.id) {
      return (
        <BookingRow
          booking={booking}
          onPress={() => onEdit({ kind: booking.kind, id: booking.id })}
        />
      );
    }
    return (
      <View className="mb-3">
        <BookingForm
          kind={booking.kind}
          booking={booking}
          tripStart={tripStart}
          tripEnd={tripEnd}
          onSave={(draft) => onSave(draft, booking)}
          onDelete={() => onDelete(booking)}
          onClose={() => onEdit(null)}
        />
      </View>
    );
  }

  const isAdding = canEdit && editing?.kind === item.kind && editing.id === "new";
  return (
    <View className="mb-5">
      {isAdding ? (
        <BookingForm
          kind={item.kind}
          booking={null}
          tripStart={tripStart}
          tripEnd={tripEnd}
          onSave={(draft) => onSave(draft, null)}
          onClose={() => onEdit(null)}
        />
      ) : item.isEmpty ? (
        <Text className="mb-2 text-[14px] leading-5 text-subtle">
          {canEdit ? SECTIONS[item.kind].empty : SECTIONS[item.kind].none}
        </Text>
      ) : null}
    </View>
  );
}
