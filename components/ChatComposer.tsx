import { ArrowUp, Square } from "lucide-react-native";
import { useState } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

import { MAX_CHAT_MESSAGE_LENGTH } from "../lib/chat";
import { hasPersian, isRightToLeft, RIGHT_TO_LEFT } from "../lib/persian";
import { colors, shadows } from "../lib/theme";

/** What a browser adds to a key press. React Native's own event has only `key`. */
interface WebKeyPress extends TextInputKeyPressEventData {
  shiftKey?: boolean;
  isComposing?: boolean;
}

// A real keyboard: Enter sends and Shift+Enter starts a new line. A phone's
// on-screen keyboard keeps Enter for a new line, because it has no Shift to
// hold and the send button is under the thumb.
function hasHardwareKeyboard(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !window.matchMedia("(pointer: coarse)").matches
  );
}

export interface ChatComposerProps {
  /** A message already typed when the screen opens. It is not sent. */
  initialText?: string;
  isSending: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

/** The message field and its one button: send, or stop while a reply is being written. */
export function ChatComposer({
  initialText = "",
  isSending,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [text, setText] = useState(initialText);
  const canSend = text.trim().length > 0 && !isSending;

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText("");
  }

  function handleKeyPress(event: NativeSyntheticEvent<WebKeyPress>) {
    const { key, shiftKey, isComposing } = event.nativeEvent;
    // Enter also confirms a word while typing Chinese, Japanese, or Korean.
    if (key !== "Enter" || shiftKey || isComposing || !hasHardwareKeyboard()) return;
    event.preventDefault();
    submit();
  }

  return (
    <View
      style={shadows.soft}
      className="flex-row items-end rounded-[26px] bg-surface py-1.5 pl-4 pr-1.5"
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask about your trip"
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        multiline
        onKeyPress={handleKeyPress}
        maxLength={MAX_CHAT_MESSAGE_LENGTH}
        accessibilityLabel="Message"
        style={isRightToLeft(text) ? RIGHT_TO_LEFT : undefined}
        className={`max-h-28 min-h-[40px] flex-1 py-2.5 ${
          hasPersian(text) ? "font-fa-regular" : "font-regular"
        } text-[16px] text-ink caret-accent outline-none`}
      />
      {isSending ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop the reply"
          onPress={onStop}
          className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-canvas active:bg-line"
        >
          <Square size={14} color={colors.ink} fill={colors.ink} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={submit}
          className={`ml-2 h-10 w-10 items-center justify-center rounded-full bg-accent active:bg-accent-deep ${
            canSend ? "" : "opacity-45"
          }`}
        >
          <ArrowUp size={18} color={colors.surface} />
        </Pressable>
      )}
    </View>
  );
}
