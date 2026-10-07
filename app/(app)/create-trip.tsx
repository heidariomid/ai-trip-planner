import { useRouter } from "expo-router";

import { FormScreen } from "../../components/FormScreen";
import { TripForm } from "../../components/TripForm";
import { useTripForm } from "../../hooks/useTripForm";

export default function CreateTripScreen() {
  const router = useRouter();
  const form = useTripForm();

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/trips");
  }

  async function handleSave() {
    if (await form.save()) close();
  }

  return (
    <FormScreen title="Add a trip" onBack={close}>
      <TripForm form={form} onSave={() => void handleSave()} onDone={close} />
    </FormScreen>
  );
}
