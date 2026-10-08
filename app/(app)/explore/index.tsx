import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryChips } from "../../../components/CategoryChips";
import { EmptyState } from "../../../components/EmptyState";
import { ExploreCard } from "../../../components/ExploreCard";
import { FormMessage } from "../../../components/FormMessage";
import { RoundButton } from "../../../components/RoundButton";
import { Text } from "../../../components/Text";
import { useExplorePlans } from "../../../hooks/useExplorePlans";
import { colors } from "../../../lib/theme";

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 40,
} as const;

/** Every curated plan, with the category filter. Opened from Home's "See all". */
export default function ExploreScreen() {
  const router = useRouter();
  const { plans, isLoading, isRefreshing, error, refresh } = useExplorePlans();
  const [category, setCategory] = useState<string | null>(null);

  // The chip filters the plans already loaded. It is not a new request.
  const categories = [...new Set(plans.map((plan) => plan.category))];
  const shown = plans.filter((plan) => category === null || plan.category === category);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <FlatList
          data={shown}
          keyExtractor={(plan) => plan.id}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={refresh}
          contentContainerStyle={CONTENT_STYLE}
          ListHeaderComponent={
            <View className="pb-5">
              <View className="mb-5 self-start">
                <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={goBack} />
              </View>
              <Text className="mb-5 text-[32px] font-bold leading-tight tracking-tight text-ink">
                Explore
              </Text>
              {categories.length > 0 ? (
                <CategoryChips categories={categories} selected={category} onSelect={setCategory} />
              ) : null}
              <View className="mt-4">
                <FormMessage message={error} />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4">
              <ExploreCard
                plan={item}
                onPress={() =>
                  router.push({ pathname: "/explore/[id]", params: { id: item.id } })
                }
              />
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : error ? null : (
              <EmptyState
                message={
                  category === null
                    ? "There are no plans to explore yet."
                    : "No plans in this category yet. Try another one."
                }
              />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
