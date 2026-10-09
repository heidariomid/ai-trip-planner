import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { supabase } from "./supabase";

export type SavedPlace = Pick<
  Tables<"saved_places">,
  "id" | "name" | "label" | "city" | "created_at"
>;

/** What a place card knows about a place when its heart is tapped. */
export interface PlaceToSave {
  name: string;
  label: string;
  city: string;
}

export interface SavedPlaceListResult {
  success: boolean;
  data: SavedPlace[];
  error: string | null;
}

export interface SavedPlaceResult {
  success: boolean;
  data: SavedPlace | null;
  error: string | null;
}

export interface SavedPlaceChangeResult {
  success: boolean;
  error: string | null;
}

// The column limits in 0019_saved_places.sql.
const MAX_NAME_LENGTH = 80;
const MAX_LABEL_LENGTH = 160;
const MAX_CITY_LENGTH = 120;

const UNIQUE_VIOLATION = "23505";

const LOAD_FAILED = "We couldn't load your saved places. Please try again.";
const SAVE_FAILED = "We couldn't save this place. Please try again.";
const REMOVE_FAILED = "We couldn't remove this place. Please try again.";

const COLUMNS = "id, name, label, city, created_at";

/**
 * One place, however it is capitalised: the table is unique on the lowercased
 * name and city, so the same name in two cities is two places.
 */
export function getSavedPlaceKey(name: string, city: string): string {
  return `${name.trim().toLowerCase()}\n${city.trim().toLowerCase()}`;
}

function toRow(place: PlaceToSave) {
  return {
    name: place.name.trim().slice(0, MAX_NAME_LENGTH).trim(),
    label: place.label.trim().slice(0, MAX_LABEL_LENGTH).trim(),
    city: place.city.trim().slice(0, MAX_CITY_LENGTH).trim(),
  };
}

/** Newest first. */
export async function listSavedPlaces(): Promise<SavedPlaceListResult> {
  try {
    const { data, error } = await supabase
      .from("saved_places")
      .select(COLUMNS)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: toReadableError("saved", error, LOAD_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("saved", error, LOAD_FAILED) };
  }
}

/** The row already saved for this place, when a second save ran into it. */
async function findSavedPlace(name: string, city: string): Promise<SavedPlace | null> {
  const { data } = await supabase.from("saved_places").select(COLUMNS);
  const key = getSavedPlaceKey(name, city);
  return data?.find((row) => getSavedPlaceKey(row.name, row.city) === key) ?? null;
}

/** Saves a place. One that is already saved comes back as it is, not as a failure. */
export async function savePlace(place: PlaceToSave): Promise<SavedPlaceResult> {
  try {
    const row = toRow(place);
    if (!row.name) return { success: false, data: null, error: SAVE_FAILED };

    const { data, error } = await supabase
      .from("saved_places")
      .insert(row)
      .select(COLUMNS)
      .single();

    if (error?.code === UNIQUE_VIOLATION) {
      const existing = await findSavedPlace(row.name, row.city);
      if (existing) return { success: true, data: existing, error: null };
    }
    if (error || !data) {
      return {
        success: false,
        data: null,
        error: toReadableError("saved", error ?? "no row saved", SAVE_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("saved", error, SAVE_FAILED) };
  }
}

export async function removeSavedPlace(id: string): Promise<SavedPlaceChangeResult> {
  try {
    const { error } = await supabase.from("saved_places").delete().eq("id", id);
    if (error) {
      return { success: false, error: toReadableError("saved", error, REMOVE_FAILED) };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("saved", error, REMOVE_FAILED) };
  }
}
