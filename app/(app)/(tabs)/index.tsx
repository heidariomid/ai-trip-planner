import { useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../components/Button";
import { EmptyState } from "../../../components/EmptyState";
import { ExploreCard } from "../../../components/ExploreCard";
import {
  HomeHeader,
  type HomeTab,
  type PlanFilter,
} from "../../../components/HomeHeader";
import { useAuth } from "../../../hooks/useAuth";
import { useProfile } from "../../../hooks/useProfile";
import { useTabBarClearance } from "../../../hooks/useTabBar";
import { EXPLORE_PLANS } from "../../../lib/explore-plans";

const EMPTY_MESSAGE: Record<PlanFilter, string> = {
  "All Plans": "You have no trips yet. Your plans will show up here.",
  Active: "No active trip. A trip is active while today falls inside its dates.",
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tab, setTab] = useState<HomeTab>("My Plan");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("All Plans");
  const paddingBottom = useTabBarClearance();

  const name = profile?.full_name ?? user?.email ?? "Traveller";

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <FlatList
          data={tab === "Explore" ? EXPLORE_PLANS : []}
          keyExtractor={(plan) => plan.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom,
          }}
          ListHeaderComponent={
            <HomeHeader
              name={name}
              avatarUrl={profile?.avatar_url}
              tab={tab}
              onTabChange={setTab}
              planFilter={planFilter}
              onPlanFilterChange={setPlanFilter}
            />
          }
          renderItem={({ item }) => (
            <View className="mb-4">
              <ExploreCard plan={item} />
            </View>
          )}
          ListEmptyComponent={
            tab === "Explore" ? null : (
              <EmptyState message={EMPTY_MESSAGE[planFilter]}>
                <Button label="Create a trip" onPress={() => undefined} disabled />
              </EmptyState>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
