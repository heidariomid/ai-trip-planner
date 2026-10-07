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

const COLUMNS = "id, day_id, sort_order, starts_at, ends_at, place, activity, notes";

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
