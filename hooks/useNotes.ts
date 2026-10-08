import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { deleteNote, listNotes, saveNote as saveNoteRow, type TripNote } from "../lib/notes";

export interface UseNotesResult {
  notes: TripNote[];
  isLoading: boolean;
  error: string | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  saveNote: (body: string, existing: TripNote | null) => Promise<string | null>;
  removeNote: (note: TripNote) => Promise<string | null>;
}

/** A trip's notes, read again when the screen gains focus. */
export function useNotes(tripId: string): UseNotesResult {
  const [notes, setNotes] = useState<TripNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void listNotes(tripId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the notes already on screen.
        if (result.success) setNotes(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const saveNote = useCallback<UseNotesResult["saveNote"]>(
    async (body, existing) => {
      const result = await saveNoteRow(tripId, body, existing?.id ?? null);
      const saved = result.data;
      if (!result.success || !saved) return result.error ?? "We couldn't save this note.";

      // An edited note keeps its place; a new one goes first.
      setNotes((current) =>
        existing
          ? current.map((note) => (note.id === saved.id ? saved : note))
          : [saved, ...current],
      );
      return null;
    },
    [tripId],
  );

  const removeNote = useCallback<UseNotesResult["removeNote"]>(async (note) => {
    const result = await deleteNote(note.id);
    if (!result.success) return result.error;

    setNotes((current) => current.filter((other) => other.id !== note.id));
    return null;
  }, []);

  return { notes, isLoading, error, saveNote, removeNote };
}
