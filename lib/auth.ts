import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { toReadableAuthError } from "./auth-errors";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  /** A sentence to show the traveller, or null when there is nothing to say. */
  error: string | null;
  /** Set when the call worked but the traveller still has something to do. */
  notice?: string;
}

const ok: AuthResult = { success: true, error: null };

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

    // This phase expects "Confirm email" to be off, so sign-up hands back a
    // session and the route guard moves on. If the setting is on, there is no
    // session and nothing would appear to happen — say so instead.
    if (!data.session) {
      return {
        success: true,
        error: null,
        notice:
          "Account created. Check your email for a confirmation link, then sign in.",
      };
    }

    return ok;
  } catch (error) {
    return failed(error);
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
