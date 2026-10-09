import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Heart } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Avatar } from "../../../components/Avatar";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { FormMessage } from "../../../components/FormMessage";
import { Screen } from "../../../components/Screen";
import { Text } from "../../../components/Text";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../hooks/useProfile";
import { useSavedPlaces } from "../../../hooks/useSavedPlaces";
import { signOut } from "../../../lib/auth";
import { toInterestLabel } from "../../../lib/profiles";
import { colors, shadows } from "../../../lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading, error } = useProfile();
  const { places: savedPlaces, refresh: refreshSavedPlaces } = useSavedPlaces();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshSavedPlaces();
    }, [refreshSavedPlaces]),
  );

  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    if (!result.success) setSignOutError(result.error);
  }

  const email = profile?.email ?? user?.email ?? "";
  const name = profile?.full_name ?? email;
  const interests = profile?.interests ?? [];

  return (
    <Screen title="Profile">
      <FormMessage message={error} />

      <Card>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <View>
            <View className="flex-row items-center">
              <Avatar
                path={profile?.avatar_path}
                uri={profile?.avatar_url}
                name={name}
                size={64}
              />
              <View className="ml-4 flex-1">
                <Text className="text-[20px] font-semibold tracking-tight text-ink">
                  {name}
                </Text>
                {email && email !== name ? (
                  <Text className="mt-1 text-[14px] text-subtle">{email}</Text>
                ) : null}
              </View>
            </View>

            <Text className="mb-2 mt-5 text-[13px] text-subtle">Interests</Text>
            {interests.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge key={interest} label={toInterestLabel(interest)} />
                ))}
              </View>
            ) : (
              <Text className="text-[14px] leading-5 text-subtle">
                None yet. Pick a few so trip ideas can fit you.
              </Text>
            )}
          </View>
        )}
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Saved places, ${savedPlaces.length}`}
        onPress={() => router.push("/saved-places")}
        style={shadows.soft}
        className="mt-4 min-h-[56px] flex-row items-center rounded-2xl bg-surface px-4 active:bg-canvas"
      >
        <Heart size={18} color={colors.ink} />
        <Text className="ml-3 flex-1 text-[15px] font-medium text-ink">Saved places</Text>
        <Text className="mr-1 text-[14px] text-subtle">{savedPlaces.length}</Text>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      {profile ? (
        <View className="mt-6">
          <Button label="Edit profile" onPress={() => router.push("/edit-profile")} />
        </View>
      ) : null}

      <View className="mt-4">
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
