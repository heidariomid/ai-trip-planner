import "../global.css";

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WebAnalytics } from "../components/WebAnalytics";
import { WebSpeedInsights } from "../components/WebSpeedInsights";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { colors } from "../lib/theme";

// The splash stays up until Outfit is in memory, so no screen is ever drawn
// in the system font first.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    IRANSansX_400Regular: require("../assets/fonts/IRANSansX-Regular.ttf"),
    IRANSansX_500Medium: require("../assets/fonts/IRANSansX-Medium.ttf"),
    IRANSansX_600DemiBold: require("../assets/fonts/IRANSansX-DemiBold.ttf"),
    IRANSansX_700Bold: require("../assets/fonts/IRANSansX-Bold.ttf"),
  });
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) void SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <WebAnalytics />
        <WebSpeedInsights />
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, isRestoring } = useAuth();

  // Nothing routable renders until the stored session has been read back.
  // Mounting the navigator first is what produces a flash of the sign-in
  // screen on a cold start that is already signed in.
  if (isRestoring) {
    // Matches the canvas of every screen, so the cold start does not flash a
    // different colour before the app appears.
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
