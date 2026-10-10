import { usePathname, useRouter, type Href } from "expo-router";
import { Briefcase, Compass, House, Sparkles, User, type LucideIcon } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

interface SidebarItem {
  label: string;
  href: Href;
  icon: LucideIcon;
  /** The paths this item stays lit for. */
  matches: (path: string) => boolean;
}

const ITEMS: SidebarItem[] = [
  { label: "Home", href: "/", icon: House, matches: (path) => path === "/" },
  {
    label: "My Trips",
    href: "/trips",
    icon: Briefcase,
    matches: (path) =>
      path.startsWith("/trip") || path === "/create-trip" || path === "/join-trip",
  },
  {
    label: "Explore",
    href: "/explore",
    icon: Compass,
    matches: (path) => path.startsWith("/explore"),
  },
  {
    label: "Assistant",
    href: "/chat",
    icon: Sparkles,
    matches: (path) => path.startsWith("/chat"),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    matches: (path) =>
      path === "/profile" || path === "/edit-profile" || path === "/saved-places",
  },
];

export const SIDEBAR_WIDTH = 248;

/** The desktop's navigation. It stands in for the floating tab bar. */
export function Sidebar() {
  const router = useRouter();
  const path = usePathname();

  return (
    <View
      accessibilityRole="tablist"
      style={{ width: SIDEBAR_WIDTH }}
      className="border-r border-line bg-surface px-4 py-6"
    >
      <View className="mb-8 flex-row items-center px-2">
        <Image
          source={require("../assets/icon.png")}
          accessibilityIgnoresInvertColors
          style={{ width: 36, height: 36, borderRadius: 10 }}
        />
        <Text className="ml-3 text-[16px] font-semibold tracking-tight text-ink">
          AI Trip Planner
        </Text>
      </View>

      {ITEMS.map((item) => {
        const isActive = item.matches(path);
        const Icon = item.icon;

        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            onPress={() => router.navigate(item.href)}
            className={`mb-1 h-12 flex-row items-center rounded-full px-4 ${
              isActive ? "bg-accent-soft" : "hover:bg-canvas active:bg-canvas"
            }`}
          >
            <Icon size={20} color={isActive ? colors.accent : colors.subtle} />
            <Text
              className={`ml-3 text-[15px] font-medium ${
                isActive ? "text-accent" : "text-subtle"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
