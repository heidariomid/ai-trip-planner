import { toReadableError } from "./errors";
import { supabase } from "./supabase";
import type { Activity } from "./trip-detail";
import type { ActivityFields } from "./validation";

export interface ActivityResult {
  success: boolean;
  data: Activity | null;
  error: string | null;
}

export interface ActivityDeleteResult {
  success: boolean;
  error: string | null;
}

const SAVE_FAILED = "We couldn't save this activity. Please try again.";
const DELETE_FAILED = "We couldn't delete this activity. Please try again.";
const SAVE_MANY_FAILED = "We couldn't add these activities. Please try again.";
const TICK_FAILED = "We couldn't update that activity. Please try again.";

const COLUMNS = "id, day_id, sort_order, starts_at, ends_at, place, activity, notes, is_done";

function toColumns(fields: ActivityFields) {
  return {
    starts_at: fields.startsAt,
    ends_at: fields.endsAt,
    place: fields.place.trim() || null,
    activity: fields.activity.trim(),
    notes: fields.notes.trim() || null,
  };
}

function failed(error: unknown): ActivityResult {
  return { success: false, data: null, error: toReadableError("itinerary", error, SAVE_FAILED) };
}

export async function createActivity(
  dayId: string,
  sortOrder: number,
  fields: ActivityFields,
): Promise<ActivityResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_activities")
      .insert({ day_id: dayId, sort_order: sortOrder, ...toColumns(fields) })
      .select(COLUMNS)
      .single();

    if (error) return failed(error);
    return { success: true, data, error: null };
  } catch (error) {
    return failed(error);
  }
}

export async function updateActivity(
  activityId: string,
  fields: ActivityFields,
): Promise<ActivityResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_activities")
      .update(toColumns(fields))
      .eq("id", activityId)
      .select(COLUMNS)
      .single();

    if (error) return failed(error);
    return { success: true, data, error: null };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteActivity(activityId: string): Promise<ActivityDeleteResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_activities")
      .delete()
      .eq("id", activityId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("itinerary", error ?? "no row deleted", DELETE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("itinerary", error, DELETE_FAILED) };
  }
}

/** Ticks an activity off, or clears the tick. A trip's progress counts these. */
export async function setActivityDone(
  activityId: string,
  isDone: boolean,
): Promise<ActivityDeleteResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_activities")
      .update({ is_done: isDone })
      .eq("id", activityId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("itinerary", error ?? "no row updated", TICK_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("itinerary", error, TICK_FAILED) };
  }
}

/** One activity to add to a day, as a card in the chat proposes it. */
export interface NewActivity {
  /** `HH:MM`, or null. */
  startsAt: string | null;
  place: string | null;
  activity: string;
}

/**
 * Adds several activities to one day in a single insert, after the ones
 * already there. One statement, so the day is never left half written.
 */
export async function addActivities(
  dayId: string,
  firstSortOrder: number,
  activities: NewActivity[],
): Promise<ActivityDeleteResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_activities")
      .insert(
        activities.map((item, index) => ({
          day_id: dayId,
          sort_order: firstSortOrder + index,
          starts_at: item.startsAt,
          place: item.place,
          activity: item.activity,
        })),
      )
      .select("id");

    // Fewer rows back than sent means row-level security refused the insert.
    if (error || data.length !== activities.length) {
      return {
        success: false,
        error: toReadableError("itinerary", error ?? "not every row saved", SAVE_MANY_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("itinerary", error, SAVE_MANY_FAILED) };
  }
}

