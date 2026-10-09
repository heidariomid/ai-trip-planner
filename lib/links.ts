import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

const PRIVACY_PATH = "/privacy.html";

/**
 * Where the site is served. The web app is already on it. The native app is
 * told with EXPO_PUBLIC_SITE_URL once the site has a public address, and
 * until then falls back on the dev server it was loaded from.
 */
function getSiteUrl(): string | null {
  if (Platform.OS === "web") return window.location.origin;

  const configured = process.env.EXPO_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const devServer = Constants.expoConfig?.hostUri;
  return devServer ? `http://${devServer}` : null;
}

/** Opens the privacy policy page in the browser. Resolves false when it could not. */
export async function openPrivacyPolicy(): Promise<boolean> {
  const site = getSiteUrl();
  if (!site) return false;
  try {
    await WebBrowser.openBrowserAsync(`${site}${PRIVACY_PATH}`);
    return true;
  } catch (error) {
    console.error("[links] could not open the privacy policy", error);
    return false;
  }
}
