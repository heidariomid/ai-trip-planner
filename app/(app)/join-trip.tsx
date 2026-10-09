import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Button } from "../../components/Button";
import { FormMessage } from "../../components/FormMessage";
import { FormScreen } from "../../components/FormScreen";
import { Text } from "../../components/Text";
import { TextField } from "../../components/TextField";
import { joinTrip } from "../../lib/members";

// Eight characters and the dash the share screen shows between them.
const MAX_TYPED_LENGTH = 9;
// Long enough to read the success message before My Trips opens.
const SUCCESS_PAUSE_MS = 1200;

/** The one place a join code is typed. Joining says so, then opens My Trips. */
export default function JoinTripScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!hasJoined) return;
    // Replaced, so going back from My Trips does not land on this form again.
    const timer = setTimeout(() => router.replace("/trips"), SUCCESS_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [hasJoined, router]);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  }

  async function handleJoin() {
    // A second tap while the first is still on its way is dropped.
    if (isJoining || hasJoined) return;
    setError(null);
    setIsJoining(true);
    const result = await joinTrip(code);
    setIsJoining(false);

    if (!result.success || !result.data) {
      setError(result.error);
      return;
    }
    setHasJoined(true);
  }

  return (
    <FormScreen title="Join a trip" onBack={close}>
      <Text className="mb-4 text-[14px] leading-5 text-subtle">
        Ask the person who made the trip for its code. They find it on the trip, under
        Sharing.
      </Text>
      <TextField
        label="Join code"
        value={code}
        onChangeText={(text) => setCode(text.toUpperCase())}
        placeholder="ABCD-2345"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        maxLength={MAX_TYPED_LENGTH}
        returnKeyType="join"
        onSubmitEditing={() => void handleJoin()}
        editable={!isJoining && !hasJoined}
      />
      <FormMessage message={error} />
      <FormMessage
        tone="info"
        message={hasJoined ? "You joined the trip. Opening My Trips…" : null}
      />
      <View className="mt-2">
        <Button
          label="Join trip"
          onPress={() => void handleJoin()}
          loading={isJoining}
          disabled={hasJoined}
        />
      </View>
    </FormScreen>
  );
}
