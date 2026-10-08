import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Button } from "../../../../components/Button";
import { DateField } from "../../../../components/DateField";
import { Fact } from "../../../../components/Fact";
import { FormMessage } from "../../../../components/FormMessage";
import { FormScreen } from "../../../../components/FormScreen";
import { Text } from "../../../../components/Text";
import { TextField } from "../../../../components/TextField";
import { useCopyPlan } from "../../../../hooks/useCopyPlan";
import { useExplorePlan } from "../../../../hooks/useExplorePlan";
import { formatDate, pluralize } from "../../../../lib/dates";
import type { ExplorePlanDetail } from "../../../../lib/explore";
import { colors } from "../../../../lib/theme";

interface CopyPlanFormProps {
  plan: ExplorePlanDetail;
  onCopied: (tripId: string) => void;
}

// Its own component so the form's state starts from a plan that has loaded.
function CopyPlanForm({ plan, onCopied }: CopyPlanFormProps) {
  const form = useCopyPlan(plan);

  async function handleCopy() {
    const tripId = await form.copy();
    if (tripId) onCopied(tripId);
  }

  return (
    <View>
      <Text className="mb-5 ml-1 text-[15px] leading-5 text-subtle">
        {plan.title} becomes a trip of your own. You can change anything afterwards.
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
        <Fact label="Length" value={pluralize(plan.days.length, "day")} />
      </View>

      <View className="mt-3">
        <FormMessage message={form.formError} />
        <Button label="Create trip" onPress={() => void handleCopy()} loading={form.isSaving} />
      </View>
    </View>
  );
}

export default function CopyPlanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, isLoading, error } = useExplorePlan(id);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  // The plan and this form leave the stack, so back from the new trip lands
  // on Home instead of on a form that has already been sent.
  function openTrip(tripId: string) {
    // Nothing to dismiss when this screen was opened straight from a link.
    if (router.canDismiss()) router.dismissAll();
    router.push({ pathname: "/trip/[id]", params: { id: tripId } });
  }

  return (
    <FormScreen title="Copy this plan" onBack={close}>
      {plan ? (
        <CopyPlanForm plan={plan} onCopied={openTrip} />
      ) : isLoading ? (
        <View className="py-10">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <Text className="py-6 text-center text-[14px] leading-5 text-subtle">
          {error ?? "This plan isn't available any more."}
        </Text>
      )}
    </FormScreen>
  );
}
