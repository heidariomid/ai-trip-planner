import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { Text } from "../Text";

export const GITHUB_URL = "https://github.com/heidariomid/ai-trip-planner";

/** The page's column: wide on a desktop, with a phone's gutters on a phone. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View className={`w-full max-w-[1180px] self-center px-5 lg:px-8 ${className}`}>
      {children}
    </View>
  );
}

export interface SectionHeaderProps {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
}

/** A section's opening lines, centred on the page: small caps, the headline, and one sentence. */
export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <View className="items-center">
      <Text className="text-center text-[12px] font-semibold uppercase tracking-[3px] text-accent">
        {eyebrow}
      </Text>
      <Text className="mt-3 text-center text-[34px] font-bold leading-[40px] tracking-tight text-ink lg:text-[52px] lg:leading-[58px]">
        {title}
      </Text>
      {lead ? (
        <Text className="mt-4 max-w-[600px] text-center text-[17px] leading-7 text-subtle lg:text-[19px]">
          {lead}
        </Text>
      ) : null}
    </View>
  );
}

const BUTTON = {
  primary: "bg-accent",
  dark: "bg-ink",
  light: "bg-surface",
  outline: "border border-line bg-surface",
} as const;

const BUTTON_LABEL = {
  primary: "text-white",
  dark: "text-white",
  light: "text-ink",
  outline: "text-ink",
} as const;

export interface LandingButtonProps {
  label: string;
  href: Href;
  variant?: keyof typeof BUTTON;
  size?: "regular" | "large";
  icon?: ReactNode;
  /** For a link that leaves the site. */
  external?: boolean;
  /** As wide as its container below a desktop, where buttons stack, and as wide as its label on one. */
  stretch?: boolean;
}

/** A capsule that is a real link, so it can be opened in a new tab. */
export function LandingButton({
  label,
  href,
  variant = "primary",
  size = "regular",
  icon,
  external = false,
  stretch = false,
}: LandingButtonProps) {
  return (
    <Link href={href} asChild target={external ? "_blank" : undefined}>
      <Pressable
        accessibilityRole="link"
        className={`lp-press flex-row items-center justify-center rounded-full ${BUTTON[variant]} ${
          size === "large" ? "h-14 px-8" : "h-11 px-5"
        } ${stretch ? "w-full lg:w-auto" : ""}`}
      >
        <Text
          className={`font-semibold tracking-tight ${BUTTON_LABEL[variant]} ${
            size === "large" ? "text-[17px]" : "text-[15px]"
          }`}
        >
          {label}
        </Text>
        {icon ? <View className="ml-2">{icon}</View> : null}
      </Pressable>
    </Link>
  );
}
