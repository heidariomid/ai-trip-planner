import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { ConfirmDialog } from "../../../../components/ConfirmDialog";
import { FormScreen } from "../../../../components/FormScreen";
import { Text } from "../../../../components/Text";
import { TripForm } from "../../../../components/TripForm";
import { useImageSource } from "../../../../hooks/useImageSource";
import { useTripDetail } from "../../../../hooks/useTripDetail";
import { useTripForm } from "../../../../hooks/useTripForm";
import { pluralize } from "../../../../lib/dates";
import { colors } from "../../../../lib/theme";
import type { TripDetail } from "../../../../lib/trip-detail";

interface EditTripFormProps {
  trip: TripDetail;
  onClose: () => void;
}

// Its own component so the form's state starts from a trip that has loaded.
function EditTripForm({ trip, onClose }: EditTripFormProps) {
  const form = useTripForm(trip);
  const currentCover = useImageSource(trip.image_path);
  const daysToDrop = form.daysToDrop ?? 0;

  async function handleSave() {
    if (await form.save()) onClose();
  }

  async function handleConfirm() {
    if (await form.confirmDrop()) onClose();
  }

  return (
    <>
      <TripForm
        form={form}
        existingCover={trip.image_path ? currentCover : undefined}
        saveLabel="Save changes"
        onSave={() => void handleSave()}
        onDone={onClose}
      />
      <ConfirmDialog
        visible={form.daysToDrop !== null}
        title="Remove planned days?"
        message={`${pluralize(daysToDrop, "day")} with activities ${
          daysToDrop === 1 ? "falls" : "fall"
        } outside the new dates. Changing the dates deletes ${
          daysToDrop === 1 ? "that day and its" : "those days and their"
        } activities.`}
        confirmLabel="Change dates"
        onConfirm={() => void handleConfirm()}
        onCancel={form.cancelDrop}
      />
    </>
  );
}

export default function EditTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, isLoading, error } = useTripDetail(id);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/trips");
  }

  return (
    <FormScreen title="Edit trip" onBack={close}>
      {trip && trip.role === "viewer" ? (
        <Text className="py-6 text-center text-[14px] leading-5 text-subtle">
          You can view this trip, but only its owner and editors can change it.
        </Text>
      ) : trip ? (
        <EditTripForm trip={trip} onClose={close} />
      ) : isLoading ? (
        <View className="py-10">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <Text className="py-6 text-center text-[14px] leading-5 text-subtle">
          {error ?? "This trip isn't available. It may have been deleted."}
        </Text>
      )}
    </FormScreen>
  );
}
