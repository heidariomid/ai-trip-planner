import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, History, SquarePen } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatBubble, StreamingBubble } from "../../components/ChatBubble";
import type { ChatCardActions } from "../../components/ChatCards";
import { ChatComposer } from "../../components/ChatComposer";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DayPickerSheet } from "../../components/DayPickerSheet";
import { FormMessage } from "../../components/FormMessage";
import { RoundButton } from "../../components/RoundButton";
import { Text } from "../../components/Text";
import { TripPicker } from "../../components/TripPicker";
import { useChat } from "../../hooks/useChat";
import { useChatActions } from "../../hooks/useChatActions";
import { useTrips } from "../../hooks/useTrips";
import type { ChatMessage } from "../../lib/chat";
import { describeBooking, describePacking, setPendingPlan } from "../../lib/chat-actions";
import { colors, shadows } from "../../lib/theme";

// Shown before the first message, so an empty conversation has somewhere to start.
const STARTERS_WITH_TRIP = [
  "What should I not miss?",
  "Suggest places to eat",
  "Plan a free afternoon",
] as const;
const STARTERS_WITHOUT_TRIP = [
  "Plan 3 days in Lisbon",
  "Where is good in spring?",
  "Ideas for a food trip",
] as const;

const LIST_CONTENT = { paddingTop: 12, paddingBottom: 8, flexGrow: 1 } as const;

