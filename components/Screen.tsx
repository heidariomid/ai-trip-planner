import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarClearance } from "../hooks/useTabBar";
import { Text } from "./Text";

export interface ScreenProps {
  title: string;
  children: ReactNode;
}

/** A tab screen that does not scroll: canvas, safe area, title, capped width. */
export function Screen({ title, children }: ScreenProps) {
  const paddingBottom = useTabBarClearance();

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-1 items-center px-5 pt-4" style={{ paddingBottom }}>
          <View className="w-full max-w-[380px] flex-1">
            <Text className="mb-6 text-[32px] font-bold leading-tight tracking-tight text-ink">
              {title}
            </Text>
            {children}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
