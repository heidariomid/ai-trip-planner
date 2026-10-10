import { ArrowRight, Check, Heart, Hotel } from "lucide-react-native";
import { View } from "react-native";

import { colors } from "../../lib/theme";
import { RotatingText } from "../RotatingText";
import { Text } from "../Text";
import { Container, LandingButton } from "./LandingShared";
import { PhoneDemo } from "./PhoneDemo";
import { Reveal } from "./Reveal";

const IDEAS = [
  "a week in Tokyo.",
  "3 days in Lisbon.",
  "a week in Iceland.",
  "4 days in Rome.",
  "a weekend in Paris.",
] as const;

const PROMPTS = [
  "Plan 5 days in Kyoto in April",
  "A food weekend in Lisbon under $600",
  "What should I pack for Iceland in March?",
  "Three hotels near the Eiffel Tower",
  "A week in Bali with two kids",
  "Swap day 2 for something indoors",
  "A road trip from LA to Lake Tahoe",
  "Best neighbourhood to stay in Rome",
] as const;

const POINTS = ["Free to use", "No install needed", "Works on any device"] as const;

/** The first screen: what the app is, the way in, and the assistant at work. */
export function LandingHero() {
  return (
    <View className="pt-[112px] lg:pt-[168px]">
      <Container className="md:flex-row md:items-center">
        <View className="md:flex-1 md:pr-8 lg:pr-10">
          <Reveal>
            <View className="lp-glass h-9 flex-row items-center self-start rounded-full pl-1.5 pr-4">
              <View className="h-6 justify-center rounded-full bg-ink px-2.5">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  New
                </Text>
              </View>
              <Text className="ml-2.5 text-[13px] font-medium text-ink">
                An AI assistant that builds the whole trip
              </Text>
            </View>
          </Reveal>

          <Reveal delay={1}>
            <Text className="mt-6 text-[38px] font-bold leading-[42px] tracking-tighter text-ink lg:text-[52px] lg:leading-[56px] xl:text-[68px] xl:leading-[70px]">
              Just ask for
            </Text>
            <RotatingText
              phrases={IDEAS}
              className="font-bold text-[38px] leading-[46px] tracking-tighter text-accent lg:text-[52px] lg:leading-[64px] xl:text-[68px] xl:leading-[80px]"
            />
          </Reveal>

          <Reveal delay={2}>
            <Text className="mt-6 max-w-[520px] text-[18px] leading-7 text-subtle lg:text-[21px] lg:leading-8">
              Say where and for how long. The assistant plans every day, finds the
              places, and you save it all with one tap: itinerary, bookings, and
              packing list in one trip you can share.
            </Text>
          </Reveal>

          <Reveal delay={3}>
            <View className="mt-9 gap-3 md:max-w-[340px] lg:max-w-none lg:flex-row lg:items-center">
              <LandingButton
                label="Start planning free"
                href="/sign-up"
                size="large"
                stretch
                icon={<ArrowRight size={20} color={colors.surface} />}
              />
              <LandingButton
                label="I have an account"
                href="/sign-in"
                variant="outline"
                size="large"
                stretch
              />
            </View>

            <View className="mt-7 flex-row flex-wrap gap-x-6 gap-y-2">
              {POINTS.map((point) => (
                <View key={point} className="flex-row items-center">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-accent-soft">
                    <Check size={12} color={colors.accent} strokeWidth={3} />
                  </View>
                  <Text className="ml-2 text-[14px] font-medium text-ink">{point}</Text>
                </View>
              ))}
            </View>
          </Reveal>
        </View>

        <Reveal eager delay={2} className="mt-12 items-center md:mt-0 md:w-[330px] lg:w-[460px]">
          <View>
            <PhoneDemo />

            <View className="lp-float absolute -left-[198px] bottom-[36px] hidden w-[210px] rounded-3xl bg-surface p-4 xl:flex lp-card">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-subtle">Planning progress</Text>
                <Text className="text-[14px] font-bold text-ink">68%</Text>
              </View>
              <View className="mt-2.5 h-1.5 rounded-full bg-canvas">
                <View className="h-1.5 w-[68%] rounded-full bg-accent" />
              </View>
              <Text className="mt-3 text-[12px] leading-4 text-subtle">
                9 of 14 stops done · 12 items packed
              </Text>
            </View>

            <View className="lp-float-late absolute -right-[142px] top-[150px] hidden flex-row items-center rounded-full bg-surface py-2.5 pl-2.5 pr-5 xl:flex lp-card">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
                <Hotel size={17} color={colors.ink} />
              </View>
              <View className="ml-2.5">
                <Text className="text-[13px] font-semibold text-ink">Hotel added</Text>
                <Text className="text-[11px] text-subtle">Saved to bookings</Text>
              </View>
            </View>

            <View className="lp-float-late absolute -right-[152px] bottom-[190px] hidden flex-row items-center rounded-full bg-surface py-2.5 pl-2.5 pr-5 xl:flex lp-card">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
                <Heart size={16} color={colors.heart} fill={colors.heart} />
              </View>
              <View className="ml-2.5">
                <Text className="text-[13px] font-semibold text-ink">Riffelsee</Text>
                <Text className="text-[11px] text-subtle">Saved place · Zermatt</Text>
              </View>
            </View>
          </View>
        </Reveal>
      </Container>

      <View className="lp-marquee-mask mt-20 overflow-hidden lg:mt-28">
        <View accessible={false} className="lp-marquee flex-row gap-3">
          {[...PROMPTS, ...PROMPTS].map((prompt, index) => (
            <View
              key={`${prompt}-${index}`}
              className="h-12 justify-center rounded-full border border-surface bg-surface/70 px-5"
            >
              <Text className="text-[15px] text-ink">{prompt}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
