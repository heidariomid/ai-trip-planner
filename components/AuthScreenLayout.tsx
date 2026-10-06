import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "./GlassCard";

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
    <View className="flex-1 bg-sand">
      <LinearGradient
        colors={["#FDF7EF", "#FBECDC", "#F8E3D6"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Colour behind the frosted card. Without these the blur has nothing
          to pick up and the glass reads as flat grey. */}
      <View pointerEvents="none" className="absolute -left-24 -top-12 h-72 w-72 rounded-full bg-amber-300/45" />
      <View pointerEvents="none" className="absolute -right-24 top-36 h-64 w-64 rounded-full bg-orange-400/30" />
      <View pointerEvents="none" className="absolute -bottom-20 left-8 h-72 w-72 rounded-full bg-rose-300/30" />

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

                <GlassCard>{children}</GlassCard>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
