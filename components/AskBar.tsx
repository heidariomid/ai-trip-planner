import { Mic, Sparkles } from "lucide-react-native";
import { View } from "react-native";

import { colors, shadows } from "../lib/theme";
import { RotatingText } from "./RotatingText";
import { Text } from "./Text";

// Trips the assistant could be asked for. They rotate in the headline.
const IDEAS = [
  "a week in Tokyo",
  "3 days in Lisbon",
  "a road trip in Iceland",
  "a food tour of Rome",
  "a long weekend in Paris",
] as const;

/**
 * The way into planning with AI, and the first thing on Home on purpose: it
 * is what the app is for. Neutral white glass: no colour of its own, so it
 * stands out by its size and its moving headline. Drawn, not wired. It is not
 * an input, so there is nothing to submit; the assistant arrives in spec 11.
 */
export function AskBar() {
  return (
    <View
      style={shadows.card}
      className="rounded-card border border-surface bg-surface/70 px-5 pb-5 pt-6"
    >
      <View className="flex-row items-center">
        <Sparkles size={16} color={colors.ink} />
        <Text className="ml-2 text-[12px] font-semibold uppercase tracking-widest text-ink">
          AI trip planner
        </Text>
      </View>

      <Text className="mt-3 text-[20px] text-subtle">Ask me to plan</Text>
      <RotatingText
        phrases={IDEAS}
        className="font-bold text-[30px] leading-9 tracking-tight text-ink"
      />
      <Text className="mt-2 text-[14px] leading-5 text-subtle">
        Say where and for how long. I'll build it day by day.
      </Text>

      <View
        style={shadows.soft}
        className="mt-5 h-14 flex-row items-center rounded-full bg-surface pl-2 pr-5"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
          <Sparkles size={18} color={colors.ink} />
        </View>
        <Text className="ml-3 flex-1 text-[15px] text-muted">Where do you want to go?</Text>
        <Mic size={20} color={colors.muted} />
      </View>
    </View>
  );
}
