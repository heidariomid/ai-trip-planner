import { ArrowUpRight, Check, MapPin, Pencil } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { formatTime, toTimeValue } from "../lib/dates";
import { openInMaps } from "../lib/maps";
import { colors } from "../lib/theme";
import type { Activity } from "../lib/trip-detail";
import { Text } from "./Text";

export interface ActivityRowProps {
  activity: Activity;
  /** The trip's destination, added to the place when it is opened in Maps. */
  destination: string;
  isLast: boolean;
  /** Opens the row for editing. Left out, the row is read-only. */
  onPress?: () => void;
  /** Ticks the activity off or clears the tick. Left out, there is no tick. */
  onToggleDone?: () => void;
}

/**
 * One stop on the day's timeline. Tapping it opens it for editing; tapping the
 * place opens that place in Google Maps instead. A read-only row keeps the
 * Maps link and loses the rest.
 */
export function ActivityRow({
  activity,
  destination,
  isLast,
  onPress,
  onToggleDone,
}: ActivityRowProps) {
  const place = activity.place;
  const startsAt = toTimeValue(activity.starts_at);
  const endsAt = toTimeValue(activity.ends_at);

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Edit ${activity.activity ?? "activity"}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="flex-row"
    >
      <View className="w-[76px] pt-0.5">
        <Text className="text-[14px] font-semibold text-ink">
          {startsAt ? formatTime(startsAt) : "Any time"}
        </Text>
        {endsAt ? (
          <Text className="mt-0.5 text-[13px] text-subtle">{formatTime(endsAt)}</Text>
        ) : null}
      </View>

      <View className="mr-3 items-center">
        {onToggleDone ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Done: ${activity.activity ?? "activity"}`}
            accessibilityState={{ checked: activity.is_done }}
            hitSlop={12}
            onPress={onToggleDone}
            className={`h-6 w-6 items-center justify-center rounded-full border ${
              activity.is_done ? "border-accent bg-accent" : "border-muted bg-surface"
            }`}
          >
            {activity.is_done ? <Check size={14} color={colors.surface} /> : null}
          </Pressable>
        ) : (
          <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-muted" />
        )}
        {isLast ? null : <View className="mt-1 w-px flex-1 bg-line" />}
      </View>

      <View className="flex-1 pb-6">
        <Text
          className={`text-[15px] font-semibold leading-5 ${
            activity.is_done ? "text-subtle line-through" : "text-ink"
          }`}
        >
          {activity.activity}
        </Text>
        {place ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${place} in Maps`}
            hitSlop={10}
            onPress={() => void openInMaps(place, destination)}
            className="mt-1 flex-row items-center self-start active:opacity-60"
          >
            <MapPin size={13} color={colors.ink} />
            <Text className="ml-1 shrink text-[14px] font-medium text-ink">{place}</Text>
            <ArrowUpRight size={14} color={colors.subtle} />
          </Pressable>
        ) : null}
        {activity.notes ? (
          <Text className="mt-1 text-[14px] leading-5 text-subtle">{activity.notes}</Text>
        ) : null}
      </View>

      {onPress ? (
        <View className="h-11 w-11 items-end justify-start pt-1">
          <Pencil size={16} color={colors.muted} />
        </View>
      ) : null}
    </Pressable>
  );
}
