import { useCallback, useEffect, useRef, useState } from "react";

import {
  getLatestThread,
  MAX_CHAT_MESSAGE_LENGTH,
  sendChatMessage,
  type ChatMessage,
} from "../lib/chat";

export interface UseChatResult {
  /** The trip the conversation is about, or null for none. */
  tripId: string | null;
  selectTrip: (tripId: string | null) => void;
  messages: ChatMessage[];
  /** The reply being written, or null when none is. Empty while it has no text yet. */
  streamingText: string | null;
  /** True while the conversation for the selected trip is being read. */
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  send: (text: string) => void;
  stop: () => void;
  /** Clears the screen. The next message starts a new conversation. */
  startNew: () => void;
}

let localId = 0;
function nextLocalId(): string {
  localId += 1;
  return `local-${localId}`;
}

/**
 * One conversation with the assistant. It opens on the newest thread for the
 * selected trip, so leaving and coming back lands on the same one.
 */
export function useChat(initialTripId: string | null): UseChatResult {
  const [tripId, setTripId] = useState<string | null>(initialTripId);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const controller = useRef<AbortController | null>(null);
  // Read inside callbacks that outlive the render they were made in.
  const threadRef = useRef<string | null>(null);
  threadRef.current = threadId;
  // Goes up whenever the screen moves to another conversation, so a reply
  // still arriving for the old one is dropped instead of landing in the new.
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setThreadId(null);

    void getLatestThread(tripId).then((result) => {
      if (!active) return;
      setThreadId(result.threadId);
      setMessages(result.messages);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [tripId]);

  // Leaving the screen mid-reply stops the request with it.
  useEffect(() => () => controller.current?.abort(), []);

  const send = useCallback(
    (text: string) => {
      const message = text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
      if (!message || controller.current) return;

      const abort = new AbortController();
      controller.current = abort;
      const startedIn = generation.current;
      const isCurrent = () => generation.current === startedIn;
      let reply = "";

      setError(null);
      setMessages((current) => [
        ...current,
        { id: nextLocalId(), role: "user", content: message, cards: null },
      ]);
      setStreamingText("");

      void sendChatMessage({
        message,
        threadId: threadRef.current,
        tripId,
        signal: abort.signal,
        onThread: (id) => {
          if (isCurrent()) setThreadId(id);
        },
        onDelta: (piece) => {
          reply += piece;
          if (isCurrent()) setStreamingText(reply);
        },
      }).then((result) => {
        if (controller.current === abort) controller.current = null;
        if (!isCurrent()) return;
        setStreamingText(null);

        if (result.message) {
          const finished = result.message;
          setMessages((current) => [...current, finished]);
          return;
        }
        // What had arrived stays on screen, so a stopped or failed reply never
        // leaves an empty bubble behind.
        if (reply.trim()) {
          setMessages((current) => [
            ...current,
            { id: nextLocalId(), role: "assistant", content: reply, cards: null },
          ]);
        }
        setError(result.stopped ? "Reply stopped." : result.error);
      });
    },
    [tripId],
  );

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  const startNew = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    generation.current += 1;
    setStreamingText(null);
    setThreadId(null);
    setMessages([]);
    setError(null);
  }, []);

  const selectTrip = useCallback((next: string | null) => {
    controller.current?.abort();
    controller.current = null;
    generation.current += 1;
    setStreamingText(null);
    setTripId(next);
  }, []);

  return {
    tripId,
    selectTrip,
    messages,
    streamingText,
    isLoading,
    isSending: streamingText !== null,
    error,
    send,
    stop,
    startNew,
  };
}
