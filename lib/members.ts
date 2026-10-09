import { toReadableError } from "./errors";
import { supabase } from "./supabase";

/** What the signed-in traveller is on a trip. The owner is `trips.user_id`. */
export type TripRole = "owner" | "editor" | "viewer";

/** A member's role. The owner is never one of these. */
export type MemberRole = "editor" | "viewer";

/** One person on a trip, as `trip_people` returns them. Never an email. */
export interface TripPerson {
  id: string;
  name: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  role: TripRole;
  isYou: boolean;
}

export interface MemberRow {
  user_id: string;
  role: string;
}

export interface PeopleResult {
  success: boolean;
  data: TripPerson[];
  error: string | null;
}

export interface CodeResult {
  success: boolean;
  data: string | null;
  error: string | null;
}

export interface MemberChangeResult {
  success: boolean;
  error: string | null;
}

export interface JoinResult {
  success: boolean;
  /** The joined trip's id. */
  data: string | null;
  error: string | null;
}

export const JOIN_CODE_LENGTH = 8;

const ROLE_LABELS: Record<TripRole, string> = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "Can view",
};

const PEOPLE_FAILED = "We couldn't load who is on this trip. Please try again.";
const CODE_FAILED = "We couldn't load the join code. Please try again.";
const ROLE_FAILED = "We couldn't change that. Please try again.";
const REMOVE_FAILED = "We couldn't remove them from the trip. Please try again.";
const LEAVE_FAILED = "We couldn't take you off this trip. Please try again.";
const JOIN_FAILED = "We couldn't join the trip. Please try again.";
const CODE_REFUSED = "That code doesn't work. Check it with the person who shared it.";
const CODE_TOO_SHORT = "Enter the 8-character code.";

export function getRoleLabel(role: TripRole): string {
  return ROLE_LABELS[role];
}

function toRole(value: string): TripRole {
  return value === "owner" || value === "editor" ? value : "viewer";
}

/** The id of whoever is signed in, read from the stored session. */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** The caller's role on a trip they can read: its owner, or what their member row says. */
export function getTripRole(
  ownerId: string,
  members: MemberRow[],
  userId: string | null,
): TripRole {
  if (userId === ownerId) return "owner";
  return toRole(members.find((member) => member.user_id === userId)?.role ?? "viewer");
}

/** "JPN87X5K" as "JPN8-7X5K". */
export function formatJoinCode(code: string): string {
  return code.length === JOIN_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** What the traveller typed, without the dash, spaces, or lower case. */
export function cleanJoinCode(typed: string): string {
  return typed.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

/** Everyone on the trip, the owner first. Empty for someone who is not on it. */
export async function listTripPeople(tripId: string): Promise<PeopleResult> {
  try {
    const { data, error } = await supabase.rpc("trip_people", { p_trip_id: tripId });
    if (error) {
      return { success: false, data: [], error: toReadableError("members", error, PEOPLE_FAILED) };
    }
    const people = data.map((person) => ({
      id: person.id,
      name: person.full_name?.trim() || "Traveller",
      avatarPath: person.avatar_path,
      avatarUrl: person.avatar_url,
      role: toRole(person.role),
      isYou: person.is_you,
    }));
    return { success: true, data: people, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("members", error, PEOPLE_FAILED) };
  }
}

/** Makes a new code for the trip. The old one stops working. Owner only. */
export async function rotateJoinCode(tripId: string): Promise<CodeResult> {
  try {
    const { data, error } = await supabase.rpc("rotate_trip_code", { p_trip_id: tripId });
    if (error || !data) {
      return { success: false, data: null, error: toReadableError("members", error, CODE_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("members", error, CODE_FAILED) };
  }
}

/** The trip's code, made the first time it is asked for. Owner only. */
export async function getJoinCode(tripId: string): Promise<CodeResult> {
  try {
    const { data, error } = await supabase
      .from("trip_join_codes")
      .select("code")
      .eq("trip_id", tripId)
      .maybeSingle();

    if (error) {
      return { success: false, data: null, error: toReadableError("members", error, CODE_FAILED) };
    }
    if (data) return { success: true, data: data.code, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("members", error, CODE_FAILED) };
  }
  return rotateJoinCode(tripId);
}

/** Switches a member between viewer and editor. Owner only. */
export async function setMemberRole(
  tripId: string,
  userId: string,
  role: MemberRole,
): Promise<MemberChangeResult> {
  try {
    const { data, error } = await supabase
      .from("trip_members")
      .update({ role })
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .select("id");

    // No row back means row-level security refused the update.
    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("members", error ?? "no row updated", ROLE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("members", error, ROLE_FAILED) };
  }
}

async function deleteMember(
  tripId: string,
  userId: string,
  fallback: string,
): Promise<MemberChangeResult> {
  try {
    const { data, error } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId)
      .eq("user_id", userId)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("members", error ?? "no row deleted", fallback),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("members", error, fallback) };
  }
}

/** Takes someone off the trip. Owner only. */
export function removeMember(tripId: string, userId: string): Promise<MemberChangeResult> {
  return deleteMember(tripId, userId, REMOVE_FAILED);
}

/** Takes the signed-in traveller off a trip they joined. */
export async function leaveTrip(tripId: string): Promise<MemberChangeResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: LEAVE_FAILED };
  return deleteMember(tripId, userId, LEAVE_FAILED);
}

/**
 * Joins a trip as a viewer. The trip and its code cannot be read before this,
 * so the function is the only thing asked. A wrong code and a code for the
 * traveller's own trip are refused with the same sentence.
 */
export async function joinTrip(typed: string): Promise<JoinResult> {
  const code = cleanJoinCode(typed);
  if (code.length !== JOIN_CODE_LENGTH) {
    return { success: false, data: null, error: CODE_TOO_SHORT };
  }

  try {
    const { data, error } = await supabase.rpc("join_trip", { p_code: code });
    if (error?.code === "P0001") return { success: false, data: null, error: CODE_REFUSED };
    if (error || !data) {
      return { success: false, data: null, error: toReadableError("members", error, JOIN_FAILED) };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("members", error, JOIN_FAILED) };
  }
}
