import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { View } from "react-native";

export interface GlassCardProps {
  children: ReactNode;
}

// Shadow has no NativeWind equivalent that maps cleanly to both platforms.
const SHADOW = {
  shadowColor: "#5C3A24",
  shadowOpacity: 0.14,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 14 },
  elevation: 10,
} as const;

/**
 * Frosted panel. The blur is what makes it glass — it needs the coloured
 * shapes behind it in AuthScreenLayout to show anything at all.
 */
export function GlassCard({ children }: GlassCardProps) {
  return (
    <View
      style={SHADOW}
      className="overflow-hidden rounded-card border border-white/70"
    >
      <BlurView
        intensity={60}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
      >
        <View className="bg-[#FFFAF3]/65 px-5 py-6">{children}</View>
      </BlurView>
    </View>
  );
}
