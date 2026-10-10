import { Stack } from "expo-router";

// The root layout removes this whole group once there is a session, so these
// screens cannot be reached while signed in.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
