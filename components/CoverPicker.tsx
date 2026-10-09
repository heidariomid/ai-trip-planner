import { ImagePlus, Sparkles, type LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  View,
  type ImageSourcePropType,
} from "react-native";

import { pluralize } from "../lib/dates";
import { colors } from "../lib/theme";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";

export interface CoverPickerProps {
  /** The local URI of the picked or generated picture, or null when there is none. */
  previewUri: string | null;
  /** The cover the trip already has. Shown until a new one is picked. */
  existing?: ImageSourcePropType;
  onPick: () => void;
  onRemove: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  /** Generations left today, or null while that is not known. */
  generationsLeft: number | null;
  /** Why the last generation gave no picture. */
  error: string | null;
  disabled?: boolean;
}

const PREVIEW_SIZE = { width: "100%", height: 160 } as const;

function describeLeft(left: number | null): string {
  if (left === null) return "From your trip details";
  return left === 0 ? "Back tomorrow" : `${left} left today`;
}

interface TileProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  onPress: () => void;
  disabled: boolean;
  busy?: boolean;
}

function Tile({ icon: Icon, title, caption, onPress, disabled, busy = false }: TileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${caption}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      className={`h-[108px] flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-canvas px-2 ${
        disabled && !busy ? "opacity-45" : ""
      }`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Icon size={22} color={colors.ink} />
      )}
      <Text className="mt-2 text-[14px] font-medium text-ink">{title}</Text>
      <Text className="mt-0.5 text-center text-[13px] text-subtle">{caption}</Text>
    </Pressable>
  );
}

interface TextActionProps {
  label: string;
  onPress: () => void;
  disabled: boolean;
  quiet?: boolean;
}

function TextAction({ label, onPress, disabled, quiet = false }: TextActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-11 justify-center ${disabled ? "opacity-45" : ""}`}
    >
      <Text className={`mr-1 text-[14px] font-medium ${quiet ? "text-subtle" : "text-ink"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Pick a cover from the gallery, or have one generated from the trip's details. */
export function CoverPicker({
  previewUri,
  existing,
  onPick,
  onRemove,
  onGenerate,
  isGenerating,
  generationsLeft,
  error,
  disabled = false,
}: CoverPickerProps) {
  const shown = previewUri ? { uri: previewUri } : existing;
  const isBlocked = disabled || isGenerating;
  const cannotGenerate = isBlocked || generationsLeft === 0;

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
            accessibilityLabel={previewUri ? "The new cover" : "The current cover"}
          />
          <View className="mt-1 flex-row justify-end gap-5">
            <TextAction label="Change" onPress={onPick} disabled={isBlocked} />
            <TextAction label="Generate" onPress={onGenerate} disabled={cannotGenerate} />
            {previewUri ? (
              <TextAction
                label={existing ? "Undo" : "Remove"}
                onPress={onRemove}
                disabled={isBlocked}
                quiet
              />
            ) : null}
          </View>
          {isGenerating ? (
            <Text className="ml-1 text-[13px] text-subtle">Generating… this can take half a minute</Text>
          ) : generationsLeft !== null ? (
            <Text className="ml-1 text-[13px] text-subtle">
              {generationsLeft === 0
                ? "No AI covers left today"
                : `${pluralize(generationsLeft, "AI cover")} left today`}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="flex-row gap-3">
          <Tile
            icon={ImagePlus}
            title="Upload image"
            caption="Choose from gallery"
            onPress={onPick}
            disabled={isBlocked}
          />
          <Tile
            icon={Sparkles}
            title="Generate with AI"
            caption={isGenerating ? "Up to half a minute…" : describeLeft(generationsLeft)}
            onPress={onGenerate}
            disabled={cannotGenerate}
            busy={isGenerating}
          />
        </View>
      )}

      {error ? (
        <View className="mt-2">
          <FormMessage message={error} />
        </View>
      ) : null}
    </View>
  );
}
