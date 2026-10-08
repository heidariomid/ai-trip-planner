import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { supabase } from "./supabase";

export type TripNote = Pick<Tables<"trip_notes">, "id" | "body" | "created_at">;

export interface NoteListResult {
  success: boolean;
  data: TripNote[];
  error: string | null;
}

export interface NoteResult {
  success: boolean;
  data: TripNote | null;
  error: string | null;
}

export interface NoteDeleteResult {
  success: boolean;
  error: string | null;
}

const LOAD_FAILED = "We couldn't load this trip's notes. Please try again.";
const SAVE_FAILED = "We couldn't save this note. Please try again.";
const DELETE_FAILED = "We couldn't delete this note. Please try again.";

const COLUMNS = "id, body, created_at";

/** A trip's notes, newest first. */
export async function listNotes(tripId: string): Promise<NoteListResult> {
  try {
    const { data, error } = await supabase
      .from("trip_notes")
      .select(COLUMNS)
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: toReadableError("notes", error, LOAD_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("notes", error, LOAD_FAILED) };
  }
}

/** Adds a note, or saves over the one with `id`. */
export async function saveNote(
  tripId: string,
  body: string,
  id: string | null,
): Promise<NoteResult> {
  try {
    const table = supabase.from("trip_notes");
    const { data, error } = id
      ? await table.update({ body: body.trim() }).eq("id", id).select(COLUMNS).single()
      : await table.insert({ trip_id: tripId, body: body.trim() }).select(COLUMNS).single();

    if (error || !data) {
      return {
        success: false,
        data: null,
        error: toReadableError("notes", error ?? "no row saved", SAVE_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("notes", error, SAVE_FAILED) };
  }
}

export async function deleteNote(noteId: string): Promise<NoteDeleteResult> {
  try {
    const { data, error } = await supabase
      .from("trip_notes")
      .delete()
      .eq("id", noteId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("notes", error ?? "no row deleted", DELETE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("notes", error, DELETE_FAILED) };
  }
}
