import { Pencil, Trash2, type LucideIcon } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../lib/theme";
import { Card } from "./Card";
import { Text } from "./Text";

export interface TripMenuProps {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

function MenuRow({ icon: Icon, label, onPress }: MenuRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-12 flex-row items-center rounded-2xl px-2 active:bg-canvas"
    >
      <Icon size={18} color={colors.ink} />
      <Text className="ml-3 text-[16px] font-medium text-ink">{label}</Text>
    </Pressable>
  );
}

/** The banner's options, as a sheet at the bottom of the screen. */
export function TripMenu({ visible, onEdit, onDelete, onClose }: TripMenuProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 items-center justify-end px-5"
        style={{ paddingBottom: Math.max(bottom, 12) + 8 }}
      >
        <Pressable
          accessibilityLabel="Close the options"
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
        />
        <View className="w-full max-w-[380px]">
          <Card>
            <MenuRow icon={Pencil} label="Edit trip" onPress={onEdit} />
            <MenuRow icon={Trash2} label="Delete trip" onPress={onDelete} />
          </Card>
        </View>
      </View>
    </Modal>
  );
}
