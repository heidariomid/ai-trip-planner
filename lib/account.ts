import { supabase } from "./supabase";

// Deleting the account. The delete-account Edge Function holds the secret key
// and removes the files and the user; this asks it and then drops the session
// this device still holds.

export interface DeleteAccountResult {
  success: boolean;
  error: string | null;
}

const FAILED = "We couldn't delete your account. Try again.";
const OFFLINE = "No internet connection. Check your network and try again.";

/** The function's own sentence behind a refusal, when it sent one. */
async function readRefusal(error: unknown): Promise<string | null> {
  const context: unknown = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;
  try {
    const body: unknown = await context.json();
    const sentence = (body as { error?: unknown } | null)?.error;
    return typeof sentence === "string" ? sentence : FAILED;
  } catch {
    return FAILED;
  }
}

/**
 * Deletes the signed-in traveller's account with everything that belongs to
 * it. It cannot be undone. On success the session is gone from this device
 * and the route guard shows Sign In.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error) {
      console.error("[account] delete failed", error);
      return { success: false, error: (await readRefusal(error)) ?? OFFLINE };
    }

    // Local only: the server no longer knows this user, so a normal sign-out
    // would be refused and leave the dead session on the device.
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) console.error("[account] local sign-out failed", signOutError);
    return { success: true, error: null };
  } catch (error) {
    console.error("[account] delete failed", error);
    return { success: false, error: FAILED };
  }
}
