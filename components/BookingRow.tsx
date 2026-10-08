import { Car, Hotel, Pencil, Plane, Ticket, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { Booking } from "../lib/bookings";
import {
  countDays,
  formatDate,
  formatDateRange,
  formatTime,
  pluralize,
  toTimeValue,
} from "../lib/dates";
import { colors } from "../lib/theme";
import type { BookingKind } from "../lib/validation";
import { Card } from "./Card";
import { Text } from "./Text";

export interface BookingRowProps {
  booking: Booking;
  /** Opens the row for editing. */
  onPress: () => void;
}

const ICONS: Record<BookingKind, LucideIcon> = {
  flight: Plane,
  car: Car,
  hotel: Hotel,
  extra: Ticket,
};

function timeText(value: string | null): string | null {
  const time = toTimeValue(value);
  return time ? formatTime(time) : null;
}

function joined(parts: (string | null)[], separator: string): string | null {
  const present = parts.filter((part): part is string => Boolean(part));
  return present.length > 0 ? present.join(separator) : null;
}

/** The bold line of a booking and the quiet lines under it. */
function describe(booking: Booking): { title: string; lines: (string | null)[] } {
  switch (booking.kind) {
    case "flight":
      return {
        title: `${booking.airline} · ${booking.flight_number}`,
        lines: [
          booking.departs_on ? formatDate(booking.departs_on) : null,
          joined([timeText(booking.departs_at), timeText(booking.arrives_at)], " → "),
        ],
      };
    case "car":
      return {
        title: booking.company,
        lines: [
          booking.pickup_location,
          joined(
            [
              booking.pickup_on ? formatDate(booking.pickup_on) : null,
              timeText(booking.pickup_at),
            ],
            " · ",
          ),
        ],
      };
    case "hotel": {
      const nights = countDays(booking.check_in, booking.check_out) - 1;
      return {
        title: booking.name,
        lines: [
          formatDateRange(booking.check_in, booking.check_out),
          nights > 0 ? pluralize(nights, "night") : null,
        ],
      };
    }
    case "extra":
      return { title: booking.title, lines: [booking.detail] };
  }
}

/** One saved booking. Tapping it opens it for editing. */
export function BookingRow({ booking, onPress }: BookingRowProps) {
  const Icon = ICONS[booking.kind];
  const { title, lines } = describe(booking);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${title}`}
      onPress={onPress}
      className="mb-3 active:opacity-80"
    >
      <Card>
        <View className="flex-row">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-canvas">
            <Icon size={18} color={colors.ink} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold leading-5 text-ink">{title}</Text>
            {lines.map((line, index) =>
              line ? (
                <Text key={index} className="mt-1 text-[14px] leading-5 text-subtle">
                  {line}
                </Text>
              ) : null,
            )}
          </View>
          <View className="h-10 w-8 items-end justify-center">
            <Pencil size={16} color={colors.muted} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
