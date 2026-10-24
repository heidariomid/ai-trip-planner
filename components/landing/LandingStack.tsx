import { ArrowUpRight } from "lucide-react-native";
import { View } from "react-native";

import { colors } from "../../lib/theme";
import { Text } from "../Text";
import { Container, GITHUB_URL, LandingButton, SectionHeader } from "./LandingShared";
import { Reveal } from "./Reveal";

const STACK = [
  {
    name: "Expo and React Native",
    detail: "One TypeScript codebase for the web, iOS, and Android, with Expo Router.",
  },
  {
    name: "Supabase Postgres",
    detail: "A relational schema where row-level security guards every table.",
  },
  {
    name: "Edge Functions",
    detail: "Every model call runs on the server, so no key ever ships in the app.",
  },
  {
    name: "Google Gemini",
    detail: "Replies stream over server-sent events and end in structured cards.",
  },
  {
    name: "Cloudflare Workers AI",
    detail: "Trip covers are generated with FLUX, capped per traveller per day.",
  },
  {
    name: "NativeWind and Vercel",
    detail: "A single-source theme in Tailwind classes, deployed on every push.",
  },
] as const;

const NUMBERS = [
  { value: "17", label: "features shipped, spec by spec" },
  { value: "22", label: "database migrations" },
  { value: "4", label: "Edge Functions" },
  { value: "0", label: "secrets in the bundle" },
] as const;

/** For the reader who wants to know how it was made. */
export function LandingStack() {
  return (
    <Container className="pt-24 lg:pt-36">
      <Reveal className="items-center">
        <SectionHeader
          eyebrow="Built with"
          title="Real product, real stack."
          lead="Designed and built end to end as a production app: auth, a relational database, storage, streaming AI, and a public release."
        />
        <View className="mt-8">
          <LandingButton
            label="View the source"
            href={GITHUB_URL}
            variant="outline"
            size="large"
            external
            icon={<ArrowUpRight size={18} color={colors.ink} />}
          />
        </View>
      </Reveal>

      <View className="mt-14 flex-row flex-wrap justify-between lg:mt-20">
        {NUMBERS.map((number, index) => (
          <Reveal
            key={number.label}
            delay={index as 0 | 1 | 2 | 3}
            className="mb-8 w-[48%] items-center md:w-[23%]"
          >
            <Text className="text-center text-[48px] font-bold leading-[52px] tracking-tighter text-ink lg:text-[64px] lg:leading-[68px]">
              {number.value}
            </Text>
            <Text className="mt-1 text-center text-[14px] leading-5 text-subtle">
              {number.label}
            </Text>
          </Reveal>
        ))}
      </View>

      <View className="mt-4 flex-row flex-wrap justify-between">
        {STACK.map((item, index) => (
          <Reveal
            key={item.name}
            delay={(index % 3) as 0 | 1 | 2}
            className="w-full border-t border-ink/10 py-5 md:w-[48%] lg:w-[31.5%]"
          >
            <Text className="text-[17px] font-semibold tracking-tight text-ink">{item.name}</Text>
            <Text className="mt-1.5 text-[15px] leading-[22px] text-subtle">{item.detail}</Text>
          </Reveal>
        ))}
      </View>
    </Container>
  );
}
