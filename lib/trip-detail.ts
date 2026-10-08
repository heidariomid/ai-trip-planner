import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { removeImage, removeTripFiles } from "./storage";
import { supabase } from "./supabase";
import { saveCover, type NewTrip } from "./trips";

export type Activity = Pick<
  Tables<"itinerary_activities">,
  | "id"
  | "day_id"
  | "sort_order"
  | "starts_at"
  | "ends_at"
  | "place"
  | "activity"
  | "notes"
  | "is_done"
>;

export type ItineraryDay = Pick<Tables<"itinerary_days">, "id" | "day_number" | "date"> & {
  activities: Activity[];
};

export type TripDetail = Pick<
  Tables<"trips">,
  | "id"
  | "user_id"
  | "title"
  | "source"
  | "destination"
  | "start_date"
  | "end_date"
  | "image_path"
  | "description"
  | "traveler_count"
> & {
  days: ItineraryDay[];
};

export interface TripDetailResult {
  success: boolean;
  /** Null with `success` true means the trip does not exist for this traveller. */
  data: TripDetail | null;
  error: string | null;
}

export interface TripChangeResult {
  success: boolean;
  error: string | null;
  /** Set when the change was saved but something smaller was not. */
  notice?: string;
}

export interface DropCountResult {
  success: boolean;
  data: number;
  error: string | null;
}

const LOAD_FAILED = "We couldn't load this trip. Please try again.";
const SAVE_FAILED = "We couldn't save your changes. Please try again.";
const DATES_FAILED = "We couldn't change the dates, so nothing was saved. Please try again.";
const DETAILS_FAILED = "Your new dates are saved, but the other changes are not. Please try again.";
const COVER_NOT_SAVED = "Your changes are saved, but the new cover picture did not save.";
const FILES_FAILED = "The trip's pictures could not be removed, so the trip was not deleted.";
const ROW_FAILED =
  "The trip's pictures were removed, but the trip itself could not be deleted. Please try again.";

const TRIP_COLUMNS =
  "id, user_id, title, source, destination, start_date, end_date, image_path, description, traveler_count";
const ACTIVITY_COLUMNS =
  "id, day_id, sort_order, starts_at, ends_at, place, activity, notes, is_done";

/** By start time, with insert order settling a tie or a missing time. */
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    const byTime = (a.starts_at ?? "99").localeCompare(b.starts_at ?? "99");
    return byTime !== 0 ? byTime : a.sort_order - b.sort_order;
  });
}

/** Row-level security decides whether this traveller may read the trip at all. */
export async function getTripDetail(tripId: string): Promise<TripDetailResult> {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select(
        `${TRIP_COLUMNS}, itinerary_days(id, day_number, date, itinerary_activities(${ACTIVITY_COLUMNS}))`,
      )
      .eq("id", tripId)
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: toReadableError("trip", error, LOAD_FAILED) };
    }
    if (!data) return { success: true, data: null, error: null };

    const { itinerary_days, ...trip } = data;
    const days = itinerary_days
      .map(({ itinerary_activities, ...day }) => ({
        ...day,
        activities: sortActivities(itinerary_activities),
      }))
      .sort((a, b) => a.day_number - b.day_number);

    return { success: true, data: { ...trip, days }, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("trip", error, LOAD_FAILED) };
  }
}

/** How many days that have activities would fall outside the new dates. */
export async function countDaysToDrop(
  tripId: string,
  startDate: string,
  endDate: string,
): Promise<DropCountResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_days")
      .select("date, itinerary_activities(count)")
      .eq("trip_id", tripId);

    if (error) {
      return { success: false, data: 0, error: toReadableError("trip", error, SAVE_FAILED) };
    }

    const dropped = data.filter(
      (day) =>
        (day.itinerary_activities[0]?.count ?? 0) > 0 &&
        (!day.date || day.date < startDate || day.date > endDate),
    );
    return { success: true, data: dropped.length, error: null };
  } catch (error) {
    return { success: false, data: 0, error: toReadableError("trip", error, SAVE_FAILED) };
  }
}

async function saveDetails(tripId: string, changes: NewTrip): Promise<boolean> {
  const { data, error } = await supabase
    .from("trips")
    .update({
      title: changes.title,
      source: changes.source,
      destination: changes.destination,
      description: changes.description || null,
      traveler_count: changes.travelerCount,
    })
    .eq("id", tripId)
    .select("id");

  if (error) console.error("[trip] update failed", error);
  // No row back means row-level security refused the update.
  return !error && data.length > 0;
}

/**
 * Dates go first and through `reschedule_trip`, which changes them and rebuilds
 * the days in one transaction. The days are never rebuilt from the phone.
 */
export async function updateTrip(
  trip: TripDetail,
  changes: NewTrip,
  confirmDrop: boolean,
): Promise<TripChangeResult> {
  const datesChanged =
    changes.startDate !== trip.start_date || changes.endDate !== trip.end_date;

  try {
    if (datesChanged) {
      const { error } = await supabase.rpc("reschedule_trip", {
        p_trip_id: trip.id,
        p_start_date: changes.startDate,
        p_end_date: changes.endDate,
        p_confirm_drop: confirmDrop,
      });
      if (error) {
        return { success: false, error: toReadableError("trip", error, DATES_FAILED) };
      }
    }

    if (!(await saveDetails(trip.id, changes))) {
      return { success: false, error: datesChanged ? DETAILS_FAILED : SAVE_FAILED };
    }

    if (!changes.cover) return { success: true, error: null };

    const coverError = await saveCover(trip.user_id, trip.id, changes.cover);
    if (coverError) return { success: true, error: null, notice: COVER_NOT_SAVED };

    // The trip already points at the new file, so a leftover old one is only
    // wasted space. Its failure is logged inside removeImage and not shown.
    if (trip.image_path) await removeImage(trip.image_path);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("trip", error, SAVE_FAILED) };
  }
}

/**
 * Files first, then the row. If the files cannot be removed the trip stays
 * whole. The row cascades to its days and activities.
 */
export async function deleteTrip(trip: TripDetail): Promise<TripChangeResult> {
  const files = await removeTripFiles(trip.user_id, trip.id);
  if (!files.success) return { success: false, error: FILES_FAILED };

  try {
    const { data, error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip.id)
      .select("id");

    if (error || data.length === 0) {
      console.error("[trip] delete failed", error);
      return { success: false, error: ROW_FAILED };
    }
    return { success: true, error: null };
  } catch (error) {
    console.error("[trip] delete failed", error);
    return { success: false, error: ROW_FAILED };
  }
}
