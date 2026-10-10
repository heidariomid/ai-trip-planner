import { Heart, LogOut, Pencil, User, type LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../lib/theme";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";

export interface ProfileMenuProps {
  visible: boolean;
  name: string;
  email: string;
  onOpenProfile: () => void;
  onEditProfile: () => void;
  onOpenSavedPlaces: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
  /** Why signing out did not work, shown above the rows. */
  error: string | null;
  onClose: () => void;
}

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}

function MenuRow({ icon: Icon, label, onPress, disabled = false, busy = false }: MenuRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      className={`h-12 flex-row items-center rounded-2xl px-2 active:bg-canvas ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <Icon size={18} color={colors.ink} />
      <Text className="ml-3 flex-1 text-[16px] font-medium text-ink">{label}</Text>
      {busy ? <ActivityIndicator size="small" color={colors.ink} /> : null}
    </Pressable>
  );
}

/** What the avatar on Home opens: the account's shortcuts and Sign out, as a sheet at the bottom. */
export function ProfileMenu({
  visible,
  name,
  email,
  onOpenProfile,
  onEditProfile,
  onOpenSavedPlaces,
  onSignOut,
  isSigningOut,
  error,
  onClose,
}: ProfileMenuProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-end px-5"
        style={{ paddingBottom: Math.max(bottom, 12) + 8 }}
      >
        <Pressable
          accessibilityLabel="Close the menu"
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
        />
        <View className="w-full max-w-[380px]">
          <Card>
            <View className="mb-3 px-2">
              <Text numberOfLines={1} className="text-[16px] font-semibold text-ink">
                {name}
              </Text>
              {email && email !== name ? (
                <Text numberOfLines={1} className="mt-0.5 text-[13px] text-subtle">
                  {email}
                </Text>
              ) : null}
            </View>

            <FormMessage message={error} />

            <MenuRow icon={User} label="Profile" onPress={onOpenProfile} />
            <MenuRow icon={Pencil} label="Edit profile" onPress={onEditProfile} />
            <MenuRow icon={Heart} label="Saved places" onPress={onOpenSavedPlaces} />
            <View className="my-2 h-px bg-line" />
            <MenuRow
              icon={LogOut}
              label="Sign out"
              onPress={onSignOut}
              disabled={isSigningOut}
              busy={isSigningOut}
            />
          </Card>
        </View>
      </View>
    </Modal>
  );
}
