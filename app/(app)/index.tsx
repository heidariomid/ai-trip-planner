import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormMessage } from "../../components/FormMessage";
import { useAuth } from "../../hooks/useAuth";
import { useProfile } from "../../hooks/useProfile";
import { signOut } from "../../lib/auth";
import { colors } from "../../lib/theme";

export default function HomeScreen() {
  const { user } = useAuth();
  const { profile, isLoading, error } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    if (!result.success) setSignOutError(result.error);
  }

  const name = profile?.full_name ?? user?.email ?? "traveller";

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 items-center px-5 py-10">
          <View className="w-full max-w-[380px] flex-1 justify-between">
            <View>
              <Text className="ml-1 text-[32px] font-bold leading-tight tracking-tight text-ink">
                AI Trip Planner
              </Text>
              <Text className="mb-6 ml-1 mt-1.5 text-[15px] text-subtle">
                You're signed in.
              </Text>

              <Card>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Text className="text-[20px] font-semibold tracking-tight text-ink">
                      Hello, {name}.
                    </Text>
                    <Text className="mt-1 text-[14px] text-subtle">
                      {profile?.email ?? user?.email}
                    </Text>
                    <View className="my-4 h-px bg-ink/10" />
                    <Text className="text-[13px] leading-5 text-subtle">
                      {profile
                        ? "Your profile row loaded, so the session and row-level security both work."
                        : "Signed in, but no profiles row came back."}
                    </Text>
                  </>
                )}

                {error ? (
                  <View className="mt-4">
                    <FormMessage message={error} />
                  </View>
                ) : null}
              </Card>
            </View>

            <View>
              <FormMessage message={signOutError} />
              <Button
                label="Sign out"
                variant="secondary"
                onPress={handleSignOut}
                loading={isSigningOut}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
