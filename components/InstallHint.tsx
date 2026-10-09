import { EllipsisVertical, Share, SquarePlus, X, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import {
  canPromptInstall,
  dismissInstallHint,
  getInstallDevice,
  isInstallHintDismissed,
  promptInstall,
  subscribeToInstallPrompt,
  type InstallDevice,
} from "../lib/install";
import { colors, shadows } from "../lib/theme";
import { Button } from "./Button";
import { Text } from "./Text";

interface Step {
  icon: LucideIcon;
  label: string;
}

const STEPS: Record<InstallDevice, Step[]> = {
  ios: [
    { icon: Share, label: "Tap Share" },
    { icon: SquarePlus, label: "Add to Home Screen" },
  ],
  android: [
    { icon: EllipsisVertical, label: "Open the browser menu" },
    { icon: SquarePlus, label: "Add to Home screen" },
  ],
};

/**
 * How to put the app on the home screen, shown before sign-in: an iPhone
 * keeps a home screen app's sign-in apart from Safari's, so installing first
 * saves signing in twice. It draws nothing in the native app, on a desktop
 * browser, when opened from the home screen icon, or once it was closed.
 */
export function InstallHint() {
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
    <View style={shadows.soft} className="mb-6 rounded-2xl bg-surface py-3 pl-4 pr-2">
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-ink">Add it to your home screen</Text>
          <Text className="mt-0.5 text-[13px] leading-[18px] text-subtle">
            Do this before you sign in, so you only sign in once.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
        >
          <X size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View className="mr-2 mt-2">
        {STEPS[device].map(({ icon: Icon, label }, index) => (
          <View key={label} className="mt-2 flex-row items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Icon size={18} color={colors.ink} />
            </View>
            <Text className="ml-3 text-[14px] text-subtle">{index + 1}.</Text>
            <Text className="ml-1 flex-1 text-[14px] font-medium text-ink">{label}</Text>
          </View>
        ))}
      </View>

      {device === "android" && canPrompt ? (
        <View className="mb-1 mr-2 mt-4">
          <Button label="Install app" variant="secondary" onPress={() => void install()} />
        </View>
      ) : null}
    </View>
  );
}
