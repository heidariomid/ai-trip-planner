import { ActivityIndicator, View } from "react-native";

import type { ChatMessage } from "../lib/chat";
import { colors, shadows } from "../lib/theme";
import { ChatCards, LockedAction } from "./ChatCards";
import { Markdown } from "./Markdown";
import { Text } from "./Text";

export interface ChatBubbleProps {
  message: ChatMessage;
  /** The newest reply in the conversation, with nothing being written after it. */
  isLatestReply?: boolean;
  onPickChip?: (chip: string) => void;
}

/**
 * One message. The traveller's is `accent` with white text on the right; the
 * assistant's is a white surface on the left, with its cards under it.
 */
export function ChatBubble({ message, isLatestReply = false, onPickChip }: ChatBubbleProps) {
  if (message.role === "user") {
    return (
      <View className="mb-3 max-w-[85%] self-end rounded-[20px] rounded-br-md bg-accent px-4 py-2.5">
        <Text className="text-[15px] leading-[22px] text-white">{message.content}</Text>
      </View>
    );
  }

  return (
    <View className="mb-3 w-full">
      {message.content ? (
        <View
          style={shadows.soft}
          className="max-w-[92%] self-start rounded-[20px] rounded-bl-md bg-surface px-4 py-3"
        >
          <Markdown>{message.content}</Markdown>
        </View>
      ) : null}

      {message.cards ? (
        <ChatCards cards={message.cards} onPickChip={isLatestReply ? onPickChip : undefined} />
      ) : null}

      {isLatestReply ? (
        <View className="mt-2 flex-row">
          <LockedAction label="Regenerate" />
        </View>
      ) : null}
    </View>
  );
}

export interface StreamingBubbleProps {
  /** What has arrived so far. Empty before the first piece. */
  text: string;
}

/** The reply while it is being written. Before any text, a small spinner. */
export function StreamingBubble({ text }: StreamingBubbleProps) {
  return (
    <View
      style={shadows.soft}
      className="mb-3 max-w-[92%] self-start rounded-[20px] rounded-bl-md bg-surface px-4 py-3"
    >
      {text ? (
        <Markdown>{text}</Markdown>
      ) : (
        <ActivityIndicator size="small" color={colors.subtle} accessibilityLabel="Thinking" />
      )}
    </View>
  );
}
