import {
  ArrowUpRight,
  Check,
  Heart,
  Image as ImageIcon,
  Map,
  MapPin,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Image, View } from "react-native";

import { colors, shadows } from "../../lib/theme";
import { Text } from "../Text";
import { Container, SectionHeader } from "./LandingShared";
import { Reveal } from "./Reveal";

interface FeatureCardProps {
  title: string;
  body: string;
  children: ReactNode;
  /** Takes two of the three columns on a desktop. */
  wide?: boolean;
  /** Shares a row with one other card on a tablet, where a wide card is otherwise alone. */
  halfOnTablet?: boolean;
  /** Below a desktop the picture is as tall as what it holds, not a fixed strip. */
  fluid?: boolean;
  delay?: 0 | 1 | 2;
}

function FeatureCard({
  title,
  body,
  children,
  wide = false,
  fluid = false,
  halfOnTablet = false,
  delay = 0,
}: FeatureCardProps) {
  return (
    <Reveal
      delay={delay}
      // One column on a phone, two on a tablet, three on a desktop.
      className={`mb-5 w-full ${wide ? "lg:w-[65.8%]" : "md:w-[48.6%] lg:w-[32.2%]"} ${
        halfOnTablet ? "md:w-[48.6%]" : ""
      }`}
    >
      <View className="lp-card flex-1 overflow-hidden rounded-[32px] bg-surface">
        <View className={`overflow-hidden ${fluid ? "lg:h-[232px]" : "h-[232px]"}`}>{children}</View>
        <View className="px-7 pb-8 pt-6">
          <Text className="text-[22px] font-semibold tracking-tight text-ink">{title}</Text>
          <Text className="mt-2 text-[16px] leading-6 text-subtle">{body}</Text>
        </View>
      </View>
    </Reveal>
  );
}

/** Another app on the home screen, drawn quietly so the trip planner stands out. */
function HomeScreenApp({ name, icon: Icon }: { name: string; icon: LucideIcon }) {
  return (
    <View className="items-center">
      <View
        style={shadows.soft}
        className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-surface md:h-[68px] md:w-[68px] md:rounded-[20px]"
      >
        <Icon size={22} color={colors.muted} />
      </View>
      <Text className="mt-2 text-[12px] text-subtle">{name}</Text>
    </View>
  );
}

const SAVES = [
  { label: "Create Trip", done: true },
  { label: "Add to Trip", done: true },
  { label: "Add to Bookings", done: false },
  { label: "Add to Packing", done: false },
] as const;

const SECTIONS = ["Itinerary", "Bookings", "Packing", "Photos", "Notes"] as const;

const PEOPLE = [
  { initial: "O", name: "Omid", role: "Owner" },
  { initial: "S", name: "Sara", role: "Can edit" },
  { initial: "D", name: "Dad", role: "Can view" },
] as const;

const PLACE_PICTURE = { width: "100%", height: 118 } as const;
const COVER_PICTURE = { width: "100%", height: "100%" } as const;

