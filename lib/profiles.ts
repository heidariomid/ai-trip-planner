import type { Tables } from "../types/database.types";
import { supabase } from "./supabase";

export type Profile = Pick<
  Tables<"profiles">,
  "id" | "email" | "full_name" | "avatar_url"
>;

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
      .select("id, email, full_name, avatar_url")
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
