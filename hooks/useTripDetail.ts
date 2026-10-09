import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  createActivity,
  deleteActivity,
  setActivityDone,
  updateActivity,
} from "../lib/itinerary";
import {
  activateTrip,
  deleteTrip,
  getTripDetail,
  sortActivities,
  type Activity,
  type ItineraryDay,
  type TripDetail,
} from "../lib/trip-detail";
import type { ActivityFields } from "../lib/validation";

export interface UseTripDetailResult {
  trip: TripDetail | null;
  isLoading: boolean;
  /** The trip loaded as nothing: deleted, or not this traveller's to see. */
  isMissing: boolean;
  error: string | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  saveActivity: (
    day: ItineraryDay,
    fields: ActivityFields,
    existing: Activity | null,
  ) => Promise<string | null>;
  removeActivity: (activity: Activity) => Promise<string | null>;
  /** Ticks an activity off, or clears the tick. */
  toggleActivity: (activity: Activity) => Promise<string | null>;
  /** Deletes the trip and its files. */
  removeTrip: () => Promise<string | null>;
  /** Moves a draft into the traveller's trips. */
  activate: () => Promise<string | null>;
}

function withActivities(
  trip: TripDetail,
  dayId: string,
  change: (activities: Activity[]) => Activity[],
): TripDetail {
  return {
    ...trip,
    days: trip.days.map((day) =>
      day.id === dayId ? { ...day, activities: sortActivities(change(day.activities)) } : day,
    ),
  };
}

/** One trip with its days and activities, read again when the screen gains focus. */
export function useTripDetail(tripId: string): UseTripDetailResult {
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void getTripDetail(tripId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the trip already on screen.
        if (result.success) {
          setTrip(result.data);
          setIsMissing(result.data === null);
        }
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const saveActivity = useCallback<UseTripDetailResult["saveActivity"]>(
    async (day, fields, existing) => {
      const nextOrder = day.activities.reduce(
        (highest, item) => Math.max(highest, item.sort_order + 1),
        0,
      );
      const result = existing
        ? await updateActivity(existing.id, fields)
        : await createActivity(day.id, nextOrder, fields);

      const saved = result.data;
      if (!result.success || !saved) return result.error ?? "We couldn't save this activity.";

      setTrip((current) =>
        current
          ? withActivities(current, day.id, (activities) => [
              ...activities.filter((item) => item.id !== saved.id),
              saved,
            ])
          : current,
      );
      return null;
    },
    [],
  );

  const removeActivity = useCallback<UseTripDetailResult["removeActivity"]>(
    async (activity) => {
      const result = await deleteActivity(activity.id);
      if (!result.success) return result.error;

      setTrip((current) =>
        current
          ? withActivities(current, activity.day_id, (activities) =>
              activities.filter((item) => item.id !== activity.id),
            )
          : current,
      );
      return null;
    },
    [],
  );

  const toggleActivity = useCallback<UseTripDetailResult["toggleActivity"]>(
    async (activity) => {
      const setDone = (isDone: boolean) =>
        setTrip((current) =>
          current
            ? withActivities(current, activity.day_id, (activities) =>
                activities.map((item) =>
                  item.id === activity.id ? { ...item, is_done: isDone } : item,
                ),
              )
            : current,
        );

      // The tick moves at once and goes back if the save fails.
      setDone(!activity.is_done);
      const result = await setActivityDone(activity.id, !activity.is_done);
      if (!result.success) setDone(activity.is_done);
      return result.error;
    },
    [],
  );

  const activate = useCallback<UseTripDetailResult["activate"]>(async () => {
    if (!trip) return null;
    const result = await activateTrip(trip.id);
    if (!result.success) return result.error;
    setTrip((current) => (current ? { ...current, status: "active" } : current));
    return null;
  }, [trip]);

  const removeTrip = useCallback<UseTripDetailResult["removeTrip"]>(async () => {
    if (!trip) return null;
    const result = await deleteTrip(trip);
    return result.success ? null : result.error;
  }, [trip]);

  return {
    trip,
    isLoading,
    isMissing,
    error,
    saveActivity,
    removeActivity,
    toggleActivity,
    removeTrip,
    activate,
  };
}
