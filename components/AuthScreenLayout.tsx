import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "./Card";
import { InstallHint } from "./InstallHint";
import { Text } from "./Text";

export interface AuthScreenLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Scroll + keyboard handling shared by Sign In and Sign Up. Without the
 * KeyboardAvoidingView the keyboard sits on top of the submit button, which no
 * amount of code review catches — only a device does.
 */
export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center px-5 py-10">
              <View className="w-full max-w-[380px]">
                <View className="mb-6 ml-1 flex-row items-center">
                  <Image
                    source={require("../assets/icon.png")}
                    accessibilityIgnoresInvertColors
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-semibold text-ink">AI Trip Planner</Text>
                    <Text className="text-[13px] leading-[18px] text-subtle">
                      Plan a trip day by day with an AI assistant.
                    </Text>
                  </View>
                </View>
                <Text className="ml-1 text-[32px] font-bold leading-tight tracking-tight text-ink">
                  {title}
                </Text>
                <Text className="mb-6 ml-1 mt-1.5 text-[15px] leading-5 text-subtle">
                  {subtitle}
                </Text>

                <Card>{children}</Card>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <InstallHint />
    </View>
  );
}
