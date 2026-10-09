import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "../../components/Button";
import { DateField } from "../../components/DateField";
import { Fact } from "../../components/Fact";
import { FormMessage } from "../../components/FormMessage";
import { FormScreen } from "../../components/FormScreen";
import { Text } from "../../components/Text";
import { TextField } from "../../components/TextField";
import { useChatTripForm } from "../../hooks/useChatTripForm";
import { getPendingPlan, getPlanLength, type PendingPlan } from "../../lib/chat-actions";
import { formatDate, pluralize } from "../../lib/dates";

interface ChatTripFormProps {
  pending: PendingPlan;
  onCreated: (tripId: string) => void;
}

// Its own component so the form's state starts from a plan that is there.
function ChatTripForm({ pending, onCreated }: ChatTripFormProps) {
  const form = useChatTripForm(pending);
  const { plan, status } = pending;
  const activityCount = plan.days.reduce((total, day) => total + day.items.length, 0);

  async function handleCreate() {
    const tripId = await form.create();
    if (tripId) onCreated(tripId);
  }

  return (
    <View>
      <Text className="mb-5 ml-1 text-[15px] leading-5 text-subtle">
        {plan.trip.title} to {plan.trip.destination}
        {activityCount > 0 ? `, with ${pluralize(activityCount, "planned stop")}` : ""}.{" "}
        {status === "draft"
          ? "A draft waits on My Trips until you move it to your trips."
          : "You can change anything afterwards."}
      </Text>

      <TextField
        label="Leaving from"
        value={form.source}
        onChangeText={form.setSource}
        error={form.errors.source}
        placeholder="Vancouver, Canada"
        autoCapitalize="words"
        returnKeyType="done"
        editable={!form.isSaving}
      />

      <View className="flex-row">
        <DateField
          label="Start date"
          value={form.startDate}
          onChange={form.setStartDate}
          error={form.errors.startDate}
          disabled={form.isSaving}
        />
      </View>

      <View className="mb-3.5 ml-1 flex-row gap-6">
        <Fact label="Ends" value={formatDate(form.endDate)} />
        <Fact label="Length" value={pluralize(getPlanLength(plan), "day")} />
      </View>

      <View className="mt-3">
        <FormMessage message={form.formError} />
        <Button
          label={status === "draft" ? "Save draft" : "Create trip"}
          onPress={() => void handleCreate()}
          loading={form.isSaving}
        />
      </View>
    </View>
  );
}

export default function ChatCreateTripScreen() {
  const router = useRouter();
  // Set by the chat just before it opened this screen.
  const pending = getPendingPlan();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  // The chat and this form leave the stack, so back from the new trip lands
  // on Home instead of on a form that has already been sent.
  function openTrip(tripId: string) {
    // Nothing to dismiss when this screen was opened straight from a link.
    if (router.canDismiss()) router.dismissAll();
    router.push({ pathname: "/trip/[id]", params: { id: tripId } });
  }

  return (
    <FormScreen title={pending?.status === "draft" ? "Save as a draft" : "Create this trip"} onBack={close}>
      {pending ? (
        <ChatTripForm pending={pending} onCreated={openTrip} />
      ) : (
        <Text className="py-6 text-center text-[14px] leading-5 text-subtle">
          This plan isn't available any more. Go back to the chat and tap the button again.
        </Text>
      )}
    </FormScreen>
  );
}