/** What the app does, as a grid of cards that each show the thing itself. */
export function LandingFeatures() {
  return (
    <Container className="pt-24 lg:pt-36">
      <Reveal>
        <SectionHeader
          eyebrow="Features"
          title={
            <>
              One conversation.{"\n"}
              <Text className="font-bold text-subtle">A whole trip.</Text>
            </>
          }
          lead="The assistant does not hand you a wall of text. It proposes cards, and every card saves into a real trip you can edit."
        />
      </Reveal>

      <View className="mt-12 flex-row flex-wrap justify-between lg:mt-16">
        <FeatureCard
          wide
          fluid
          title="A plan that arrives day by day"
          body="Ask in plain words. The reply streams in with a day card for each day, times included, and it remembers the trip so it never repeats a place."
        >
          <View className="lp-wash flex-1 items-center px-5 py-7 lg:px-9 lg:py-0">
            {/* A centred column below a desktop, and a centred row on one. */}
            <View className="w-full max-w-[460px] lg:max-w-none lg:flex-1 lg:flex-row lg:items-center lg:gap-6">
              <View className="mb-3 max-w-[280px] self-end rounded-[20px] rounded-br-md bg-accent px-4 py-2.5 lg:mb-0 lg:self-center">
                <Text className="text-[15px] leading-5 text-white">
                  Two days in Chicago, we love architecture and jazz
                </Text>
              </View>
              <View
                style={shadows.soft}
                className="w-full rounded-3xl rounded-bl-md bg-surface px-5 py-4 lg:w-auto lg:flex-1 lg:self-center"
              >
                <Text className="mb-2 text-[14px] font-semibold text-ink">Day 1 · The Loop</Text>
                {[
                  ["10:00", "Architecture river cruise"],
                  ["13:30", "Millennium Park"],
                  ["20:00", "Live jazz at the Green Mill"],
                ].map(([time, place]) => (
                  <View key={time} className="flex-row items-center py-1.5">
                    <Text className="w-14 text-[13px] font-medium text-subtle">{time}</Text>
                    <Text numberOfLines={1} className="flex-1 text-[14px] text-ink">
                      {place}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FeatureCard>

        <FeatureCard
          delay={1}
          title="Saved with one tap"
          body="The model only proposes. Nothing is written until you tap, so the trip is always yours."
        >
          <View className="flex-1 justify-center gap-2.5 bg-canvas px-7">
            {SAVES.map((save) => (
              <View
                key={save.label}
                className={`h-10 flex-row items-center justify-between rounded-full px-4 ${
                  save.done ? "bg-surface" : "border border-line bg-surface"
                }`}
              >
                <Text
                  className={`text-[14px] font-semibold ${save.done ? "text-muted" : "text-ink"}`}
                >
                  {save.done ? "Added" : save.label}
                </Text>
                {save.done ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check size={12} color={colors.surface} strokeWidth={3} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </FeatureCard>

        <FeatureCard
          title="Real places, real photos"
          body="Place cards come with a photo and open in Google Maps. Tap the heart to keep one for later."
        >
          <View className="flex-1 items-center justify-end bg-canvas">
            <View className="w-[230px] rounded-t-3xl bg-surface p-3">
              <View>
                <Image
                  source={require("../../assets/explore/chicago.jpg")}
                  resizeMode="cover"
                  style={PLACE_PICTURE}
                  className="rounded-2xl bg-canvas"
                  accessible={false}
                />
                <View className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-surface">
                  <Heart size={16} color={colors.heart} fill={colors.heart} />
                </View>
              </View>
              <View className="mt-2.5 flex-row items-center px-1">
                <Text className="text-[15px] font-semibold text-ink">Chicago Riverwalk</Text>
                <ArrowUpRight size={14} color={colors.subtle} />
              </View>
              <View className="mt-1 flex-row items-center px-1 pb-1">
                <MapPin size={12} color={colors.subtle} />
                <Text className="ml-1 text-[12px] text-subtle">Chicago, United States</Text>
              </View>
            </View>
          </View>
        </FeatureCard>

        <FeatureCard
          delay={1}
          title="Everything in one trip"
          body="Flights, hotels, car rentals, a packing list, photos, and notes, with a progress bar that fills as you go."
        >
          <View className="flex-1 justify-center bg-canvas px-7">
            <View className="flex-row flex-wrap gap-2">
              {SECTIONS.map((section, index) => (
                <View
                  key={section}
                  className={`h-9 justify-center rounded-full px-4 ${
                    index === 0 ? "bg-ink" : "bg-surface"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-medium ${index === 0 ? "text-white" : "text-subtle"}`}
                  >
                    {section}
                  </Text>
                </View>
              ))}
            </View>
            <View className="mt-5 rounded-2xl bg-surface p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-subtle">Planning progress</Text>
                <Text className="text-[15px] font-bold text-ink">74%</Text>
              </View>
              <View className="mt-2.5 h-1.5 rounded-full bg-canvas">
                <View className="h-1.5 w-[74%] rounded-full bg-accent" />
              </View>
            </View>
          </View>
        </FeatureCard>

        <FeatureCard
          delay={2}
          title="Plan it together"
          body="Share a join code. Family can edit with you or just follow along, and only you can delete the trip."
        >
          <View className="flex-1 justify-center bg-canvas px-7">
            <View className="items-center rounded-2xl bg-surface py-3.5">
              <Text className="text-[11px] text-subtle">Join code</Text>
              <Text className="mt-0.5 text-[24px] font-bold tracking-[4px] text-ink">KQ7M-2XPA</Text>
            </View>
            <View className="mt-3 flex-row gap-2">
              {PEOPLE.map((person) => (
                <View key={person.name} className="flex-1 items-center rounded-2xl bg-surface py-2.5">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
                    <Text className="text-[13px] font-semibold text-accent">{person.initial}</Text>
                  </View>
                  <Text className="mt-1.5 text-[12px] font-medium text-ink">{person.name}</Text>
                  <Text className="text-[10px] text-subtle">{person.role}</Text>
                </View>
              ))}
            </View>
          </View>
        </FeatureCard>

        <FeatureCard
          title="A cover drawn for your trip"
          body="No photo? Generate one. Every trip gets a picture that looks like where you are going."
        >
          <View className="flex-1">
            <Image
              source={require("../../assets/explore/tahoe.jpg")}
              resizeMode="cover"
              style={COVER_PICTURE}
              accessible={false}
            />
            <View className="lp-glass absolute bottom-4 left-4 h-10 flex-row items-center rounded-full px-4">
              <Sparkles size={15} color={colors.ink} />
              <Text className="ml-2 text-[13px] font-semibold text-ink">Generated with AI</Text>
            </View>
          </View>
        </FeatureCard>

        <FeatureCard
          wide
          halfOnTablet
          delay={1}
          title="An app without the app store"
          body="Open it in a browser on a laptop, or add it to your phone's home screen and it launches full screen like any other app. Same account, same trips."
        >
          <View className="lp-wash flex-1 flex-row items-center justify-center gap-3 px-4 md:gap-4 lg:gap-9">
            <HomeScreenApp name="Maps" icon={Map} />
            <HomeScreenApp name="Photos" icon={ImageIcon} />
            <View className="lp-float items-center">
              <Image
                source={require("../../assets/icon.png")}
                accessibilityIgnoresInvertColors
                style={{ width: 72, height: 72, borderRadius: 21 }}
              />
              <Text className="mt-2 text-[12px] font-semibold text-ink">Trip Planner</Text>
            </View>
            <HomeScreenApp name="Phone" icon={Smartphone} />
          </View>
        </FeatureCard>
      </View>
    </Container>
  );
}
