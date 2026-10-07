import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { uploadTripCover, type LocalImage } from "./storage";
import { supabase } from "./supabase";

export type Trip = Pick<
  Tables<"trips">,
  "id" | "title" | "source" | "destination" | "start_date" | "end_date" | "image_path"
> & {
  /** From 0 to 1: the share of the trip's days that have at least one activity. */
  planningProgress: number;
};

interface DayActivityCount {
  itinerary_activities: { count: number }[];
}

// Spec 8 adds packed items to this. Until then a day with an activity is the
// only thing that counts as planned.
function getPlanningProgress(days: DayActivityCount[]): number {
  if (days.length === 0) return 0;
  const planned = days.filter((day) => (day.itinerary_activities[0]?.count ?? 0) > 0);
  return planned.length / days.length;
}

export interface NewTrip {
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  travelerCount: number;
  cover: LocalImage | null;
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
        "id, title, source, destination, start_date, end_date, image_path, itinerary_days(itinerary_activities(count))",
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

async function saveCover(userId: string, tripId: string, cover: LocalImage) {
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
