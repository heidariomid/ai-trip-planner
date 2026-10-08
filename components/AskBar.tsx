import { LinearGradient } from "expo-linear-gradient";
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

// A pale sky fading into a pale peach, corner to corner, like a sunrise.
const WASH = [
  colors["sky-soft"],
  colors.surface,
  colors["peach-soft"],
] as const;
const WASH_START = { x: 0, y: 0 };
const WASH_END = { x: 1, y: 1 };
// A style object, because a class does not reach a third-party native view.
const FILL = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;

/**
 * The way into planning with AI, and the first thing on Home on purpose: it
 * is what the app is for. A soft sky-to-peach wash, the one gradient in the
 * app, so it has a little colour without a loud one. Drawn, not wired. It is
 * not an input, so there is nothing to submit; the assistant arrives in
 * spec 11.
 */
export function AskBar() {
  return (
    <View style={shadows.card} className="rounded-card bg-surface">
      <View className="overflow-hidden rounded-card border border-surface px-5 pb-5 pt-6">
        <LinearGradient
          colors={WASH}
          start={WASH_START}
          end={WASH_END}
          style={FILL}
        />

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
          <Text className="ml-3 flex-1 text-[15px] text-muted">
            Where do you want to go?
          </Text>
          <Mic size={20} color={colors.muted} />
        </View>
      </View>
    </View>
  );
}
