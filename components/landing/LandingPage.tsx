import { useIsFocused } from "expo-router";
import { useRef } from "react";
import { View } from "react-native";

import { ensureLandingStyles } from "../../lib/landing-styles";
import { DocumentScroll } from "./DocumentScroll";
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
  const isFocused = useIsFocused();
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

  // The stack keeps this screen mounted under Sign In, and the page owns the
  // document's scrolling while it is drawn.
  if (!isFocused) return null;

  return (
    <DocumentScroll>
      <View className="lp-backdrop lp-mesh" />
      <View>
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
      </View>
      <LandingNav onJump={jumpTo} />
    </DocumentScroll>
  );
}