export default function ChatScreen() {
  const router = useRouter();
  // `draft` is a message to open with, typed and not sent. `fresh` opens an
  // empty conversation instead of the newest one, and `threadId` a saved one.
  const params = useLocalSearchParams<{
    tripId?: string;
    draft?: string;
    fresh?: string;
    threadId?: string;
  }>();
  const chat = useChat({
    tripId: params.tripId,
    threadId: params.threadId,
    startFresh: Boolean(params.fresh),
  });
  const { openThread, startNew } = chat;

  // The history screen comes back here with a thread to open, or asks for an
  // empty conversation. The first render is already handled by `useChat`.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (params.threadId) openThread(params.threadId);
    else if (params.fresh) startNew();
  }, [params.threadId, params.fresh, openThread, startNew]);
  const { trips } = useTrips();
  const list = useRef<FlatList<ChatMessage>>(null);

  const trip = trips.find((item) => item.id === chat.tripId) ?? null;
  const saving = useChatActions(trip);

  // The model only proposes a card. These are what save one, and each waits
  // for the traveller to confirm.
  const actions = useMemo<ChatCardActions>(
    () => ({
      hasTrip: trip !== null,
      isAdded: saving.isAdded,
      onCreateTrip: (plan, status) => {
        setPendingPlan({ plan, status });
        router.push("/chat-create-trip");
      },
      onAddDay: saving.openDay,
      getDay: saving.getDay,
      onEditDay: saving.editDay,
      onAddBooking: saving.openBooking,
      onAddPacking: saving.openPacking,
    }),
    [
      trip,
      saving.isAdded,
      saving.openDay,
      saving.getDay,
      saving.editDay,
      saving.openBooking,
      saving.openPacking,
      router,
    ],
  );

  const starters = chat.tripId ? STARTERS_WITH_TRIP : STARTERS_WITHOUT_TRIP;
  const lastMessage = chat.messages[chat.messages.length - 1];
  const isEmpty = chat.messages.length === 0 && !chat.isSending;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  // A saved conversation opens on its newest message at once; only a reply
  // being written glides down.
  function scrollToEnd() {
    list.current?.scrollToEnd({ animated: chat.isSending });
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 items-center px-5 pt-4">
            <View className="w-full max-w-[420px] flex-1">
              <View className="flex-row items-center justify-between">
                {/* As wide as the two buttons on the right, so the title stays centred. */}
                <View className="w-24">
                  <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={close} />
                </View>
                <Text className="text-[20px] font-semibold tracking-tight text-ink">
                  Assistant
                </Text>
                <View className="flex-row gap-2">
                  <RoundButton
                    icon={History}
                    accessibilityLabel="Past conversations"
                    onPress={() => router.push("/chat-history")}
                  />
                  <RoundButton
                    icon={SquarePen}
                    accessibilityLabel="Start a new conversation"
                    onPress={chat.startNew}
                  />
                </View>
              </View>

              <View className="mt-4">
                <TripPicker trips={trips} selectedId={chat.tripId} onSelect={chat.selectTrip} />
              </View>

              <FlatList
                ref={list}
                data={chat.messages}
                keyExtractor={(message) => message.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                contentContainerStyle={LIST_CONTENT}
                // Every message is drawn on the first pass. Drawn a few at a
                // time, the list does not know its full height yet, and the
                // jump to the end lands partway up a long conversation.
                initialNumToRender={Math.max(10, chat.messages.length)}
                onContentSizeChange={scrollToEnd}
                onLayout={scrollToEnd}
                renderItem={({ item }) => (
                  <ChatBubble
                    message={item}
                    isLatestReply={
                      item === lastMessage && item.role === "assistant" && !chat.isSending
                    }
                    actions={actions}
                    near={trip?.destination ?? ""}
                    onPickChip={chat.send}
                    onRegenerate={chat.regenerate}
                  />
                )}
                ListEmptyComponent={
                  chat.isLoading ? (
                    <View className="flex-1 items-center justify-center">
                      <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                  ) : isEmpty ? (
                    <View className="flex-1 justify-center py-6">
                      <Text className="text-[20px] font-semibold tracking-tight text-ink">
                        {chat.tripId ? "Ask about this trip" : "Where do you want to go?"}
                      </Text>
                      <Text className="mt-1 text-[14px] leading-5 text-subtle">
                        I can suggest places and plan days. Nothing is saved until you tap a
                        button on a card.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {starters.map((starter) => (
                          <Pressable
                            key={starter}
                            accessibilityRole="button"
                            onPress={() => chat.send(starter)}
                            style={shadows.soft}
                            className="h-11 justify-center rounded-full bg-surface px-4 active:bg-canvas"
                          >
                            <Text className="text-[14px] font-medium text-ink">{starter}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null
                }
                ListFooterComponent={
                  <View>
                    {chat.streamingText !== null ? (
                      <StreamingBubble text={chat.streamingText} />
                    ) : null}
                    <FormMessage message={chat.error} />
                  </View>
                }
              />

              <View className="pb-2 pt-1">
                <ChatComposer
                  initialText={params.draft}
                  isSending={chat.isSending}
                  onSend={chat.send}
                  onStop={chat.stop}
                />
                <Text className="mt-2 text-center text-[12px] leading-4 text-muted">
                  The assistant can be wrong. Check anything that matters.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <DayPickerSheet
        card={saving.dayTarget?.card ?? null}
        tripTitle={trip?.title ?? "your trip"}
        days={saving.dayTarget?.days ?? null}
        isSaving={saving.isSaving}
        error={saving.error}
        onConfirm={(day, mode) => void saving.confirmDay(day, mode)}
        onCancel={saving.close}
      />
      <ConfirmDialog
        visible={saving.bookingTarget !== null}
        title="Add this booking?"
        message={
          saving.bookingTarget && trip ? describeBooking(saving.bookingTarget.card, trip) : ""
        }
        confirmLabel="Add booking"
        onConfirm={() => void saving.confirmBooking()}
        onCancel={saving.close}
        loading={saving.isSaving}
        error={saving.error}
      />
      <ConfirmDialog
        visible={saving.packingTarget !== null}
        title="Add to the packing list?"
        message={
          saving.packingTarget && trip ? describePacking(saving.packingTarget.groups, trip) : ""
        }
        confirmLabel="Add items"
        onConfirm={() => void saving.confirmPacking()}
        onCancel={saving.close}
        loading={saving.isSaving}
        error={saving.error}
      />
    </View>
  );
}
