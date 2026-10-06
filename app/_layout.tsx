import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../hooks/useAuth";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
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
    // Matches the warm background of every screen, so the cold start does not
    // flash a cool grey before the app appears.
    return (
      <View className="flex-1 items-center justify-center bg-sand">
        <ActivityIndicator size="large" color="#C2410C" />
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
