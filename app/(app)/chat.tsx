import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, SquarePen } from "lucide-react-native";
import { useRef } from "react";
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
import { ChatComposer } from "../../components/ChatComposer";
import { FormMessage } from "../../components/FormMessage";
import { RoundButton } from "../../components/RoundButton";
import { Text } from "../../components/Text";
import { TripPicker } from "../../components/TripPicker";
import { useChat } from "../../hooks/useChat";
import { useTrips } from "../../hooks/useTrips";
import type { ChatMessage } from "../../lib/chat";
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
  const params = useLocalSearchParams<{ tripId?: string }>();
  const chat = useChat(params.tripId ?? null);
  const { trips } = useTrips();
  const list = useRef<FlatList<ChatMessage>>(null);

  const starters = chat.tripId ? STARTERS_WITH_TRIP : STARTERS_WITHOUT_TRIP;
  const lastMessage = chat.messages[chat.messages.length - 1];
  const isEmpty = chat.messages.length === 0 && !chat.isSending;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function scrollToEnd() {
    list.current?.scrollToEnd({ animated: true });
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
                <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={close} />
                <Text className="text-[20px] font-semibold tracking-tight text-ink">
                  Assistant
                </Text>
                <RoundButton
                  icon={SquarePen}
                  accessibilityLabel="Start a new conversation"
                  onPress={chat.startNew}
                />
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
                onContentSizeChange={scrollToEnd}
                renderItem={({ item }) => (
                  <ChatBubble
                    message={item}
                    isLatestReply={
                      item === lastMessage && item.role === "assistant" && !chat.isSending
                    }
                    onPickChip={chat.send}
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
                        I can suggest places and plan days. I can't save anything to a trip
                        yet.
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
                <ChatComposer isSending={chat.isSending} onSend={chat.send} onStop={chat.stop} />
                <Text className="mt-2 text-center text-[12px] leading-4 text-muted">
                  The assistant can be wrong. Check anything that matters.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
