import { Link } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { Text } from "../Text";
import { GITHUB_URL, LandingButton } from "./LandingShared";

export type LandingSection = "features" | "how" | "stack";

const LINKS: { label: string; section: LandingSection }[] = [
  { label: "Features", section: "features" },
  { label: "How it works", section: "how" },
  { label: "Built with", section: "stack" },
];

export interface LandingNavProps {
  onJump: (section: LandingSection) => void;
}

/** A glass capsule that stays at the top while the page scrolls under it. */
export function LandingNav({ onJump }: LandingNavProps) {
  return (
    <View
      style={{ pointerEvents: "box-none" }}
      className="absolute left-0 right-0 top-0 z-10 items-center px-3 pt-3 lg:px-8 lg:pt-5"
    >
      <View className="lp-glass h-[60px] w-full max-w-[1116px] flex-row items-center rounded-full pl-3 pr-2">
        <Image
          source={require("../../assets/icon.png")}
          accessibilityIgnoresInvertColors
          style={{ width: 36, height: 36, borderRadius: 11 }}
        />
        <Text className="ml-2.5 text-[16px] font-semibold tracking-tight text-ink">
          AI Trip Planner
        </Text>

        <View className="ml-10 hidden flex-row gap-7 lg:flex">
          {LINKS.map((link) => (
            <Pressable key={link.section} accessibilityRole="link" onPress={() => onJump(link.section)}>
              <Text className="lp-link text-[15px] font-medium text-subtle">{link.label}</Text>
            </Pressable>
          ))}
          <Link href={GITHUB_URL} target="_blank">
            <Text className="lp-link text-[15px] font-medium text-subtle">GitHub</Text>
          </Link>
        </View>

        <View className="flex-1" />

        <View className="mr-4 hidden sm:flex">
          <Link href="/sign-in">
            <Text className="lp-link text-[15px] font-medium text-subtle">Sign in</Text>
          </Link>
        </View>
        <LandingButton label="Get started" href="/sign-up" variant="dark" />
      </View>
    </View>
  );
}
