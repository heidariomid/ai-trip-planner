import { AuthError } from "@supabase/supabase-js";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match an account.",
  email_not_confirmed: "Confirm your email address before signing in.",
  user_already_exists: "An account with that email already exists. Sign in instead.",
  email_exists: "An account with that email already exists. Sign in instead.",
  weak_password: "That password is too weak. Use at least 6 characters.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  over_email_send_rate_limit: "Too many attempts. Wait a minute and try again.",
  validation_failed: "Check the details you entered and try again.",
};

const FALLBACK = "Something went wrong. Please try again.";
const OFFLINE = "No internet connection. Check your network and try again.";

/**
 * Turns anything thrown by a Supabase call into a sentence a traveller can act
 * on. The raw error is logged for us; it is never shown to them.
 */
export function toReadableAuthError(error: unknown): string {
  console.error("[auth]", error);

  if (error instanceof AuthError) {
    // A failed fetch has no code — only this name distinguishes "offline" from
    // "the server said no".
    if (error.name === "AuthRetryableFetchError") return OFFLINE;
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    return FALLBACK;
  }

  if (error instanceof TypeError && error.message.includes("Network request failed")) {
    return OFFLINE;
  }

  return FALLBACK;
}
