import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";

import type { PackingItem } from "../lib/packing";
import {
  MAX_PACKING_CATEGORY_LENGTH,
  MAX_PACKING_LABEL_LENGTH,
  validatePackingItem,
  type PackingFields,
} from "../lib/validation";
import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface PackingFormProps {
  /** The item being edited, or null for a new one. */
  item: PackingItem | null;
  /** The category a new item starts in, when it was added from one. */
  category?: string;
  /** Each resolves to a sentence on failure, or null when it worked. */
  onSave: (fields: PackingFields) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}

/** The inline row for adding or editing one packing item. A failure stays on it. */
export function PackingForm({ item, category, onSave, onDelete, onClose }: PackingFormProps) {
  const [fields, setFields] = useState<PackingFields>({
    category: item?.category ?? category ?? "",
    label: item?.label ?? "",
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const allErrors = validatePackingItem(fields);
  const errors = hasSubmitted ? allErrors : {};
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
    if (Object.keys(allErrors).length > 0) return;
    void run("save", () => onSave(fields));
  }

  return (
    <Card>
      <TextField
        label="Item"
        value={fields.label}
        onChangeText={(label) => setFields((current) => ({ ...current, label }))}
        error={errors.label}
        placeholder="Rain jacket"
        autoCapitalize="sentences"
        maxLength={MAX_PACKING_LABEL_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!isBusy}
      />
      <TextField
        label="Category"
        value={fields.category}
        onChangeText={(text) => setFields((current) => ({ ...current, category: text }))}
        error={errors.category}
        placeholder="Clothes"
        autoCapitalize="sentences"
        maxLength={MAX_PACKING_CATEGORY_LENGTH}
        returnKeyType="done"
        onSubmitEditing={handleSave}
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
