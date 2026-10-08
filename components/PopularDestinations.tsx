import { ActivityIndicator, FlatList, View } from "react-native";

import type { ExplorePlan } from "../lib/explore";
import { colors } from "../lib/theme";
import { DestinationCard } from "./DestinationCard";
import { Text } from "./Text";

export interface PopularDestinationsProps {
  plans: ExplorePlan[];
  isLoading: boolean;
  error: string | null;
  onOpen: (plan: ExplorePlan) => void;
}

const ROW_HEIGHT = 232;

/**
 * Explore plans as a row of places. It bleeds past the side padding of its
 * screen, and leaves room below for the cards' shadows.
 */
export function PopularDestinations({ plans, isLoading, error, onOpen }: PopularDestinationsProps) {
  if (plans.length === 0) {
    return (
      <View style={{ height: ROW_HEIGHT }} className="items-center justify-center">
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text className="px-4 text-center text-[14px] leading-5 text-subtle">
            {error ?? "There are no destinations to show yet."}
          </Text>
        )}
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={plans}
      keyExtractor={(plan) => plan.id}
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28, gap: 12 }}
      renderItem={({ item }) => <DestinationCard plan={item} onPress={() => onOpen(item)} />}
    />
  );
}
