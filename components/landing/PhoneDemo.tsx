import { ArrowUp, ChevronLeft, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

import { colors } from "../../lib/theme";
import { Text } from "../Text";

// How long each stage of the conversation stays before the next one arrives.
// The last one is the pause on the finished plan before it starts again.
const STAGE_MS = [900, 1100, 1700, 1300, 1700, 5600] as const;
const LAST_STAGE = STAGE_MS.length - 1;

const STOPS = [
  { time: "09:00", place: "Gornergrat railway" },
  { time: "13:00", place: "Lunch at Chez Vrony" },
  { time: "16:00", place: "Riffelsee lake walk" },
] as const;

const PHONE_SIZE = { width: 318, height: 648 } as const;
const COVER_SIZE = { width: "100%", height: 92 } as const;

/**
 * The assistant planning a trip, played on a loop inside a phone. It is drawn
 * from views, not a recording, so it stays sharp at any size. Nothing here
 * talks to the model.
 */
export function PhoneDemo() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setStage((current) => (current >= LAST_STAGE ? 0 : current + 1)),
      STAGE_MS[stage],
    );
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <View
      accessibilityLabel="A preview of the assistant planning three days in the Swiss Alps"
      style={PHONE_SIZE}
      className="lp-phone rounded-[52px] bg-ink p-[10px]"
    >
      <View className="flex-1 overflow-hidden rounded-[42px] bg-canvas">
        <View className="h-9 items-center justify-center">
          <View className="h-[22px] w-[92px] rounded-full bg-ink" />
        </View>

        <View className="flex-row items-center justify-between px-4 pb-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface">
            <ChevronLeft size={18} color={colors.ink} />
          </View>
          <Text className="text-[15px] font-semibold text-ink">Assistant</Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface">
            <Sparkles size={16} color={colors.ink} />
          </View>
        </View>

        <View className="flex-1 justify-end overflow-hidden px-3 pb-2">
          {stage >= 1 ? (
            <View className="lp-pop mb-2 max-w-[85%] self-end rounded-[18px] rounded-br-md bg-accent px-3.5 py-2">
              <Text className="text-[13px] leading-[18px] text-white">
                Plan 3 days in the Swiss Alps for two
              </Text>
            </View>
          ) : null}

          {stage === 2 ? (
            <View className="lp-pop mb-2 flex-row gap-1 self-start rounded-[18px] rounded-bl-md bg-surface px-4 py-3.5">
              <View className="lp-dot h-1.5 w-1.5 rounded-full bg-subtle" />
              <View className="lp-dot lp-dot-2 h-1.5 w-1.5 rounded-full bg-subtle" />
              <View className="lp-dot lp-dot-3 h-1.5 w-1.5 rounded-full bg-subtle" />
            </View>
          ) : null}

          {stage >= 3 ? (
            <View className="lp-pop mb-2 max-w-[92%] self-start rounded-[18px] rounded-bl-md bg-surface px-3.5 py-2.5">
              <Text className="text-[13px] leading-[18px] text-ink">
                Here is a relaxed plan around{" "}
                <Text className="font-semibold text-ink">Zermatt</Text>: one big mountain
                day, one lake walk, and a slow last morning.
              </Text>
            </View>
          ) : null}

          {stage >= 4 ? (
            <View className="lp-pop mb-2 rounded-2xl bg-surface p-2.5">
              <Image
                source={require("../../assets/explore/alps.jpg")}
                resizeMode="cover"
                style={COVER_SIZE}
                className="rounded-xl bg-canvas"
                accessible={false}
              />
              <View className="mt-2 flex-row items-center justify-between px-1">
                <View>
                  <Text className="text-[11px] text-subtle">New trip</Text>
                  <Text className="text-[14px] font-semibold text-ink">Swiss Alps Escape</Text>
                  <Text className="text-[11px] text-subtle">3 days · 2 travelers</Text>
                </View>
                <View className="h-8 justify-center rounded-full bg-accent px-3.5">
                  <Text className="text-[12px] font-semibold text-white">Create Trip</Text>
                </View>
              </View>
            </View>
          ) : null}

          {stage >= 5 ? (
            <View className="lp-pop mb-2 rounded-2xl bg-surface px-3.5 py-3">
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink">Day 1 · Peaks</Text>
                <View className="h-7 justify-center rounded-full border border-line px-3">
                  <Text className="text-[11px] font-semibold text-ink">Add to Trip</Text>
                </View>
              </View>
              {STOPS.map((stop) => (
                <View key={stop.time} className="flex-row items-center py-1">
                  <Text className="w-11 text-[11px] font-medium text-subtle">{stop.time}</Text>
                  <Text className="text-[12px] text-ink">{stop.place}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="mx-3 mb-3 h-11 flex-row items-center rounded-full bg-surface pl-4 pr-1.5">
          <Text className="flex-1 text-[13px] text-muted">Where do you want to go?</Text>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
            <ArrowUp size={16} color={colors.surface} />
          </View>
        </View>
      </View>
    </View>
  );
}
