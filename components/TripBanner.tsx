import { ArrowLeft, CalendarDays, Ellipsis, Users } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { useImageSource } from "../hooks/useImageSource";
import { useIsWide } from "../hooks/useLayout";
import { countDays, formatDateRange, getTripStatus, pluralize } from "../lib/dates";
import { colors, shadows } from "../lib/theme";
import type { TripDetail } from "../lib/trip-detail";
import { Badge } from "./Badge";
import { RoundButton } from "./RoundButton";
import { Text } from "./Text";

export interface TripBannerProps {
  trip: TripDetail;
  onBack: () => void;
  /** Opens who the trip is shared with. */
  onShare: () => void;
  onOpenMenu: () => void;
}

// A style object, not classes: the placeholder is a bundled image, and on web
// a class does not override its intrinsic size.
const COVER_SIZE = { width: "100%", height: 200 } as const;
// A wider screen gives the cover more room, so it keeps its shape.
const WIDE_COVER_SIZE = { width: "100%", height: 320 } as const;

export function TripBanner({ trip, onBack, onShare, onOpenMenu }: TripBannerProps) {
  const cover = useImageSource(trip.image_path);
  const isWide = useIsWide();
  const status = getTripStatus(trip.start_date, trip.end_date);

  return (
    <View>
      <View>
        <Image
          source={cover}
          resizeMode="cover"
          style={isWide ? WIDE_COVER_SIZE : COVER_SIZE}
          className="rounded-card bg-canvas"
          accessible={false}
        />
        <View className="absolute left-3 right-3 top-3 flex-row justify-between">
          <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={onBack} />
          <View className="flex-row gap-2">
            {/* Not a RoundButton: it widens to hold the number of people. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Shared with, ${trip.peopleCount} ${
                trip.peopleCount === 1 ? "person" : "people"
              }`}
              onPress={onShare}
              style={shadows.soft}
              className="h-11 min-w-[44px] flex-row items-center justify-center rounded-full bg-surface px-3 active:bg-canvas"
            >
              <Users size={20} color={colors.ink} />
              {trip.peopleCount > 1 ? (
                <Text className="ml-1.5 text-[14px] font-semibold text-ink">
                  {trip.peopleCount}
                </Text>
              ) : null}
            </Pressable>
            <RoundButton icon={Ellipsis} accessibilityLabel="Trip options" onPress={onOpenMenu} />
          </View>
        </View>
      </View>

      <View className="mt-5 flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-[32px] font-bold leading-tight tracking-tight text-ink">
          {trip.title}
        </Text>
        <View className="mt-2 items-end gap-1.5">
          {trip.status === "draft" ? (
            <Badge label="Draft" />
          ) : (
            <Badge label={status} highlighted={status === "Ongoing"} />
          )}
          {trip.role === "owner" ? null : <Badge label="Shared" />}
        </View>
      </View>

      <Text className="mt-1 text-[15px] text-subtle">
        {trip.source} to {trip.destination}
      </Text>

      <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center">
          <CalendarDays size={14} color={colors.subtle} />
          <Text className="ml-1.5 text-[14px] font-medium text-ink">
            {pluralize(countDays(trip.start_date, trip.end_date), "day")}
          </Text>
        </View>
        <Text className="text-[14px] text-subtle">
          {formatDateRange(trip.start_date, trip.end_date)}
        </Text>
      </View>

      {trip.description ? (
        <Text className="mt-3 text-[15px] leading-5 text-ink">{trip.description}</Text>
      ) : null}
    </View>
  );
}
