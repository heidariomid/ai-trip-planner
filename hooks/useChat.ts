import { useCallback, useEffect, useRef, useState } from "react";

import {
  getLatestThread,
  getThread,
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
  /** Answers the last question again, in place of the newest reply. */
  regenerate: () => void;
  stop: () => void;
  /** Clears the screen. The next message starts a new conversation. */
  startNew: () => void;
  /** Opens a saved conversation, and selects the trip it is about. */
  openThread: (threadId: string) => void;
}

let localId = 0;
function nextLocalId(): string {
  localId += 1;
  return `local-${localId}`;
}

/** What the screen is showing: the newest thread of a trip, one saved thread, or nothing yet. */
type Target =
  | { kind: "latest"; tripId: string | null }
  | { kind: "thread"; threadId: string }
  | { kind: "fresh" };

export interface UseChatOptions {
  tripId?: string | null;
  /** Open this saved conversation instead of the newest one. */
  threadId?: string | null;
  /** Open empty, so the first message starts a new conversation. */
  startFresh?: boolean;
}

function toTarget({ tripId = null, threadId, startFresh }: UseChatOptions): Target {
  if (threadId) return { kind: "thread", threadId };
  if (startFresh) return { kind: "fresh" };
  return { kind: "latest", tripId };
}

/**
 * One conversation with the assistant. It opens on the newest thread for the
 * selected trip, so leaving and coming back lands on the same one, unless it
 * is told to open a saved thread or to start empty.
 */
export function useChat(options: UseChatOptions = {}): UseChatResult {
  const [target, setTarget] = useState<Target>(() => toTarget(options));
  const [tripId, setTripId] = useState<string | null>(options.tripId ?? null);
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
    setError(null);
    setMessages([]);
    setThreadId(null);

    if (target.kind === "fresh") {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const load =
      target.kind === "thread"
        ? getThread(target.threadId).then((result) => {
            // A saved conversation brings its own trip with it.
            if (active && result.success) setTripId(result.tripId);
            return result;
          })
        : getLatestThread(target.tripId);

    void load.then((result) => {
      if (!active) return;
      setThreadId(result.threadId);
      setMessages(result.messages);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [target]);

  // Leaving the screen mid-reply stops the request with it.
  useEffect(() => () => controller.current?.abort(), []);

  /** Runs one request: a new message, or with null the last question again. */
  const run = useCallback(
    (message: string | null) => {
      if (controller.current) return;

      const abort = new AbortController();
      controller.current = abort;
      const startedIn = generation.current;
      const isCurrent = () => generation.current === startedIn;
      let reply = "";
      // What a regenerate takes off the screen, kept to put back if it fails:
      // the server only deletes the old reply once it has a new one.
      let replaced: ChatMessage[] = [];

      setError(null);
      setMessages((current) => {
        if (message !== null) {
          return [...current, { id: nextLocalId(), role: "user", content: message, cards: null }];
        }
        const lastQuestion = current.map((item) => item.role).lastIndexOf("user");
        replaced = current.slice(lastQuestion + 1);
        return current.slice(0, lastQuestion + 1);
      });
      setStreamingText("");

      void sendChatMessage({
        message: message ?? "",
        regenerate: message === null,
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
        if (message === null) {
          setMessages((current) => [...current, ...replaced]);
        } else if (reply.trim()) {
          // What had arrived stays on screen, so a stopped or failed reply
          // never leaves an empty bubble behind.
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

  const send = useCallback(
    (text: string) => {
      const message = text.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
      if (message) run(message);
    },
    [run],
  );

  const regenerate = useCallback(() => {
    // Nothing is saved until the first reply, so there is no thread to redo in.
    if (threadRef.current) run(null);
  }, [run]);

  const stop = useCallback(() => {
    controller.current?.abort();
  }, []);

  /** Drops whatever reply is still arriving, before the screen moves on. */
  const leaveConversation = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    generation.current += 1;
    setStreamingText(null);
  }, []);

  const startNew = useCallback(() => {
    leaveConversation();
    setTarget({ kind: "fresh" });
  }, [leaveConversation]);

  const selectTrip = useCallback(
    (next: string | null) => {
      leaveConversation();
      setTripId(next);
      setTarget({ kind: "latest", tripId: next });
    },
    [leaveConversation],
  );

  const openThread = useCallback(
    (id: string) => {
      leaveConversation();
      setTarget({ kind: "thread", threadId: id });
    },
    [leaveConversation],
  );

  return {
    tripId,
    selectTrip,
    messages,
    streamingText,
    isLoading,
    isSending: streamingText !== null,
    error,
    send,
    regenerate,
    stop,
    startNew,
    openThread,
  };
}
