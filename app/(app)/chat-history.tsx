import { useRouter } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { FormMessage } from "../../components/FormMessage";
import { RoundButton } from "../../components/RoundButton";
import { Text } from "../../components/Text";
import { useChatThreads } from "../../hooks/useChatThreads";
import type { ChatThreadSummary } from "../../lib/chat";
import { formatDate, toISODate } from "../../lib/dates";
import { colors, shadows } from "../../lib/theme";

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 40,
} as const;

/** "Japan adventure · Oct 9, 2026", or the date alone when no trip was selected. */
function describe(thread: ChatThreadSummary): string {
  const date = formatDate(toISODate(new Date(thread.updatedAt)));
  return thread.tripTitle ? `${thread.tripTitle} · ${date}` : date;
}

/** Every conversation the traveller has had with the assistant, newest first. */
export default function ChatHistoryScreen() {
  const router = useRouter();
  const { threads, isLoading, error, removeThread } = useChatThreads();
  const [deleting, setDeleting] = useState<ChatThreadSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/chat");
  }

  // Back to the chat that opened this list, now showing the chosen thread.
  function open(threadId: string) {
    router.dismissTo({ pathname: "/chat", params: { threadId } });
  }

  function startNew() {
    router.dismissTo({ pathname: "/chat", params: { fresh: String(Date.now()) } });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    setIsDeleting(true);
    const failure = await removeThread(deleting.id);
    setIsDeleting(false);
    if (failure) setDeleteError(failure);
    else setDeleting(null);
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <FlatList
          data={threads}
          keyExtractor={(thread) => thread.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={CONTENT_STYLE}
          ListHeaderComponent={
            <View>
              <RoundButton icon={ArrowLeft} accessibilityLabel="Go back" onPress={close} />
              <Text className="mb-5 mt-5 text-[32px] font-bold leading-tight tracking-tight text-ink">
                Conversations
              </Text>
              <FormMessage message={error} />
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={shadows.soft}
              className="mb-3 flex-row items-center rounded-2xl bg-surface"
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open the conversation: ${item.title}`}
                onPress={() => open(item.id)}
                className="min-h-[64px] flex-1 justify-center rounded-2xl py-3 pl-4 pr-2 active:bg-canvas"
              >
                <Text numberOfLines={2} className="text-[15px] font-medium leading-5 text-ink">
                  {item.title}
                </Text>
                <Text numberOfLines={1} className="mt-1 text-[13px] text-subtle">
                  {describe(item)}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete the conversation: ${item.title}`}
                onPress={() => {
                  setDeleteError(null);
                  setDeleting(item);
                }}
                className="mr-1 h-11 w-11 items-center justify-center rounded-full active:bg-canvas"
              >
                <Trash2 size={18} color={colors.muted} />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : error ? null : (
              <EmptyState message="No conversations yet. Ask the assistant something and it will be kept here.">
                <Button label="Start a conversation" onPress={startNew} />
              </EmptyState>
            )
          }
        />
      </SafeAreaView>

      <ConfirmDialog
        visible={deleting !== null}
        title="Delete this conversation?"
        message="Its messages are removed for good. Any trip made from it stays."
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
        loading={isDeleting}
        error={deleteError}
      />
    </View>
  );
}
