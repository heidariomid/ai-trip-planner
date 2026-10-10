import { View } from "react-native";

import { Text } from "../Text";
import { Container, SectionHeader } from "./LandingShared";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Say where",
    body: "Type it the way you would tell a friend. A place, a number of days, what you like. That is the whole brief.",
  },
  {
    title: "Shape the plan",
    body: "Edit a day card, swap a stop, ask for three hotels to choose from, or have the whole reply written again.",
  },
  {
    title: "Save and go",
    body: "One tap turns the plan into a trip with its days, bookings, and packing list. Tick things off as you travel.",
  },
] as const;

/** The three steps from a sentence to a trip. */
export function LandingSteps() {
  return (
    <Container className="pt-24 lg:pt-36">
      <Reveal>
        <SectionHeader eyebrow="How it works" title="From a sentence to a suitcase." />
      </Reveal>

      <View className="mt-12 md:flex-row md:gap-6 lg:mt-16">
        {STEPS.map((step, index) => (
          <Reveal
            key={step.title}
            delay={index as 0 | 1 | 2}
            // On a phone the number sits beside its text, so a step fills the
            // width. From a tablet up the three stand side by side.
            className="mb-8 flex-row border-t border-ink/10 pt-6 md:mb-0 md:flex-1 md:flex-col"
          >
            <Text className="w-[92px] text-[52px] font-bold leading-[52px] tracking-tighter text-muted md:w-auto md:text-[72px] md:leading-[72px] lg:text-[88px] lg:leading-[88px]">
              0{index + 1}
            </Text>
            <View className="flex-1 md:mt-5 md:flex-none">
              <Text className="text-[24px] font-semibold tracking-tight text-ink">
                {step.title}
              </Text>
              <Text className="mt-2.5 text-[16px] leading-6 text-subtle md:max-w-[340px]">
                {step.body}
              </Text>
            </View>
          </Reveal>
        ))}
      </View>
    </Container>
  );
}
