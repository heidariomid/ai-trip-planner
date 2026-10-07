import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { ExploreCard } from "../../../components/ExploreCard";
import { FormMessage } from "../../../components/FormMessage";
import {
  HomeHeader,
  type HomeTab,
  type PlanFilter,
} from "../../../components/HomeHeader";
import { TripCard } from "../../../components/TripCard";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../hooks/useProfile";
import { useTabBarClearance } from "../../../hooks/useTabBar";
import { useTrips } from "../../../hooks/useTrips";
import { getTripStatus } from "../../../lib/dates";
import { EXPLORE_PLANS, type ExplorePlan } from "../../../lib/explore-plans";
import { colors } from "../../../lib/theme";
import type { Trip } from "../../../lib/trips";

type HomeItem =
  | { kind: "plan"; id: string; plan: ExplorePlan }
  | { kind: "trip"; id: string; trip: Trip };

const EXPLORE_ITEMS: HomeItem[] = EXPLORE_PLANS.map((plan) => ({
  kind: "plan",
  id: plan.id,
  plan,
}));

const EMPTY_MESSAGE: Record<PlanFilter, string> = {
  "All Plans": "You have no trips yet. Your plans will show up here.",
  Active: "No active trip. A trip is active while today falls inside its dates.",
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tab, setTab] = useState<HomeTab>("My Plan");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("All Plans");
  const paddingBottom = useTabBarClearance();
  const { trips, isLoading, isRefreshing, error, refresh } = useTrips();

  const name = profile?.full_name ?? user?.email ?? "Traveller";

  const tripItems: HomeItem[] = trips
    .filter(
      (trip) =>
        planFilter === "All Plans" ||
        getTripStatus(trip.start_date, trip.end_date) === "Ongoing",
    )
    .map((trip) => ({ kind: "trip", id: trip.id, trip }));
  const showsTrips = tab === "My Plan";

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <FlatList
          data={showsTrips ? tripItems : EXPLORE_ITEMS}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
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
              <HomeHeader
                name={name}
                avatarUrl={profile?.avatar_url}
                tab={tab}
                onTabChange={setTab}
                planFilter={planFilter}
                onPlanFilterChange={setPlanFilter}
              />
              {showsTrips ? <FormMessage message={error} /> : null}
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4">
              {item.kind === "trip" ? (
                <TripCard trip={item.trip} />
              ) : (
                <ExploreCard plan={item.plan} />
              )}
            </View>
          )}
          ListEmptyComponent={
            !showsTrips ? null : isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : error ? null : (
              <EmptyState message={EMPTY_MESSAGE[planFilter]}>
                <Button label="Create a trip" onPress={() => router.push("/create-trip")} />
              </EmptyState>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
