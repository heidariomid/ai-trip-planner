import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { toReadableAuthError } from "./auth-errors";
import { supabase } from "./supabase";
import { recordSignUp } from "./traffic";

WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  /** A sentence to show the traveller, or null when there is nothing to say. */
  error: string | null;
  /** Set when the call worked but the traveller still has something to do. */
  notice?: string;
  /**
   * The reset code was accepted, so a session exists, but the new password
   * was not saved. Home stays closed until a later save succeeds.
   */
  recoveryPending?: boolean;
}

const ok: AuthResult = { success: true, error: null };

const RESET_NOTICE = "If an account exists for that email, we sent a 6-digit code.";

// Set before verifyOtp returns. verifyOtp creates a session at once, and the
// route guard has to stay on the reset screen until the new password is saved.
const RECOVERY_HOLD_KEY = "password-recovery-hold";
let passwordRecoveryOpen = false;

export function isPasswordRecoveryOpen(): boolean {
  return passwordRecoveryOpen;
}

export async function readPasswordRecoveryHold(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RECOVERY_HOLD_KEY)) === "1";
  } catch {
    return passwordRecoveryOpen;
  }
}

export async function openPasswordRecovery(): Promise<void> {
  passwordRecoveryOpen = true;
  try {
    await AsyncStorage.setItem(RECOVERY_HOLD_KEY, "1");
  } catch {
    // The in-memory flag still covers this visit.
  }
}

export async function closePasswordRecovery(): Promise<void> {
  passwordRecoveryOpen = false;
  try {
    await AsyncStorage.removeItem(RECOVERY_HOLD_KEY);
  } catch {
    // The in-memory flag is already clear.
  }
}

function failed(error: unknown): AuthResult {
  return { success: false, error: toReadableAuthError(error) };
}

export async function signUpWithEmail(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    // options.data lands in raw_user_meta_data, which the on_auth_user_created
    // trigger reads to fill the profiles row.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return failed(error);

    // With confirmation on there is no session yet, so Home must not open.
    // The route guard only moves on when a session exists.
    if (!data.session) {
      return {
        success: true,
        error: null,
        notice: "Account created. Check your email, then sign in.",
      };
    }

    // The session is already on the client, so this call is signed in.
    // It does not run for an address that already has an account.
    void recordSignUp();
    return ok;
  } catch (error) {
    return failed(error);
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    // The same sentence either way, so the screen does not reveal whether
    // the address has an account.
    if (error && error.code !== "user_not_found") return failed(error);
    return { success: true, error: null, notice: RESET_NOTICE };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Accepts the reset code, then saves the new password. The code check creates
 * a session immediately. On a password failure the hold stays open so Home
 * does not show, and the caller can save again without a new code.
 */
export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<AuthResult> {
  try {
    await openPasswordRecovery();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "recovery",
    });
    if (error) {
      await closePasswordRecovery();
      return failed(error);
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) return { ...failed(updateError), recoveryPending: true };
    return ok;
  } catch (error) {
    await closePasswordRecovery();
    return failed(error);
  }
}

/** Saves a new password after the reset code was already accepted. */
export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ...failed(error), recoveryPending: true };
    return ok;
  } catch (error) {
    return { ...failed(error), recoveryPending: true };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return failed(error);
    return ok;
  } catch (error) {
    return failed(error);
  }
}

/**
 * Where Google / Supabase should send the traveller after consent.
 *
 * Web uses the page origin (`http://localhost:8081` in dev).
 *
 * Native cannot use `makeRedirectUri()` / `exp://<LAN-IP>:8081/--/`.
 * GoTrue rejects any redirect whose hostname is a non-loopback IP
 * (supabase/auth#2039) *before* it reads the allow list, then falls
 * back to Site URL — `http://localhost:8081`. Safari on the phone
 * tries to open localhost and dies. A custom scheme has no IP host,
 * matches `aitripplanner://**`, and `openAuthSessionAsync` intercepts
 * it without Expo Go needing the scheme registered.
 */
function oauthRedirectTo(): string {
  if (Platform.OS === "web") return makeRedirectUri();
  return "aitripplanner://google-auth";
}

/**
 * Browser-based Google OAuth, so it still works in Expo Go. The native
 * google-signin module would need a development build.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectTo = oauthRedirectTo();

    // On web, openAuthSessionAsync is a window.open() that popup blockers
    // reject because it runs after an await rather than inside the click.
    // Navigate the whole page instead and let detectSessionInUrl read the
    // tokens back when Google returns.
    if (Platform.OS === "web") {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) return failed(error);
      return ok;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return failed(error);
    if (!data.url) return failed(new Error("Google sign-in returned no URL"));

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") {
      return { success: false, error: null };
    }

    return await createSessionFromUrl(result.url);
  } catch (error) {
    return failed(error);
  }
}

/** Reads the tokens off an OAuth redirect and installs them as the session. */
export async function createSessionFromUrl(url: string): Promise<AuthResult> {
  try {
    const { params, errorCode } = QueryParams.getQueryParams(url);
    if (errorCode) return failed(new Error(errorCode));

    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    if (!accessToken || !refreshToken) return { success: false, error: null };

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return failed(error);
    return ok;
  } catch (error) {
    return failed(error);
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return failed(error);
    return ok;
  } catch (error) {
    return failed(error);
  }
}
