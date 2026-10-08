import { MapPin } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { splitDestination, type ExplorePlan } from "../lib/explore";
import { getExploreImage } from "../lib/explore-images";
import { colors } from "../lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

export interface DestinationCardProps {
  plan: ExplorePlan;
  onPress: () => void;
}

const CARD_WIDTH = 150;
// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image.
const PICTURE_SIZE = { width: "100%", height: 140 } as const;

/** A place to go, drawn from an explore plan. Tapping it opens that plan. */
export function DestinationCard({ plan, onPress }: DestinationCardProps) {
  const { place, country } = splitDestination(plan.destination);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open the plan for ${plan.destination}`}
      onPress={onPress}
      style={{ width: CARD_WIDTH }}
      className="active:opacity-80"
    >
      <Card flush>
        <Image
          source={getExploreImage(plan.image_key)}
          resizeMode="cover"
          style={PICTURE_SIZE}
          // The card cannot clip its children without losing its shadow, so the
          // picture rounds its own top corners to match the card.
          className="rounded-t-card bg-canvas"
          accessible={false}
        />
        <View className="px-3.5 pb-3.5 pt-3">
          <Text numberOfLines={1} className="text-[15px] font-semibold text-ink">
            {place}
          </Text>
          {country ? (
            <View className="mt-1 flex-row items-center">
              <MapPin size={12} color={colors.subtle} />
              <Text numberOfLines={1} className="ml-1 flex-1 text-[13px] text-subtle">
                {country}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
