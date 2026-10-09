import { CalendarDays } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { useImageSource } from "../hooks/useImageSource";
import {
  countDays,
  formatDateRange,
  getTripStatus,
  pluralize,
} from "../lib/dates";
import { colors } from "../lib/theme";
import type { Trip } from "../lib/trips";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { Text } from "./Text";

export interface TripCardProps {
  trip: Trip;
  onPress: () => void;
}

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image, and the placeholder is one.
const COVER_SIZE = { width: 92, height: "100%", minHeight: 116 } as const;

/** A trip the traveller owns or was given, on Home and on My Trips. */
export function TripCard({ trip, onPress }: TripCardProps) {
  const cover = useImageSource(trip.image_path);
  const status = getTripStatus(trip.start_date, trip.end_date);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${trip.title}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card>
        <View className="flex-row">
          <View className="flex-1 justify-between pr-4">
            <View>
              <Text
                numberOfLines={2}
                className="text-[20px] font-semibold tracking-tight text-ink"
              >
                {trip.title}
              </Text>
              <Text numberOfLines={1} className="mt-1 text-[14px] text-subtle">
                {trip.source} to {trip.destination}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <View className="flex-row items-center">
                <CalendarDays size={14} color={colors.subtle} />
                <Text className="ml-1.5 text-[13px] font-medium text-ink">
                  {pluralize(countDays(trip.start_date, trip.end_date), "day")}
                </Text>
              </View>
              <Text className="text-[13px] text-subtle">
                {formatDateRange(trip.start_date, trip.end_date)}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {trip.status === "draft" ? (
                <Badge label="Draft" />
              ) : (
                <Badge label={status} highlighted={status === "Ongoing"} />
              )}
              {trip.role === "owner" ? null : <Badge label="Shared" />}
            </View>
          </View>

          <Image
            source={cover}
            resizeMode="cover"
            style={COVER_SIZE}
            className="rounded-2xl bg-canvas"
            accessible={false}
          />
        </View>

        {status === "Past" ? null : (
          <View className="mt-4">
            <ProgressBar label="Planning progress" value={trip.planningProgress} />
          </View>
        )}
      </Card>
    </Pressable>
  );
}
