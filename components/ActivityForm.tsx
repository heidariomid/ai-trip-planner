import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";

import { toTimeValue } from "../lib/dates";
import type { Activity } from "../lib/trip-detail";
import { MAX_NOTE_LENGTH, validateActivity, type ActivityFields } from "../lib/validation";
import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";
import { TextField } from "./TextField";
import { TimeField } from "./TimeField";

export interface ActivityFormProps {
  /** The activity being edited, or null for a new one. */
  activity: Activity | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  onSave: (fields: ActivityFields) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}

type FieldErrors = Partial<Record<keyof ActivityFields, string>>;

function initialFields(activity: Activity | null): ActivityFields {
  return {
    startsAt: toTimeValue(activity?.starts_at ?? null),
    endsAt: toTimeValue(activity?.ends_at ?? null),
    place: activity?.place ?? "",
    activity: activity?.activity ?? "",
    notes: activity?.notes ?? "",
  };
}

/** The inline row for adding or editing one activity. A failure stays on it. */
export function ActivityForm({ activity, onSave, onDelete, onClose }: ActivityFormProps) {
  const [fields, setFields] = useState<ActivityFields>(() => initialFields(activity));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const allErrors = validateActivity(fields);
  // The time order is checked as soon as a time changes.
  const errors: FieldErrors = hasSubmitted ? allErrors : { endsAt: allErrors.endsAt };
  const isBusy = pending !== null;

  function setField<K extends keyof ActivityFields>(key: K, value: ActivityFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

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
    if (Object.keys(allErrors).length > 0) return;
    void run("save", () => onSave(fields));
  }

  return (
    <Card>
      <View className="flex-row gap-3">
        <TimeField
          label="Starts"
          value={fields.startsAt}
          onChange={(value) => setField("startsAt", value)}
          error={errors.startsAt}
          disabled={isBusy}
        />
        <TimeField
          label="Ends"
          value={fields.endsAt}
          onChange={(value) => setField("endsAt", value)}
          error={errors.endsAt}
          optional
          disabled={isBusy}
        />
      </View>

      <TextField
        label="Activity"
        value={fields.activity}
        onChangeText={(text) => setField("activity", text)}
        error={errors.activity}
        placeholder="Explore and pray"
        autoCapitalize="sentences"
        editable={!isBusy}
      />
      <TextField
        label="Place"
        value={fields.place}
        onChangeText={(text) => setField("place", text)}
        placeholder="Senso-ji Temple"
        autoCapitalize="words"
        editable={!isBusy}
      />
      <TextField
        label="Note"
        hint={`${fields.notes.length}/${MAX_NOTE_LENGTH}`}
        value={fields.notes}
        onChangeText={(text) => setField("notes", text)}
        error={errors.notes}
        placeholder="Anything to remember"
        multiline
        maxLength={MAX_NOTE_LENGTH}
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
