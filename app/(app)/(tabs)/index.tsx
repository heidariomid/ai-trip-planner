import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { FormMessage } from "../../../components/FormMessage";
import { HomeHeader } from "../../../components/HomeHeader";
import { PopularDestinations } from "../../../components/PopularDestinations";
import { ProfileMenu } from "../../../components/ProfileMenu";
import { SectionHeader } from "../../../components/SectionHeader";
import { TripCard } from "../../../components/TripCard";
import { useAuth } from "../../../hooks/useAuth";
import { useExplorePlans } from "../../../hooks/useExplorePlans";
import {
  GRID_ITEM_STYLE,
  GRID_ROW_STYLE,
  useContentWidth,
  useGridColumns,
} from "../../../hooks/useLayout";
import { useProfile } from "../../../hooks/useProfile";
import { useTabBarClearance } from "../../../hooks/useTabBar";
import { useTrips } from "../../../hooks/useTrips";
import { signOut } from "../../../lib/auth";
import { getTripStatus } from "../../../lib/dates";
import { colors } from "../../../lib/theme";

// Home shows the trips still ahead or under way. My Trips has all of them.
const MAX_TRIPS_ON_HOME = 3;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const paddingBottom = useTabBarClearance();
  const maxWidth = useContentWidth("grid");
  const columns = useGridColumns();
  const trips = useTrips();
  const explore = useExplorePlans();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const email = profile?.email ?? user?.email ?? "";
  const name = profile?.full_name ?? user?.email ?? "Traveller";
  const tripsToContinue = trips.trips
    // A draft is not a trip yet. It waits on My Trips until it is moved there.
    .filter(
      (trip) =>
        trip.status !== "draft" && getTripStatus(trip.start_date, trip.end_date) !== "Past",
    )
    .slice(0, MAX_TRIPS_ON_HOME);

  function closeMenu() {
    setIsMenuOpen(false);
    setSignOutError(null);
  }

  // The sheet closes first, so it is not left open over the screen it opened.
  function openFromMenu(path: "/profile" | "/edit-profile" | "/saved-places") {
    closeMenu();
    router.push(path);
  }

  // A sign-out that works removes this screen: the route guard shows the
  // signed-out side, so there is nothing to close.
  async function handleSignOut() {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    if (result.success) return;
    setIsSigningOut(false);
    setSignOutError(result.error);
  }

  function refresh() {
    trips.refresh();
    explore.refresh();
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <FlatList
          data={tripsToContinue}
          keyExtractor={(trip) => trip.id}
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? GRID_ROW_STYLE : undefined}
          showsVerticalScrollIndicator={false}
          refreshing={trips.isRefreshing || explore.isRefreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            width: "100%",
            maxWidth,
            alignSelf: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom,
          }}
          ListHeaderComponent={
            <View>
              <HomeHeader
                name={name}
                avatarUrl={profile?.avatar_url}
                avatarPath={profile?.avatar_path}
                onAsk={() => router.push("/chat")}
                onOpenMenu={() => setIsMenuOpen(true)}
              />

              <View className="mt-5">
                <SectionHeader
                  title="Popular destinations"
                  onSeeAll={() => router.push("/explore")}
                />
              </View>
              <View className="mt-1">
                <PopularDestinations
                  plans={explore.plans}
                  isLoading={explore.isLoading}
                  error={explore.error}
                  onOpen={(plan) =>
                    router.push({ pathname: "/explore/[id]", params: { id: plan.id } })
                  }
                />
              </View>

              <View className="mb-2">
                <SectionHeader
                  title="Continue planning"
                  onSeeAll={trips.trips.length > 0 ? () => router.push("/trips") : undefined}
                />
              </View>
              <FormMessage message={trips.error} />
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4" style={columns > 1 ? GRID_ITEM_STYLE : undefined}>
              <TripCard
                trip={item}
                onPress={() => router.push({ pathname: "/trip/[id]", params: { id: item.id } })}
              />
            </View>
          )}
          ListEmptyComponent={
            trips.isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : trips.error ? null : (
              <EmptyState message="No trip in the works. Start one, or copy a destination above.">
                <Button label="Create a trip" onPress={() => router.push("/create-trip")} />
              </EmptyState>
            )
          }
        />
      </SafeAreaView>

      <ProfileMenu
        visible={isMenuOpen}
        name={name}
        email={email}
        onOpenProfile={() => openFromMenu("/profile")}
        onEditProfile={() => openFromMenu("/edit-profile")}
        onOpenSavedPlaces={() => openFromMenu("/saved-places")}
        onSignOut={() => void handleSignOut()}
        isSigningOut={isSigningOut}
        error={signOutError}
        onClose={closeMenu}
      />
    </View>
  );
}
