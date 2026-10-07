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

/** Uploads a picked image to `{user_id}/{trip_id}/cover.{ext}` and returns the path. */
export async function uploadTripCover(
  userId: string,
  tripId: string,
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

  const path = `${userId}/${tripId}/cover.${extension}`;

  try {
    // An ArrayBuffer rather than a Blob: a Blob built from a file URI uploads
    // as zero bytes on React Native.
    const response = await fetch(image.uri);
    const body = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, body, { contentType, upsert: true });

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
