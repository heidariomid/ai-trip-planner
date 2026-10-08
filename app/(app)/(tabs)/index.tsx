import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { FormMessage } from "../../../components/FormMessage";
import { HomeHeader } from "../../../components/HomeHeader";
import { PopularDestinations } from "../../../components/PopularDestinations";
import { SectionHeader } from "../../../components/SectionHeader";
import { TripCard } from "../../../components/TripCard";
import { useAuth } from "../../../hooks/useAuth";
import { useExplorePlans } from "../../../hooks/useExplorePlans";
import { useProfile } from "../../../hooks/useProfile";
import { useTabBarClearance } from "../../../hooks/useTabBar";
import { useTrips } from "../../../hooks/useTrips";
import { getTripStatus } from "../../../lib/dates";
import { colors } from "../../../lib/theme";

// Home shows the trips still ahead or under way. My Trips has all of them.
const MAX_TRIPS_ON_HOME = 3;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const paddingBottom = useTabBarClearance();
  const trips = useTrips();
  const explore = useExplorePlans();

  const name = profile?.full_name ?? user?.email ?? "Traveller";
  const tripsToContinue = trips.trips
    .filter((trip) => getTripStatus(trip.start_date, trip.end_date) !== "Past")
    .slice(0, MAX_TRIPS_ON_HOME);

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
          showsVerticalScrollIndicator={false}
          refreshing={trips.isRefreshing || explore.isRefreshing}
          onRefresh={refresh}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom,
          }}
          ListHeaderComponent={
            <View>
              <HomeHeader name={name} avatarUrl={profile?.avatar_url} />

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
            <View className="mb-4">
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
    </View>
  );
}
