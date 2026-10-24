import { Redirect, Stack, usePathname } from "expo-router";

import { useAuth } from "../../hooks/useAuth";

// The root layout keeps this group up while signed out, and also while a
// reset code has been accepted but the new password is not saved yet.
export default function AuthLayout() {
  const { isRecovering } = useAuth();
  const pathname = usePathname();
  const finishingReset = isRecovering && pathname !== "/reset-password";

  return (
    <>
      {finishingReset ? <Redirect href="/reset-password" /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="reset-password" />
      </Stack>
    </>
  );
}
