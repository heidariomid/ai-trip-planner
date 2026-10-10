import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContentWidth } from "../hooks/useLayout";
import { useTabBarClearance } from "../hooks/useTabBar";
import { Text } from "./Text";

export interface ScreenProps {
  title: string;
  children: ReactNode;
  /** For a tab whose content can be taller than the screen. */
  scroll?: boolean;
}

/** A tab screen: canvas, safe area, title, capped width, room for the tab bar. */
export function Screen({ title, children, scroll = false }: ScreenProps) {
  const paddingBottom = useTabBarClearance();
  const maxWidth = useContentWidth("form");

  const content = (
    <View style={{ maxWidth }} className={`w-full ${scroll ? "" : "flex-1"}`}>
      <Text className="mb-6 text-[32px] font-bold leading-tight tracking-tight text-ink">
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom,
            }}
          >
            {content}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center px-5 pt-4" style={{ paddingBottom }}>
            {content}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
