import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActivityRow } from "../../../../components/ActivityRow";
import { Button } from "../../../../components/Button";
import { DayChips } from "../../../../components/DayChips";
import { EmptyState } from "../../../../components/EmptyState";
import { PlanBanner } from "../../../../components/PlanBanner";
import { Text } from "../../../../components/Text";
import { useExplorePlan } from "../../../../hooks/useExplorePlan";
import { colors } from "../../../../lib/theme";

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: 40,
} as const;

export default function ExplorePlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, isLoading, isMissing, error } = useExplorePlan(id);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (!plan) {
    return (
      <View className="flex-1 bg-canvas">
        <SafeAreaView className="flex-1 items-center justify-center px-5">
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <EmptyState
              message={
                isMissing
                  ? "This plan isn't available any more."
                  : (error ?? "We couldn't load this plan.")
              }
            >
              <Button label="Go back" variant="secondary" onPress={goBack} />
            </EmptyState>
          )}
        </SafeAreaView>
      </View>
    );
  }

  const day = plan.days.find((item) => item.id === selectedDayId) ?? plan.days[0] ?? null;
  const activities = day?.activities ?? [];

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <FlatList
          data={activities}
          keyExtractor={(activity) => activity.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={CONTENT_STYLE}
          ListHeaderComponent={
            <View className="pb-5">
              <PlanBanner plan={plan} onBack={goBack} />

              <View className="mt-5">
                <Button
                  label="Copy to my trips"
                  onPress={() =>
                    router.push({ pathname: "/explore/[id]/copy", params: { id: plan.id } })
                  }
                />
              </View>

              {day ? (
                <View className="mt-6">
                  <DayChips days={plan.days} selectedId={day.id} onSelect={setSelectedDayId} />
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <ActivityRow
              activity={item}
              destination={plan.destination}
              isLast={index === activities.length - 1}
            />
          )}
          ListEmptyComponent={
            <Text className="text-center text-[14px] leading-5 text-subtle">
              Nothing is planned for this day.
            </Text>
          }
        />
      </SafeAreaView>
    </View>
  );
}
