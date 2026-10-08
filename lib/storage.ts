import type { ImageSourcePropType } from "react-native";

import { toReadableError } from "./errors";
import { supabase } from "./supabase";

const IMAGES_BUCKET = "images";
const SIGNED_URL_SECONDS = 60 * 60;
// A URL is signed again a little before it runs out, so an image that is
// already on screen does not break mid-session.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/** What every private image falls back to: no path, or a signature that failed. */
export const PLACEHOLDER_IMAGE: ImageSourcePropType = require("../assets/placeholder.png");

export interface LocalImage {
  uri: string;
  mimeType: string | null | undefined;
  fileSize?: number | null;
}

export interface UploadResult {
  success: boolean;
  data: string | null;
  error: string | null;
}

const signedUrls = new Map<string, { url: string; expiresAt: number }>();

/**
 * The one way a screen shows a private image. Given a Storage path it returns
 * a short-lived signed URL; given null, or when signing fails, it returns the
 * shared placeholder.
 */
export async function getImageSource(
  path: string | null | undefined,
): Promise<ImageSourcePropType> {
  if (!path) return PLACEHOLDER_IMAGE;

  const cached = signedUrls.get(path);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return { uri: cached.url };
  }

  try {
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("[storage] sign failed", path, error);
      return PLACEHOLDER_IMAGE;
    }

    signedUrls.set(path, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000,
    });
    return { uri: data.signedUrl };
  } catch (error) {
    console.error("[storage] sign failed", path, error);
    return PLACEHOLDER_IMAGE;
  }
}

/**
 * The one upload path. Puts an image at `{folder}/{name}.{ext}` and returns
 * the path. A trip's folder is `{owner_id}/{trip_id}`, where the owner is the
 * trip's `user_id` and not whoever is signed in. An avatar's is
 * `{user_id}/avatar`.
 */
async function uploadImage(
  folder: string,
  name: string,
  image: LocalImage,
): Promise<UploadResult> {
  const contentType = image.mimeType ?? "image/jpeg";
  const extension = EXTENSIONS[contentType];

  if (!extension) {
    return {
      success: false,
      data: null,
      error: "That image type is not supported. Use a JPEG, PNG, or WebP picture.",
    };
  }
  if (image.fileSize && image.fileSize > MAX_IMAGE_BYTES) {
    return {
      success: false,
      data: null,
      error: "That picture is larger than 10 MB. Choose a smaller one.",
    };
  }

  const path = `${folder}/${name}.${extension}`;

  try {
    // An ArrayBuffer rather than a Blob: a Blob built from a file URI uploads
    // as zero bytes on React Native.
    const response = await fetch(image.uri);
    const body = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, body, { contentType });

    if (error) {
      return {
        success: false,
        data: null,
        error: toReadableError("storage", error, "The picture could not be uploaded."),
      };
    }
    return { success: true, data: path, error: null };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: toReadableError("storage", error, "The picture could not be uploaded."),
    };
  }
}

/**
 * Uploads a trip's cover as `cover-{time}`. The name is new every time, so a
 * replaced cover is never served from a cache that still holds the old picture.
 */
export function uploadTripCover(
  ownerId: string,
  tripId: string,
  image: LocalImage,
): Promise<UploadResult> {
  return uploadImage(`${ownerId}/${tripId}`, `cover-${Date.now()}`, image);
}

/** Uploads a gallery photo as `photo-{time}-{random}`, beside the cover. */
export function uploadTripPhoto(
  ownerId: string,
  tripId: string,
  image: LocalImage,
): Promise<UploadResult> {
  const suffix = Math.random().toString(36).slice(2, 8);
  return uploadImage(`${ownerId}/${tripId}`, `photo-${Date.now()}-${suffix}`, image);
}

/**
 * Uploads the signed-in user's avatar as `avatar-{time}`, in their own
 * `avatar` folder. A new name every time, for the same reason as a cover.
 */
export function uploadAvatar(userId: string, image: LocalImage): Promise<UploadResult> {
  return uploadImage(`${userId}/avatar`, `avatar-${Date.now()}`, image);
}

export interface RemoveResult {
  success: boolean;
  error: string | null;
}

const REMOVE_FAILED = "The trip's pictures could not be removed.";
const LIST_PAGE_SIZE = 100;

/** Removes one file. Used when a cover or an avatar is replaced. */
export async function removeImage(path: string): Promise<RemoveResult> {
  try {
    const { error } = await supabase.storage.from(IMAGES_BUCKET).remove([path]);
    signedUrls.delete(path);
    if (error) {
      return { success: false, error: toReadableError("storage", error, REMOVE_FAILED) };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("storage", error, REMOVE_FAILED) };
  }
}

/**
 * Removes everything under `{owner_id}/{trip_id}/`. The owner is the trip's
 * `user_id`, not whoever is signed in.
 */
export async function removeTripFiles(ownerId: string, tripId: string): Promise<RemoveResult> {
  const folder = `${ownerId}/${tripId}`;

  try {
    const bucket = supabase.storage.from(IMAGES_BUCKET);

    // A list returns one page. A gallery can hold more than that, so the first
    // page is read and removed until the folder is empty.
    for (;;) {
      const { data: files, error: listError } = await bucket.list(folder, {
        limit: LIST_PAGE_SIZE,
      });
      if (listError) {
        return { success: false, error: toReadableError("storage", listError, REMOVE_FAILED) };
      }
      if (files.length === 0) return { success: true, error: null };

      const paths = files.map((file) => `${folder}/${file.name}`);
      const { data: removed, error } = await bucket.remove(paths);
      paths.forEach((path) => signedUrls.delete(path));
      // Nothing removed and no error means the files were not ours to remove.
      // Stopping here keeps the loop from reading the same page for ever.
      if (error || removed.length === 0) {
        return {
          success: false,
          error: toReadableError("storage", error ?? "no file removed", REMOVE_FAILED),
        };
      }
      if (files.length < LIST_PAGE_SIZE) return { success: true, error: null };
    }
  } catch (error) {
    return { success: false, error: toReadableError("storage", error, REMOVE_FAILED) };
  }
}
