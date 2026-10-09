import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useImageSource } from "../hooks/useImageSource";
import type { TripPhoto } from "../lib/photos";
import { MAX_CAPTION_LENGTH } from "../lib/validation";
import { Button } from "./Button";
import { FormMessage } from "./FormMessage";
import { RoundButton } from "./RoundButton";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface PhotoViewerProps {
  /** The photo to show, or null when the viewer is closed. */
  photo: TripPhoto | null;
  /** False for a viewer: the caption shows, with nothing to change or delete. */
  canEdit: boolean;
  /** Each resolves to a sentence on failure, or null when it worked. */
  onSaveCaption: (photo: TripPhoto, caption: string) => Promise<string | null>;
  onDelete: (photo: TripPhoto) => Promise<string | null>;
  onClose: () => void;
}

type Mode = "view" | "caption" | "delete";

const FILL = { width: "100%", height: "100%" } as const;

interface PanelProps {
  photo: TripPhoto;
  canEdit: boolean;
  onSaveCaption: PhotoViewerProps["onSaveCaption"];
  onDelete: PhotoViewerProps["onDelete"];
  onClose: () => void;
}

/** The sheet under the photo: its caption, the caption form, or the delete question. */
function Panel({ photo, canEdit, onSaveCaption, onDelete, onClose }: PanelProps) {
  const [mode, setMode] = useState<Mode>("view");
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function show(next: Mode) {
    setError(null);
    setCaption(photo.caption ?? "");
    setMode(next);
  }

  async function run(action: () => Promise<string | null>, onDone: () => void) {
    setError(null);
    setIsBusy(true);
    const failure = await action();
    setIsBusy(false);
    if (failure) setError(failure);
    else onDone();
  }

  if (mode === "caption") {
    return (
      <View>
        <TextField
          label="Caption"
          hint={`${caption.length}/${MAX_CAPTION_LENGTH}`}
          value={caption}
          onChangeText={setCaption}
          placeholder="Where was this?"
          autoCapitalize="sentences"
          maxLength={MAX_CAPTION_LENGTH}
          autoFocus
          editable={!isBusy}
        />
        <FormMessage message={error} />
        <View className="flex-row justify-end gap-3">
          <Button label="Cancel" variant="secondary" onPress={() => show("view")} disabled={isBusy} />
          <Button
            label="Save"
            onPress={() => void run(() => onSaveCaption(photo, caption), () => setMode("view"))}
            loading={isBusy}
          />
        </View>
      </View>
    );
  }

  if (mode === "delete") {
    return (
      <View>
        <Text className="text-[20px] font-semibold tracking-tight text-ink">Delete this photo?</Text>
        <Text className="mb-5 mt-2 text-[15px] leading-5 text-subtle">
          It will be removed from this trip. This cannot be undone.
        </Text>
        <FormMessage message={error} />
        <View className="flex-row justify-end gap-3">
          <Button label="Cancel" variant="secondary" onPress={() => show("view")} disabled={isBusy} />
          <Button
            label="Delete photo"
            onPress={() => void run(() => onDelete(photo), onClose)}
            loading={isBusy}
          />
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text className={`mb-4 text-[15px] leading-5 ${photo.caption ? "text-ink" : "text-subtle"}`}>
        {photo.caption ?? "No caption yet."}
      </Text>
      {canEdit ? (
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => show("delete")}
            className="h-11 justify-center pr-3"
          >
            <Text className="ml-1 text-[14px] font-medium text-red-600">Delete</Text>
          </Pressable>
          <Button
            label={photo.caption ? "Edit caption" : "Add caption"}
            variant="secondary"
            onPress={() => show("caption")}
          />
        </View>
      ) : null}
    </View>
  );
}

/** One gallery photo, full screen, with its caption and what can be done to it. */
export function PhotoViewer({
  photo,
  canEdit,
  onSaveCaption,
  onDelete,
  onClose,
}: PhotoViewerProps) {
  const insets = useSafeAreaInsets();
  // The last photo stays drawn while the viewer fades out.
  const [shown, setShown] = useState<TripPhoto | null>(photo);
  useEffect(() => {
    if (photo) setShown(photo);
  }, [photo]);

  const source = useImageSource(shown?.image_path);

  return (
    <Modal visible={photo !== null} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-ink"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          <Image
            source={source}
            resizeMode="contain"
            style={FILL}
            accessibilityLabel={shown?.caption ?? "Trip photo"}
          />
          <View className="absolute left-5" style={{ top: insets.top + 12 }}>
            <RoundButton icon={X} accessibilityLabel="Close photo" onPress={onClose} />
          </View>
        </View>

        {shown ? (
          <View
            className="w-full max-w-[420px] self-center rounded-t-card bg-surface px-5 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <Panel
              key={shown.id}
              photo={shown}
              canEdit={canEdit}
              onSaveCaption={onSaveCaption}
              onDelete={onDelete}
              onClose={onClose}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
