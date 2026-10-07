import { Modal, Pressable, View } from "react-native";

import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** A failure from the confirmed action, shown without closing the dialog. */
  error?: string | null;
}

/** Asks before something that cannot be undone. Cancel sends nothing. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-5">
        <Pressable
          accessibilityLabel="Cancel"
          disabled={loading}
          onPress={onCancel}
          className="absolute bottom-0 left-0 right-0 top-0 bg-ink/40"
        />
        <View className="w-full max-w-[380px]">
          <Card>
            <Text className="text-[20px] font-semibold tracking-tight text-ink">{title}</Text>
            <Text className="mb-5 mt-2 text-[15px] leading-5 text-subtle">{message}</Text>
            <FormMessage message={error} />
            <View className="flex-row justify-end gap-3">
              <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={loading} />
              <Button label={confirmLabel} onPress={onConfirm} loading={loading} />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
