import type { User } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { supabase } from "./supabase";

// The same list as private.traffic_source in 0022_traffic_daily.sql.
// A shared link uses one of these as ?ref=. Anything else is direct.
export const TRAFFIC_SOURCES = [
  "producthunt",
  "hackernews",
  "reddit-reactnative",
  "reddit-expo",
  "reddit-supabase",
  "reddit-sideproject",
  "discord-expo",
  "discord-supabase",
  "linkedin",
  "devto",
  "x",
  "peerlist",
  "indiehackers",
  "startupmap",
  "github",
  "resume",
] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number] | "direct";

const SOURCE_KEY = "traffic-source";
const VISIT_KEY = "traffic-visit-recorded";
const SIGNUP_KEY = "traffic-signup-recorded";

// A Google account is created when consent finishes, and the redirect lands
// a moment later. Longer than this, a sign-in is an account that already exists.
const NEW_ACCOUNT_MS = 2 * 60 * 1000;

const KNOWN = new Set<string>(TRAFFIC_SOURCES);

let signupSent = false;

function browserStorage(): Storage | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function normalizeTrafficSource(value: string | null | undefined): TrafficSource {
  const source = value?.trim() ?? "";
  if (KNOWN.has(source)) return source as TrafficSource;
  return "direct";
}

function storedSource(): TrafficSource {
  return normalizeTrafficSource(browserStorage()?.getItem(SOURCE_KEY));
}

/** One visit for this tab. A reload does not add another, and a failure is ignored. */
export function captureTrafficVisit(): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  const store = browserStorage();
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("ref");

  if (raw !== null && store && !store.getItem(SOURCE_KEY)) {
    store.setItem(SOURCE_KEY, normalizeTrafficSource(raw));
  }

  if (raw !== null) {
    params.delete("ref");
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }

  if (store?.getItem(VISIT_KEY) === "1") return;
  store?.setItem(VISIT_KEY, "1");
  void recordVisit(store?.getItem(SOURCE_KEY) ?? "direct");
}

async function recordVisit(source: string): Promise<void> {
  try {
    await supabase.rpc("record_visit", { p_source: normalizeTrafficSource(source) });
  } catch {
    // Counting never surfaces an error and never blocks the page.
  }
}

/**
 * One sign-up for the source kept in this tab. Safe to call twice: the second
 * call does nothing. A sign-in of an existing account must not call this.
 */
export async function recordSignUp(): Promise<void> {
  if (signupSent) return;
  const store = browserStorage();
  if (store?.getItem(SIGNUP_KEY) === "1") {
    signupSent = true;
    return;
  }
  signupSent = true;
  store?.setItem(SIGNUP_KEY, "1");

  try {
    await supabase.rpc("record_sign_up", { p_source: storedSource() });
  } catch {
    // The account is already created. Losing the tally is quieter than an error.
  }
}

/** A Google sign-in that just created the account. An existing account is ignored. */
export function noteFirstGoogleSignIn(user: User | null): void {
  if (!user) return;
  const provider = user.app_metadata?.provider;
  const googleIdentity = user.identities?.some((identity) => identity.provider === "google");
  if (provider !== "google" && !googleIdentity) return;

  const created = Date.parse(user.created_at);
  if (!Number.isFinite(created) || Date.now() - created > NEW_ACCOUNT_MS) return;
  void recordSignUp();
}
