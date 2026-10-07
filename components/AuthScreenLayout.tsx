import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "./Card";
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
    </View>
  );
}
