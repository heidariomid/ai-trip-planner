import { Redirect } from "expo-router";
import { Platform } from "react-native";

import { LandingPage } from "../../components/landing/LandingPage";
import { isStandaloneWebApp } from "../../lib/install";

/**
 * The site's front door for a signed-out visitor in a browser. The native app
 * and the web app opened from a home screen icon are already "the app", so
 * they go straight to Sign In.
 */
export default function WelcomeScreen() {
  if (Platform.OS !== "web" || isStandaloneWebApp()) return <Redirect href="/sign-in" />;

  return <LandingPage />;
}
