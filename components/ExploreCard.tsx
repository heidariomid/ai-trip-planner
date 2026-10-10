import { Image, Pressable, View } from "react-native";

import type { ExplorePlan } from "../lib/explore";
import { getExploreImage } from "../lib/explore-images";
import { Card } from "./Card";
import { Fact } from "./Fact";
import { Text } from "./Text";

export interface ExploreCardProps {
  plan: ExplorePlan;
  onPress: () => void;
}

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image.
const PICTURE_SIZE = { width: 92, height: "100%", minHeight: 132 } as const;

/** A curated plan in the Explore list, with its own picture on the right. */
export function ExploreCard({ plan, onPress }: ExploreCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${plan.title}`}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card>
        <View className="flex-row">
          <View className="flex-1 pr-4">
            <Text className="text-[20px] font-semibold tracking-tight text-ink">
              {plan.title}
            </Text>

            <View className="mt-4 flex-row gap-5">
              <Fact label="Days" value={String(plan.dayCount)} />
              <Fact label="Avg cost" value={plan.rough_cost} />
              <Fact label="Places" value={String(plan.placeCount)} />
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {plan.tags.map((tag) => (
                <View key={tag} className="rounded-full bg-canvas px-3 py-1.5">
                  <Text className="text-[13px] text-subtle">{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <Image
            source={getExploreImage(plan.image_key)}
            resizeMode="cover"
            style={PICTURE_SIZE}
            className="rounded-2xl bg-canvas"
            accessible={false}
          />
        </View>
      </Card>
    </Pressable>
  );
}
