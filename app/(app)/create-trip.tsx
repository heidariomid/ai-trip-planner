import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../../components/Card";
import { Text } from "../../components/Text";
import { TripForm } from "../../components/TripForm";
import { useTripForm } from "../../hooks/useTripForm";
import { colors, shadows } from "../../lib/theme";

export default function CreateTripScreen() {
  const router = useRouter();
  const form = useTripForm();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/trips");
  }

  async function handleSave() {
    if (await form.save()) close();
  }

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
              <View className="w-full max-w-[380px]">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  onPress={close}
                  style={shadows.soft}
                  className="mb-5 h-11 w-11 items-center justify-center rounded-full bg-surface active:bg-canvas"
                >
                  <ArrowLeft size={20} color={colors.ink} />
                </Pressable>

                <Text className="mb-6 ml-1 text-[32px] font-bold leading-tight tracking-tight text-ink">
                  Add a trip
                </Text>

                <Card>
                  <TripForm form={form} onSave={() => void handleSave()} onDone={close} />
                </Card>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
