import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { removeImage, uploadAvatar, type LocalImage } from "./storage";
import { supabase } from "./supabase";

export type Profile = Pick<
  Tables<"profiles">,
  "id" | "email" | "full_name" | "avatar_url" | "avatar_path" | "interests"
>;

const PROFILE_COLUMNS = "id, email, full_name, avatar_url, avatar_path, interests";

/**
 * Every tag a traveller can pick, as stored. The database holds the same list
 * in a check, so a new tag needs a migration as well as a line here.
 */
export const INTERESTS = [
  "food",
  "nature",
  "architecture",
  "history",
  "art",
  "beaches",
  "hiking",
  "nightlife",
  "shopping",
  "museums",
  "family",
  "adventure",
] as const;

export const MAX_INTERESTS = 6;

/** "food" is shown as "Food". */
export function toInterestLabel(interest: string): string {
  return interest.charAt(0).toUpperCase() + interest.slice(1);
}

export interface ProfileResult {
  success: boolean;
  data: Profile | null;
  error: string | null;
}

/**
 * Row-level security already restricts this to the caller's own row; the
 * `eq` is for clarity, not for access control.
 */
export async function getProfile(userId: string): Promise<ProfileResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[profiles] load failed", error);
      return { success: false, data: null, error: "We couldn't load your profile." };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error("[profiles] load failed", error);
    return { success: false, data: null, error: "We couldn't load your profile." };
  }
}

export interface ProfileChanges {
  fullName: string;
  interests: string[];
  /** A newly picked picture, or null to leave the avatar as it is. */
  avatar: LocalImage | null;
}

export interface ProfileChangeResult {
  success: boolean;
  error: string | null;
  /** Set when the profile was saved but something smaller was not. */
  notice?: string;
}

const SAVE_FAILED = "Your profile could not be saved. Please try again.";
const AVATAR_NOT_SAVED = "Your profile was saved, but the picture could not be uploaded.";

/** Uploads the picture and points the row at it. Returns what went wrong, if anything. */
async function saveAvatar(profile: Profile, image: LocalImage): Promise<string | null> {
  const upload = await uploadAvatar(profile.id, image);
  if (!upload.success || !upload.data) return upload.error ?? AVATAR_NOT_SAVED;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: upload.data })
    .eq("id", profile.id);

  if (error) {
    console.error("[profiles] avatar path failed", error);
    await removeImage(upload.data);
    return AVATAR_NOT_SAVED;
  }

  // The row already points at the new file, so a leftover old one is only
  // wasted space. Its failure is logged inside removeImage and not shown.
  if (profile.avatar_path) await removeImage(profile.avatar_path);
  return null;
}

/**
 * Saves the name and the tags, then the picture. A picture that fails leaves
 * the rest saved and comes back as a `notice`.
 */
export async function updateProfile(
  profile: Profile,
  changes: ProfileChanges,
): Promise<ProfileChangeResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: changes.fullName.trim(),
        interests: changes.interests.length > 0 ? changes.interests : null,
      })
      .eq("id", profile.id)
      .select("id");

    if (error) {
      return { success: false, error: toReadableError("profiles", error, SAVE_FAILED) };
    }
    // No error and no row means row-level security let nothing through.
    if (data.length === 0) {
      console.error("[profiles] update matched no row", profile.id);
      return { success: false, error: SAVE_FAILED };
    }

    if (!changes.avatar) return { success: true, error: null };

    const avatarError = await saveAvatar(profile, changes.avatar);
    if (!avatarError) return { success: true, error: null };

    const notice =
      avatarError === AVATAR_NOT_SAVED ? avatarError : `${AVATAR_NOT_SAVED} ${avatarError}`;
    return { success: true, error: null, notice };
  } catch (error) {
    return { success: false, error: toReadableError("profiles", error, SAVE_FAILED) };
  }
}
