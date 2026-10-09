import { Pencil } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { formatDate, toISODate } from "../lib/dates";
import type { TripNote } from "../lib/notes";
import { colors } from "../lib/theme";
import { AddHeader } from "./AddHeader";
import { Card } from "./Card";
import { NoteForm } from "./NoteForm";
import { Text } from "./Text";

/** Which row is open as a form: a note's id, "new", or nothing. */
export type NoteEditing = string | "new" | null;

/** One row of the Notes list: the heading, or a note. */
export type NoteListRow =
  | { type: "header"; key: string; isEmpty: boolean }
  | { type: "note"; key: string; note: TripNote };

export function buildNoteRows(notes: TripNote[]): NoteListRow[] {
  return [
    { type: "header", key: "notes-header", isEmpty: notes.length === 0 },
    ...notes.map((note): NoteListRow => ({ type: "note", key: note.id, note })),
  ];
}

export interface NoteListItemProps {
  row: NoteListRow;
  editing: NoteEditing;
  /** False for a viewer: notes can be read and nothing else. */
  canEdit: boolean;
  onEdit: (target: NoteEditing) => void;
  onSave: (body: string, existing: TripNote | null) => Promise<string | null>;
  onDelete: (note: TripNote) => Promise<string | null>;
}

export function NoteListItem({
  row,
  editing,
  canEdit,
  onEdit,
  onSave,
  onDelete,
}: NoteListItemProps) {
  if (row.type === "header") {
    const isAdding = canEdit && editing === "new";
    return (
      <View className="mb-2">
        <AddHeader
          title="Notes"
          addLabel="Add a note"
          onAdd={canEdit ? () => onEdit("new") : undefined}
        />
        {isAdding ? (
          <View className="mb-1 mt-2">
            <NoteForm
              note={null}
              onSave={(body) => onSave(body, null)}
              onClose={() => onEdit(null)}
            />
          </View>
        ) : row.isEmpty ? (
          <Text className="mt-1 text-[14px] leading-5 text-subtle">
            {canEdit
              ? "No notes yet. Add a door code, a reminder, or anything worth keeping."
              : "No notes yet."}
          </Text>
        ) : null}
      </View>
    );
  }

  const { note } = row;
  if (canEdit && editing === note.id) {
    return (
      <View className="mb-3">
        <NoteForm
          note={note}
          onSave={(body) => onSave(body, note)}
          onDelete={() => onDelete(note)}
          onClose={() => onEdit(null)}
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={canEdit ? "button" : undefined}
      accessibilityLabel={canEdit ? "Edit note" : undefined}
      disabled={!canEdit}
      onPress={() => onEdit(note.id)}
      className="mb-3 active:opacity-80"
    >
      <Card>
        <View className="flex-row">
          <View className="flex-1">
            <Text className="text-[15px] leading-5 text-ink">{note.body}</Text>
            <Text className="mt-2 text-[13px] text-subtle">
              {formatDate(toISODate(new Date(note.created_at)))}
            </Text>
          </View>
          {canEdit ? (
            <View className="h-10 w-8 items-end justify-start pt-0.5">
              <Pencil size={16} color={colors.muted} />
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
