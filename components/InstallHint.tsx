import { Check, EllipsisVertical, Share, SquarePlus, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  canPromptInstall,
  dismissInstallHint,
  getInstallDevice,
  isInstallHintDismissed,
  promptInstall,
  subscribeToInstallPrompt,
  type InstallDevice,
} from "../lib/install";
import { colors } from "../lib/theme";
import { Button } from "./Button";
import { Text } from "./Text";

interface Step {
  icon: LucideIcon;
  label: string;
}

const STEPS: Record<InstallDevice, Step[]> = {
  ios: [
    { icon: Share, label: "Tap Share in the browser bar" },
    { icon: SquarePlus, label: "Choose Add to Home Screen" },
    { icon: Check, label: "Tap Add" },
  ],
  android: [
    { icon: EllipsisVertical, label: "Open the browser menu" },
    { icon: SquarePlus, label: "Choose Add to Home screen" },
    { icon: Check, label: "Tap Add" },
  ],
};

/**
 * How to put the app on the home screen, shown before sign-in: an iPhone
 * keeps a home screen app's sign-in apart from Safari's, so installing first
 * saves signing in twice. It is a sheet at the bottom that goes away with
 * "Got it" and does not come back. It draws nothing in the native app, on a
 * desktop browser, when opened from the home screen icon, or once it was closed.
 */
export function InstallHint() {
  const { bottom } = useSafeAreaInsets();
  // Read after the first render: the device is only known in the browser.
  const [device, setDevice] = useState<InstallDevice | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    if (!isInstallHintDismissed()) setDevice(getInstallDevice());
    setCanPrompt(canPromptInstall());
    return subscribeToInstallPrompt(() => setCanPrompt(canPromptInstall()));
  }, []);

  if (!device) return null;

  function close() {
    dismissInstallHint();
    setDevice(null);
  }

  async function install() {
    if (await promptInstall()) setDevice(null);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close"
          onPress={close}
          className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
        />
        <View
          className="w-full max-w-[480px] self-center rounded-t-card bg-surface px-5 pt-3"
          style={{ paddingBottom: Math.max(bottom, 12) + 8 }}
        >
          <View className="h-1 w-10 self-center rounded-full bg-line" />

          <Image
            source={require("../assets/icon.png")}
            accessibilityIgnoresInvertColors
            style={{ width: 56, height: 56, borderRadius: 14, alignSelf: "center", marginTop: 20 }}
          />
          <Text className="mt-4 text-center text-[20px] font-semibold tracking-tight text-ink">
            Add AI Trip Planner to your home screen
          </Text>
          <Text className="mt-1.5 text-center text-[14px] leading-5 text-subtle">
            Do this before you sign in, so you only sign in once.
          </Text>

          <View className="mt-5 h-px bg-line" />

          <View className="mt-2">
            {STEPS[device].map(({ icon: Icon, label }, index) => (
              <View key={label} className="mt-3 flex-row items-center">
                <Text className="w-5 text-[15px] text-subtle">{index + 1}.</Text>
                <Text className="flex-1 text-[15px] font-medium text-ink">{label}</Text>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
                  <Icon size={18} color={colors.ink} />
                </View>
              </View>
            ))}
          </View>

          <View className="mt-6">
            <Button label="Got it" onPress={close} fullWidth />
          </View>
          {device === "android" && canPrompt ? (
            <View className="mt-3">
              <Button
                label="Install app"
                variant="secondary"
                onPress={() => void install()}
                fullWidth
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
