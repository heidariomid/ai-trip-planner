import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, Heart, LogOut, Pencil, Shield, Users } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Avatar } from "../../../components/Avatar";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormMessage } from "../../../components/FormMessage";
import { Screen } from "../../../components/Screen";
import { Text } from "../../../components/Text";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../hooks/useProfile";
import { useSavedPlaces } from "../../../hooks/useSavedPlaces";
import { deleteAccount } from "../../../lib/account";
import { signOut } from "../../../lib/auth";
import { openPrivacyPolicy } from "../../../lib/links";
import { toInterestLabel } from "../../../lib/profiles";
import { colors, shadows } from "../../../lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, isLoading, error } = useProfile();
  const { places: savedPlaces, refresh: refreshSavedPlaces } = useSavedPlaces();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // A deleted account has no session left, so the route guard shows Sign In
  // and this screen is gone before there is anything to close.
  async function handleDeleteAccount() {
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteAccount();
    if (result.success) return;
    setIsDeleting(false);
    setDeleteError(result.error);
  }

  function closeDeleteDialog() {
    setIsConfirmingDelete(false);
    setDeleteError(null);
  }

  const email = profile?.email ?? user?.email ?? "";
  const name = profile?.full_name ?? email;
  const interests = profile?.interests ?? [];

  return (
    <Screen title="Profile" scroll>
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
              {profile ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                  onPress={() => router.push("/edit-profile")}
                  className="-mr-2 h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
                >
                  <Pencil size={18} color={colors.muted} />
                </Pressable>
              ) : null}
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Join a trip with a code"
        onPress={() => router.push("/join-trip")}
        style={shadows.soft}
        className="mt-3 min-h-[56px] flex-row items-center rounded-2xl bg-surface px-4 active:bg-canvas"
      >
        <Users size={18} color={colors.ink} />
        <Text className="ml-3 flex-1 text-[15px] font-medium text-ink">Join a trip</Text>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Privacy policy"
        onPress={() => void openPrivacyPolicy()}
        style={shadows.soft}
        className="mt-3 min-h-[56px] flex-row items-center rounded-2xl bg-surface px-4 active:bg-canvas"
      >
        <Shield size={18} color={colors.ink} />
        <Text className="ml-3 flex-1 text-[15px] font-medium text-ink">Privacy policy</Text>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <View className="mt-6">
        <FormMessage message={signOutError} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
          style={shadows.soft}
          className={`min-h-[56px] flex-row items-center rounded-2xl bg-surface px-4 active:bg-canvas ${
            isSigningOut ? "opacity-45" : ""
          }`}
        >
          <LogOut size={18} color={colors.ink} />
          <Text className="ml-3 flex-1 text-[15px] font-medium text-ink">Sign out</Text>
          {isSigningOut ? <ActivityIndicator size="small" color={colors.ink} /> : null}
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete account"
        onPress={() => setIsConfirmingDelete(true)}
        className="mt-2 min-h-[44px] items-center justify-center self-center px-4"
      >
        <Text className="text-[14px] font-medium text-red-600">Delete account</Text>
      </Pressable>

      <ConfirmDialog
        visible={isConfirmingDelete}
        title="Delete your account?"
        message="Your trips, photos, and conversations are deleted with it. A trip you shared disappears for the people you shared it with too. This cannot be undone."
        confirmLabel="Delete account"
        onConfirm={() => void handleDeleteAccount()}
        onCancel={closeDeleteDialog}
        loading={isDeleting}
        error={deleteError}
      />
    </Screen>
  );
}
