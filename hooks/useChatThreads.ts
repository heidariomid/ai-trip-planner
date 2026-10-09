import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { deleteThread, listThreads, type ChatThreadSummary } from "../lib/chat";

export interface UseChatThreadsResult {
  threads: ChatThreadSummary[];
  /** True only for the first load, before there is anything to show. */
  isLoading: boolean;
  error: string | null;
  /** Resolves to a sentence on failure, or null when it worked. */
  removeThread: (threadId: string) => Promise<string | null>;
}

/** The traveller's saved conversations, read again when the screen gains focus. */
export function useChatThreads(): UseChatThreadsResult {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void listThreads().then((result) => {
        if (!active) return;
        // A failed refresh keeps the list already on screen.
        if (result.success) setThreads(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const removeThread = useCallback(async (threadId: string) => {
    const result = await deleteThread(threadId);
    if (!result.success) return result.error;
    setThreads((current) => current.filter((thread) => thread.id !== threadId));
    return null;
  }, []);

  return { threads, isLoading, error, removeThread };
}
