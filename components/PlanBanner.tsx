import { ArrowLeft } from "lucide-react-native";
import { Image, View } from "react-native";

import type { ExplorePlanDetail } from "../lib/explore";
import { getExploreImage } from "../lib/explore-images";
import { Fact } from "./Fact";
import { RoundButton } from "./RoundButton";
import { Text } from "./Text";

export interface PlanBannerProps {
  plan: ExplorePlanDetail;
  onBack: () => void;
}

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image.
const COVER_SIZE = { width: "100%", height: 200 } as const;

/** The top of a curated plan. No dates and no status: a plan has neither. */
export function PlanBanner({ plan, onBack }: PlanBannerProps) {
  const placeCount = plan.days.reduce((total, day) => total + day.activities.length, 0);

  return (
    <View>
      <View>
        <Image
          source={getExploreImage(plan.image_key)}
          resizeMode="cover"
          style={COVER_SIZE}
          className="rounded-card bg-canvas"
          accessible={false}
        />
        <View className="absolute left-3 top-3">
          <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={onBack} />
        </View>
      </View>

      <Text className="mt-5 text-[32px] font-bold leading-tight tracking-tight text-ink">
        {plan.title}
      </Text>
      <Text className="mt-1 text-[15px] text-subtle">{plan.destination}</Text>

      <View className="mt-4 flex-row gap-6">
        <Fact label="Days" value={String(plan.days.length)} />
        <Fact label="Avg cost" value={plan.rough_cost} />
        <Fact label="Places" value={String(placeCount)} />
      </View>

      {plan.description ? (
        <Text className="mt-4 text-[15px] leading-5 text-ink">{plan.description}</Text>
      ) : null}
    </View>
  );
}
