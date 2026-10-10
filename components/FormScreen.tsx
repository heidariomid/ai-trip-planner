import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useContentWidth } from "../hooks/useLayout";
import { colors, shadows } from "../lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

export interface FormScreenProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
}

/** A pushed screen holding one form: back button, title, card, keyboard handling. */
export function FormScreen({ title, onBack, children }: FormScreenProps) {
  const maxWidth = useContentWidth("form");

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center px-5 pb-10 pt-4">
              <View style={{ maxWidth }} className="w-full">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={onBack}
                  style={shadows.soft}
                  className="mb-5 h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-canvas"
                >
                  <ArrowLeft size={20} color={colors.ink} />
                </Pressable>

                <Text className="mb-6 ml-1 text-[32px] font-bold leading-tight tracking-tight text-ink">
                  {title}
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
