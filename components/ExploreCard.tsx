import { Image, View } from "react-native";

import type { ExplorePlan } from "../lib/explore-plans";
import { Card } from "./Card";
import { Text } from "./Text";

export interface ExploreCardProps {
  plan: ExplorePlan;
}

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image.
const MAP_SIZE = { width: 92, height: "100%", minHeight: 132 } as const;

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[13px] text-subtle">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-semibold text-ink">{value}</Text>
    </View>
  );
}

export function ExploreCard({ plan }: ExploreCardProps) {
  return (
    <Card>
      <View className="flex-row">
        <View className="flex-1 pr-4">
          <Text className="text-[20px] font-semibold tracking-tight text-ink">
            {plan.title}
          </Text>

          <View className="mt-4 flex-row gap-5">
            <Fact label="Days" value={String(plan.days)} />
            <Fact label="Avg cost" value={plan.cost} />
            <Fact label="Places" value={String(plan.places)} />
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
          source={require("../assets/explore/map.png")}
          resizeMode="cover"
          style={MAP_SIZE}
          className="rounded-2xl"
          accessible={false}
        />
      </View>
    </Card>
  );
}
