import type { LocalImage } from "./storage";
import { supabase } from "./supabase";

// A cover drawn by the image model. The trip-cover Edge Function holds the
// model's key and the daily cap; this only asks it and reads the answer.

export interface CoverRequest {
  title: string;
  destination: string;
  description: string;
}

export interface GenerateCoverResult {
  success: boolean;
  /** The picture, held in memory until the trip is saved. */
  data: LocalImage | null;
  error: string | null;
  /** How many generations are left today, when the function said. */
  remaining: number | null;
}

const FAILED = "We couldn't create a cover this time. Try again, or choose a photo.";
const OFFLINE = "No internet connection. Check your network and try again.";

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}

/** The function's own answer behind a refusal, which carries its sentence. */
async function readRefusal(error: unknown): Promise<Record<string, unknown> | null> {
  const context: unknown = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;
  try {
    const body: unknown = await context.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** How many generations the traveller has left today, or null when unknown. */
export async function getCoversLeft(): Promise<number | null> {
  try {
    const { data, error } = await supabase.functions.invoke("trip-cover", {
      body: { check: true },
    });
    if (error) return null;
    return asCount((data as { remaining?: unknown } | null)?.remaining);
  } catch {
    return null;
  }
}

/** Asks for one cover. It uses one of today's generations even when it fails. */
export async function generateCover(trip: CoverRequest): Promise<GenerateCoverResult> {
  try {
    const { data, error } = await supabase.functions.invoke("trip-cover", { body: trip });

    if (error) {
      const refusal = await readRefusal(error);
      if (!refusal) return { success: false, data: null, error: OFFLINE, remaining: null };

      const sentence = typeof refusal.error === "string" ? refusal.error : FAILED;
      return { success: false, data: null, error: sentence, remaining: asCount(refusal.remaining) };
    }

    const answer = data as { image?: unknown; mime_type?: unknown; remaining?: unknown } | null;
    const remaining = asCount(answer?.remaining);
    if (typeof answer?.image !== "string" || answer.image.length === 0) {
      return { success: false, data: null, error: FAILED, remaining };
    }

    const mimeType = typeof answer.mime_type === "string" ? answer.mime_type : "image/jpeg";
    return {
      success: true,
      data: {
        // For the preview only. The upload reads `base64`, not this address.
        uri: `data:${mimeType};base64,${answer.image}`,
        mimeType,
        base64: answer.image,
      },
      error: null,
      remaining,
    };
  } catch (error) {
    console.error("[covers] generation failed", error);
    return { success: false, data: null, error: FAILED, remaining: null };
  }
}
