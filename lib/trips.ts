import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { uploadTripCover, type LocalImage } from "./storage";
import { supabase } from "./supabase";

export type Trip = Pick<
  Tables<"trips">,
  "id" | "title" | "source" | "destination" | "start_date" | "end_date" | "image_path"
> & {
  /** From 0 to 1: the share of the trip's activities that are ticked off. */
  planningProgress: number;
};

interface DayActivityTicks {
  itinerary_activities: { is_done: boolean }[];
}

// Counted from ticks, not from how full the days are, so a trip copied from an
// explore plan starts at 0% instead of 100%. Spec 8 adds packed items to this.
function getPlanningProgress(days: DayActivityTicks[]): number {
  const activities = days.flatMap((day) => day.itinerary_activities);
  if (activities.length === 0) return 0;
  return activities.filter((activity) => activity.is_done).length / activities.length;
}

/**
 * One activity as `create_trip` reads it from `p_activities`. A type and not
 * an interface, because only a type alias can be passed where JSON is expected.
 */
export type NewTripActivity = {
  day_number: number;
  starts_at: string | null;
  ends_at: string | null;
  place: string | null;
  activity: string | null;
  notes: string | null;
};

export interface NewTrip {
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  travelerCount: number;
  cover: LocalImage | null;
  /** Written with the trip in the same transaction. Used by a copied plan. */
  activities?: NewTripActivity[];
}

export interface TripsResult {
  success: boolean;
  data: Trip[];
  error: string | null;
}

export interface CreateTripResult {
  success: boolean;
  /** The new trip's id. */
  data: string | null;
  error: string | null;
  /** Set when the trip was saved but its cover was not. */
  notice?: string;
}

const LOAD_FAILED = "We couldn't load your trips. Pull down to try again.";
const SAVE_FAILED = "We couldn't save your trip. Please try again.";
const COVER_NOT_SAVED = "Your trip is saved, but the cover picture did not save.";

/** Row-level security limits this to trips the caller may read. */
export async function listTrips(): Promise<TripsResult> {
  try {
    const { data, error } = await supabase
      .from("trips")
      .select(
        "id, title, source, destination, start_date, end_date, image_path, itinerary_days(itinerary_activities(is_done))",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: toReadableError("trips", error, LOAD_FAILED) };
    }
    const trips = data.map(({ itinerary_days, ...trip }) => ({
      ...trip,
      planningProgress: getPlanningProgress(itinerary_days),
    }));
    return { success: true, data: trips, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("trips", error, LOAD_FAILED) };
  }
}

/** Uploads a cover and points the trip at it. Resolves to a sentence on failure. */
export async function saveCover(userId: string, tripId: string, cover: LocalImage) {
  const upload = await uploadTripCover(userId, tripId, cover);
  if (!upload.success || !upload.data) return upload.error ?? COVER_NOT_SAVED;

  const { error } = await supabase
    .from("trips")
    .update({ image_path: upload.data })
    .eq("id", tripId);

  if (error) return toReadableError("trips", error, COVER_NOT_SAVED);
  return null;
}

/**
 * `create_trip` writes the trip and its days in one transaction, so an app
 * killed mid-save never leaves a trip with the wrong number of days. The cover
 * goes up afterwards because its path needs the trip id; if that step fails the
 * trip stays and the caller gets a `notice`.
 */
export async function createTrip(userId: string, trip: NewTrip): Promise<CreateTripResult> {
  let tripId: string;

  try {
    const { data, error } = await supabase.rpc("create_trip", {
      p_title: trip.title,
      p_source: trip.source,
      p_destination: trip.destination,
      p_start_date: trip.startDate,
      p_end_date: trip.endDate,
      p_description: trip.description || undefined,
      p_traveler_count: trip.travelerCount,
      p_activities: trip.activities,
    });

    if (error || !data) {
      return { success: false, data: null, error: toReadableError("trips", error, SAVE_FAILED) };
    }
    tripId = data;
  } catch (error) {
    return { success: false, data: null, error: toReadableError("trips", error, SAVE_FAILED) };
  }

  if (!trip.cover) return { success: true, data: tripId, error: null };

  let reason: string | null;
  try {
    reason = await saveCover(userId, tripId, trip.cover);
    if (!reason) return { success: true, data: tripId, error: null };
  } catch (error) {
    reason = toReadableError("trips", error, COVER_NOT_SAVED);
  }

  const notice = reason === COVER_NOT_SAVED ? reason : `${COVER_NOT_SAVED} ${reason}`;
  return { success: true, data: tripId, error: null, notice };
}
