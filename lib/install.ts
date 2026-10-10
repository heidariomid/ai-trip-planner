import { Platform } from "react-native";

// The web app on a phone's home screen. An iPhone gives a home screen app its
// own storage, apart from Safari's, so the hint that explains installing is
// shown before sign-in. None of this runs in the native app.

export type InstallDevice = "ios" | "android";

/** Chrome's own event; it is not in the DOM typings. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "install-hint-dismissed";

let pendingPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// Chrome fires this once, early, and often before any screen has mounted, so
// it is caught here when the bundle loads and kept for the button.
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    pendingPrompt = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    pendingPrompt = null;
    notify();
  });
}

/** Runs the listener when the browser starts or stops offering its prompt. */
export function subscribeToInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function canPromptInstall(): boolean {
  return pendingPrompt !== null;
}

/** Opens the browser's own install prompt. Resolves true when it was accepted. */
export async function promptInstall(): Promise<boolean> {
  const prompt = pendingPrompt;
  if (!prompt) return false;
  // The browser lets one event open one prompt.
  pendingPrompt = null;
  notify();

  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === "accepted";
  } catch (error) {
    console.error("[install] the prompt did not open", error);
    return false;
  }
}

/** The web app opened from its home screen icon, not in a browser tab. */
export function isStandaloneWebApp(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * The phone a hint should be written for, or null when there is nothing to
 * install: the native app, a desktop browser, or the app already opened from
 * its home screen icon.
 */
export function getInstallDevice(): InstallDevice | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  if (isStandaloneWebApp()) return null;

  const agent = navigator.userAgent;
  // An iPad asks for the desktop site and calls itself a Mac; the touch
  // points give it away.
  const isIpad = /Macintosh/.test(agent) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(agent) || isIpad) return "ios";
  if (/Android/.test(agent)) return "android";
  return null;
}

export function isInstallHintDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Kept on this device only. A browser that blocks storage shows it again. */
export function dismissInstallHint(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch (error) {
    console.error("[install] could not remember the dismissal", error);
  }
}
