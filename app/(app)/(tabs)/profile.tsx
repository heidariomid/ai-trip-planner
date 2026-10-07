import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { FormMessage } from "../../../components/FormMessage";
import { Screen } from "../../../components/Screen";
import { Text } from "../../../components/Text";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../hooks/useProfile";
import { signOut } from "../../../lib/auth";
import { colors } from "../../../lib/theme";

export default function ProfileScreen() {
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

  const email = profile?.email ?? user?.email ?? "";
  const name = profile?.full_name ?? email;

  return (
    <Screen title="Profile">
      <FormMessage message={error} />

      <Card>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <View className="flex-row items-center">
            <Avatar uri={profile?.avatar_url} name={name} size={64} />
            <View className="ml-4 flex-1">
              <Text className="text-[20px] font-semibold tracking-tight text-ink">
                {name}
              </Text>
              {email && email !== name ? (
                <Text className="mt-1 text-[14px] text-subtle">{email}</Text>
              ) : null}
            </View>
          </View>
        )}
      </Card>

      <View className="mt-8">
        <FormMessage message={signOutError} />
        <Button
          label="Sign out"
          variant="secondary"
          onPress={handleSignOut}
          loading={isSigningOut}
        />
      </View>
    </Screen>
  );
}
