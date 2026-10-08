import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { removeImage, uploadTripPhoto, type LocalImage } from "./storage";
import { supabase } from "./supabase";

export type TripPhoto = Pick<
  Tables<"trip_photos">,
  "id" | "image_path" | "caption" | "created_at"
>;

export interface PhotoListResult {
  success: boolean;
  data: TripPhoto[];
  error: string | null;
}

export interface PhotoResult {
  success: boolean;
  data: TripPhoto | null;
  error: string | null;
}

export interface PhotoDeleteResult {
  success: boolean;
  error: string | null;
}

const LOAD_FAILED = "We couldn't load this trip's photos. Please try again.";
const ADD_FAILED = "The photo could not be added. Please try again.";
const CAPTION_FAILED = "We couldn't save the caption. Please try again.";
const DELETE_FAILED = "We couldn't delete this photo. Please try again.";

const COLUMNS = "id, image_path, caption, created_at";

/** A trip's gallery, newest first. The cover is not part of it. */
export async function listPhotos(tripId: string): Promise<PhotoListResult> {
  try {
    const { data, error } = await supabase
      .from("trip_photos")
      .select(COLUMNS)
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: toReadableError("photos", error, LOAD_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("photos", error, LOAD_FAILED) };
  }
}

/**
 * Uploads the file, then writes its row. If the row fails the file is removed
 * again, so nothing is left in Storage that the gallery cannot show.
 */
export async function addPhoto(
  ownerId: string,
  tripId: string,
  image: LocalImage,
): Promise<PhotoResult> {
  const upload = await uploadTripPhoto(ownerId, tripId, image);
  if (!upload.success || !upload.data) {
    return { success: false, data: null, error: upload.error ?? ADD_FAILED };
  }

  try {
    const { data, error } = await supabase
      .from("trip_photos")
      .insert({ trip_id: tripId, image_path: upload.data })
      .select(COLUMNS)
      .single();

    if (error || !data) {
      await removeImage(upload.data);
      return {
        success: false,
        data: null,
        error: toReadableError("photos", error ?? "no row saved", ADD_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    await removeImage(upload.data);
    return { success: false, data: null, error: toReadableError("photos", error, ADD_FAILED) };
  }
}

/** Sets a photo's caption. An empty one clears it. */
export async function updatePhotoCaption(photoId: string, caption: string): Promise<PhotoResult> {
  try {
    const { data, error } = await supabase
      .from("trip_photos")
      .update({ caption: caption.trim() || null })
      .eq("id", photoId)
      .select(COLUMNS)
      .single();

    if (error || !data) {
      return {
        success: false,
        data: null,
        error: toReadableError("photos", error ?? "no row saved", CAPTION_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("photos", error, CAPTION_FAILED) };
  }
}

/**
 * Deletes the row, then the file. The row goes first so the gallery never
 * shows a photo whose file is gone. A file that could not be removed is logged
 * inside removeImage and goes with the trip when the trip is deleted.
 */
export async function deletePhoto(photo: TripPhoto): Promise<PhotoDeleteResult> {
  try {
    const { data, error } = await supabase
      .from("trip_photos")
      .delete()
      .eq("id", photo.id)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("photos", error ?? "no row deleted", DELETE_FAILED),
      };
    }
  } catch (error) {
    return { success: false, error: toReadableError("photos", error, DELETE_FAILED) };
  }

  await removeImage(photo.image_path);
  return { success: true, error: null };
}
