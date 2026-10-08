import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";

import type { TripNote } from "../lib/notes";
import { MAX_TRIP_NOTE_LENGTH, validateTripNote } from "../lib/validation";
import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface NoteFormProps {
  /** The note being edited, or null for a new one. */
  note: TripNote | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  onSave: (body: string) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}

/** The inline row for adding or editing one note. A failure stays on it. */
export function NoteForm({ note, onSave, onDelete, onClose }: NoteFormProps) {
  const [body, setBody] = useState(note?.body ?? "");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const bodyError = validateTripNote(body);
  const isBusy = pending !== null;

  async function run(kind: "save" | "delete", action: () => Promise<string | null>) {
    Keyboard.dismiss();
    setFormError(null);
    setPending(kind);
    const error = await action();
    setPending(null);
    if (error) setFormError(error);
    else onClose();
  }

  function handleSave() {
    setHasSubmitted(true);
    if (bodyError) return;
    void run("save", () => onSave(body));
  }

  return (
    <Card>
      <TextField
        label="Note"
        hint={`${body.length}/${MAX_TRIP_NOTE_LENGTH}`}
        value={body}
        onChangeText={setBody}
        error={hasSubmitted ? (bodyError ?? undefined) : undefined}
        placeholder="Something to remember for this trip"
        autoCapitalize="sentences"
        multiline
        maxLength={MAX_TRIP_NOTE_LENGTH}
        editable={!isBusy}
      />

      <FormMessage message={formError} />

      <View className="flex-row items-center justify-between">
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void run("delete", onDelete)}
            className="h-11 justify-center pr-3"
          >
            <Text className="ml-1 text-[14px] font-medium text-red-600">
              {pending === "delete" ? "Deleting…" : "Delete"}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        <View className="flex-row gap-3">
          <Button label="Cancel" variant="secondary" onPress={onClose} disabled={isBusy} />
          <Button
            label="Save"
            onPress={handleSave}
            loading={pending === "save"}
            disabled={isBusy}
          />
        </View>
      </View>
    </Card>
  );
}
