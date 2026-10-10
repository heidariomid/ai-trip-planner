import { Link } from "expo-router";
import { ArrowRight, Plane } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { openPrivacyPolicy } from "../../lib/links";
import { colors } from "../../lib/theme";
import { Text } from "../Text";
import { Container, GITHUB_URL, LandingButton } from "./LandingShared";
import { Reveal } from "./Reveal";

/** The last call to action, and the small print under it. */
export function LandingFooter() {
  return (
    <Container className="pb-10 pt-24 lg:pt-36">
      <Reveal>
        <View className="lp-cloud items-center rounded-[40px] px-6 py-16 lg:py-24">
          <View className="lp-seal h-16 w-16 items-center justify-center rounded-full bg-surface">
            <Plane size={26} color={colors.ink} fill={colors.ink} />
          </View>
          <Text className="mt-8 text-center text-[30px] font-bold leading-[36px] tracking-tighter text-ink md:text-[48px] md:leading-[54px] lg:text-[64px] lg:leading-[68px]">
            Your next trip is{"\n"}one sentence away<Text className="font-bold text-muted">.</Text>
          </Text>
          <Text className="mt-5 max-w-[460px] text-center text-[17px] leading-7 text-subtle lg:text-[19px]">
            Create a free account and ask for your first plan. It takes less
            time than choosing a hotel.
          </Text>
          <View className="mt-9">
            <LandingButton
              label="Start planning free"
              href="/sign-up"
              size="large"
              icon={<ArrowRight size={20} color={colors.surface} />}
            />
          </View>
          <Text className="mt-6 text-center text-[13px] uppercase tracking-[2px] text-muted">
            Free · No install · Any device
          </Text>
        </View>
      </Reveal>

      <View className="mt-10 flex-row flex-wrap items-center justify-between gap-4">
        <View className="max-w-full flex-row items-center">
          <Image
            source={require("../../assets/icon.png")}
            accessibilityIgnoresInvertColors
            style={{ width: 28, height: 28, borderRadius: 8 }}
          />
          <Text className="ml-2.5 shrink text-[14px] leading-5 text-subtle">
            AI Trip Planner · Designed and built by Omid Heidari
          </Text>
        </View>
        <View className="flex-row gap-6">
          <Link href={GITHUB_URL} target="_blank">
            <Text className="lp-link text-[14px] font-medium text-subtle">GitHub</Text>
          </Link>
          <Pressable accessibilityRole="link" onPress={() => void openPrivacyPolicy()}>
            <Text className="lp-link text-[14px] font-medium text-subtle">Privacy</Text>
          </Pressable>
          <Link href="/sign-in">
            <Text className="lp-link text-[14px] font-medium text-subtle">Sign in</Text>
          </Link>
        </View>
      </View>
    </Container>
  );
}
