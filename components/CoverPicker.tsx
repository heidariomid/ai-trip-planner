import { ImagePlus, Sparkles, type LucideIcon } from "lucide-react-native";
import { Image, Pressable, View, type ImageSourcePropType } from "react-native";

import { colors } from "../lib/theme";
import { Text } from "./Text";

export interface CoverPickerProps {
  /** The local URI of the picked picture, or null when there is none. */
  previewUri: string | null;
  /** The cover the trip already has. Shown until a new one is picked. */
  existing?: ImageSourcePropType;
  onPick: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

const PREVIEW_SIZE = { width: "100%", height: 160 } as const;

interface TileProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  onPress?: () => void;
  disabled: boolean;
}

function Tile({ icon: Icon, title, caption, onPress, disabled }: TileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${caption}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-[108px] flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas px-2 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <Icon size={22} color={colors.ink} />
      <Text className="mt-2 text-[14px] font-medium text-ink">{title}</Text>
      <Text className="mt-0.5 text-center text-[13px] text-subtle">{caption}</Text>
    </Pressable>
  );
}

/** Pick a cover from the gallery. Generating one is drawn here and arrives later. */
export function CoverPicker({
  previewUri,
  existing,
  onPick,
  onRemove,
  disabled = false,
}: CoverPickerProps) {
  const shown = previewUri ? { uri: previewUri } : existing;

  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 ml-1 text-[13px] font-medium text-subtle">Cover</Text>

      {shown ? (
        <View>
          <Image
            source={shown}
            resizeMode="cover"
            style={PREVIEW_SIZE}
            className="rounded-2xl bg-canvas"
            accessibilityLabel={previewUri ? "The cover you picked" : "The current cover"}
          />
          <View className="mt-1 flex-row justify-end gap-5">
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              onPress={onPick}
              className="h-11 justify-center"
            >
              <Text className="mr-1 text-[14px] font-medium text-ink">Change</Text>
            </Pressable>
            {previewUri ? (
              <Pressable
                accessibilityRole="button"
                disabled={disabled}
                onPress={onRemove}
                className="h-11 justify-center"
              >
                <Text className="mr-1 text-[14px] font-medium text-subtle">
                  {existing ? "Undo" : "Remove"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="flex-row gap-3">
          <Tile
            icon={ImagePlus}
            title="Upload image"
            caption="Choose from gallery"
            onPress={onPick}
            disabled={disabled}
          />
          <Tile icon={Sparkles} title="Generate with AI" caption="Coming soon" disabled />
        </View>
      )}
    </View>
  );
}
