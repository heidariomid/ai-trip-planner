import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Briefcase, House, User, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { useIsWide } from "../hooks/useLayout";
import { useTabBarOffset } from "../hooks/useTabBar";
import { colors, shadows } from "../lib/theme";
import { Text } from "./Text";

const ICONS: Record<string, LucideIcon> = {
  index: House,
  trips: Briefcase,
  profile: User,
};

/** The floating capsule. It sits over the content, so each tab pads its own list. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const bottom = useTabBarOffset();
  const isWide = useIsWide();

  // A desktop has the sidebar.
  if (isWide) return null;

  return (
    <View
      style={{ bottom, pointerEvents: "box-none" }}
      className="absolute left-0 right-0 items-center px-5"
    >
      <View
        style={shadows.soft}
        className="h-[68px] w-full max-w-[380px] flex-row items-center rounded-full bg-surface px-1.5"
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = ICONS[route.name] ?? House;
          const label = descriptors[route.key].options.title ?? route.name;

          function handlePress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={handlePress}
              className={`h-14 flex-1 items-center justify-center rounded-full ${
                isFocused ? "bg-accent-soft" : ""
              }`}
            >
              <Icon size={22} color={isFocused ? colors.accent : colors.subtle} />
              <Text
                className={`mt-1 text-[12px] font-medium ${
                  isFocused ? "text-accent" : "text-subtle"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
