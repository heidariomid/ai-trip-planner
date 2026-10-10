import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../../components/Button";
import { Card } from "../../../../components/Card";
import { ConfirmDialog } from "../../../../components/ConfirmDialog";
import { EmptyState } from "../../../../components/EmptyState";
import { FormMessage } from "../../../../components/FormMessage";
import { PersonRow } from "../../../../components/PersonRow";
import { RoundButton } from "../../../../components/RoundButton";
import { Text } from "../../../../components/Text";
import { useContentWidth } from "../../../../hooks/useLayout";
import { useTripSharing } from "../../../../hooks/useTripSharing";
import { formatJoinCode, type MemberRole, type TripPerson } from "../../../../lib/members";
import { colors } from "../../../../lib/theme";

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 40,
} as const;

// Wide spacing so eight characters read as a code and not as a word.
const CODE_STYLE = { letterSpacing: 3 } as const;

/** What the one dialog on this screen is asking about. */
type Question = { kind: "remove"; person: TripPerson } | { kind: "regenerate" } | null;

/** Who a trip is shared with, and for its owner the code that lets someone join. */
export default function ShareTripScreen() {
  const maxWidth = useContentWidth("reading");
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sharing = useTripSharing(id);

  const [openPersonId, setOpenPersonId] = useState<string | null>(null);
  const [busyPersonId, setBusyPersonId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isOwner = sharing.role === "owner";

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: "/trip/[id]", params: { id } });
  }

  async function handleChangeRole(person: TripPerson, role: MemberRole) {
    setActionError(null);
    setBusyPersonId(person.id);
    setActionError(await sharing.changeRole(person, role));
    setBusyPersonId(null);
  }

  async function handleCopy() {
    if (!sharing.code) return;
    setActionError(null);
    try {
      // On web the browser can refuse; "Copied" is only said when it worked.
      const copied = await Clipboard.setStringAsync(formatJoinCode(sharing.code));
      setIsCopied(copied);
      if (!copied) setActionError("The code could not be copied. Select it and copy it by hand.");
    } catch {
      setActionError("The code could not be copied. Select it and copy it by hand.");
    }
  }

  function ask(next: Question) {
    setQuestionError(null);
    setQuestion(next);
  }

  async function handleConfirm() {
    if (!question) return;
    setQuestionError(null);
    setIsAnswering(true);
    const failure =
      question.kind === "remove" ? await sharing.remove(question.person) : await sharing.regenerate();
    setIsAnswering(false);

    if (failure) {
      setQuestionError(failure);
      return;
    }
    if (question.kind === "regenerate") setIsCopied(false);
    else setOpenPersonId(null);
    setQuestion(null);
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <FlatList
          data={sharing.people}
          keyExtractor={(person) => person.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ ...CONTENT_STYLE, maxWidth }}
          ListHeaderComponent={
            <View>
              <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={close} />
              <Text className="mt-5 text-[32px] font-bold leading-tight tracking-tight text-ink">
                Sharing
              </Text>
              {sharing.people.length > 0 ? (
                <Text className="mb-5 mt-1 text-[14px] text-subtle">
                  {sharing.people.length === 1
                    ? "Only you are on this trip."
                    : `${sharing.people.length} people on this trip`}
                </Text>
              ) : (
                <View className="mb-5" />
              )}
              <FormMessage message={actionError ?? sharing.error} />
            </View>
          }
          renderItem={({ item }) => (
            <PersonRow
              person={item}
              canManage={isOwner && item.role !== "owner"}
              isOpen={openPersonId === item.id}
              isBusy={busyPersonId === item.id}
              onToggleOpen={() =>
                setOpenPersonId((current) => (current === item.id ? null : item.id))
              }
              onChangeRole={(role) => void handleChangeRole(item, role)}
              onRemove={() => ask({ kind: "remove", person: item })}
            />
          )}
          ListEmptyComponent={
            sharing.isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : sharing.isMissing ? (
              <EmptyState message="This trip isn't available. It may have been deleted, or you are no longer on it.">
                <Button label="Go back" variant="secondary" onPress={close} />
              </EmptyState>
            ) : null
          }
          ListFooterComponent={
            sharing.people.length === 0 ? null : isOwner ? (
              <View className="mt-3">
                <Card>
                  <Text className="text-[13px] text-subtle">Join code</Text>
                  {sharing.code ? (
                    <Text
                      selectable
                      style={CODE_STYLE}
                      className="mt-1 text-[28px] font-bold text-ink"
                    >
                      {formatJoinCode(sharing.code)}
                    </Text>
                  ) : (
                    <View className="mt-3 items-start">
                      <ActivityIndicator size="small" color={colors.accent} />
                    </View>
                  )}
                  <Text className="mt-2 text-[14px] leading-5 text-subtle">
                    Anyone who types this code on Join a trip, in Profile, can view this trip.
                    You choose who can edit.
                  </Text>
                  <View className="mt-4 flex-row flex-wrap gap-3">
                    <Button
                      label={isCopied ? "Copied" : "Copy code"}
                      onPress={() => void handleCopy()}
                      disabled={!sharing.code}
                    />
                    <Button
                      label="New code"
                      variant="secondary"
                      onPress={() => ask({ kind: "regenerate" })}
                      disabled={!sharing.code}
                    />
                  </View>
                </Card>
              </View>
            ) : (
              <Text className="mt-2 text-center text-[14px] leading-5 text-subtle">
                Only the trip's owner can invite people.
              </Text>
            )
          }
        />
      </SafeAreaView>

      <ConfirmDialog
        visible={question !== null}
        title={
          question?.kind === "remove" ? `Remove ${question.person.name}?` : "Make a new code?"
        }
        message={
          question?.kind === "remove"
            ? "They will no longer see this trip. They can join again only with the code."
            : "The current code stops working. People already on the trip stay on it."
        }
        confirmLabel={question?.kind === "remove" ? "Remove" : "New code"}
        loading={isAnswering}
        error={questionError}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setQuestion(null)}
      />
    </View>
  );
}
