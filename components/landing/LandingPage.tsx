import { useRef } from "react";
import { ScrollView, View } from "react-native";

import { ensureLandingStyles } from "../../lib/landing-styles";
import { LandingDestinations } from "./LandingDestinations";
import { LandingFeatures } from "./LandingFeatures";
import { LandingFooter } from "./LandingFooter";
import { LandingHero } from "./LandingHero";
import { LandingNav, type LandingSection } from "./LandingNav";
import { LandingStack } from "./LandingStack";
import { LandingSteps } from "./LandingSteps";

// Before the first render, so nothing is drawn without its styles.
ensureLandingStyles();

/**
 * What someone sees when they open the site signed out: what the app is, and
 * the way in. It only exists on the web.
 */
export function LandingPage() {
  const sections = useRef<Partial<Record<LandingSection, View | null>>>({});

  function remember(section: LandingSection) {
    return (view: View | null) => {
      sections.current[section] = view;
    };
  }

  // On the web a View's ref is its element, and the browser does the scrolling.
  function jumpTo(section: LandingSection) {
    const element = sections.current[section] as unknown as Element | null | undefined;
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <View className="lp-mesh flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <LandingHero />
        <View ref={remember("features")} className="lp-anchor">
          <LandingFeatures />
        </View>
        <View ref={remember("how")} className="lp-anchor">
          <LandingSteps />
        </View>
        <LandingDestinations />
        <View ref={remember("stack")} className="lp-anchor">
          <LandingStack />
        </View>
        <LandingFooter />
      </ScrollView>
      <LandingNav onJump={jumpTo} />
    </View>
  );
}
