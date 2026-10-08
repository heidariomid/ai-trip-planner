import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { supabase } from "./supabase";
import type { PackingFields } from "./validation";

export type PackingItem = Pick<
  Tables<"packing_items">,
  "id" | "category" | "label" | "is_packed" | "created_at"
>;

export interface PackingListResult {
  success: boolean;
  data: PackingItem[];
  error: string | null;
}

export interface PackingItemResult {
  success: boolean;
  data: PackingItem | null;
  error: string | null;
}

export interface PackingChangeResult {
  success: boolean;
  error: string | null;
}

const LOAD_FAILED = "We couldn't load this trip's packing list. Please try again.";
const SAVE_FAILED = "We couldn't save this item. Please try again.";
const DELETE_FAILED = "We couldn't delete this item. Please try again.";
const TICK_FAILED = "We couldn't update that item. Please try again.";

const COLUMNS = "id, category, label, is_packed, created_at";

/** Oldest first, so a new item lands at the end of its category. */
export function sortPackingItems(items: PackingItem[]): PackingItem[] {
  return [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function listPackingItems(tripId: string): Promise<PackingListResult> {
  try {
    const { data, error } = await supabase
      .from("packing_items")
      .select(COLUMNS)
      .eq("trip_id", tripId)
      .order("created_at");

    if (error) {
      return { success: false, data: [], error: toReadableError("packing", error, LOAD_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("packing", error, LOAD_FAILED) };
  }
}

/** Adds an item, or saves over the one with `id`. */
export async function savePackingItem(
  tripId: string,
  fields: PackingFields,
  id: string | null,
): Promise<PackingItemResult> {
  try {
    const values = { category: fields.category.trim(), label: fields.label.trim() };
    const table = supabase.from("packing_items");
    const { data, error } = id
      ? await table.update(values).eq("id", id).select(COLUMNS).single()
      : await table.insert({ trip_id: tripId, ...values }).select(COLUMNS).single();

    if (error || !data) {
      return {
        success: false,
        data: null,
        error: toReadableError("packing", error ?? "no row saved", SAVE_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("packing", error, SAVE_FAILED) };
  }
}

/** Marks an item packed, or clears the mark. A trip's progress counts these. */
export async function setPackingItemPacked(
  itemId: string,
  isPacked: boolean,
): Promise<PackingChangeResult> {
  try {
    const { data, error } = await supabase
      .from("packing_items")
      .update({ is_packed: isPacked })
      .eq("id", itemId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("packing", error ?? "no row updated", TICK_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("packing", error, TICK_FAILED) };
  }
}

export async function deletePackingItem(itemId: string): Promise<PackingChangeResult> {
  try {
    const { data, error } = await supabase
      .from("packing_items")
      .delete()
      .eq("id", itemId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("packing", error ?? "no row deleted", DELETE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("packing", error, DELETE_FAILED) };
  }
}
