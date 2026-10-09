import { Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";

import type { PackingItem } from "../lib/packing";
import { colors } from "../lib/theme";
import type { PackingFields } from "../lib/validation";
import { Button } from "./Button";
import { PackingForm } from "./PackingForm";
import { PackingRow } from "./PackingRow";
import { Text } from "./Text";

/**
 * Which row is open as a form: an item's id, a new item under one category, or
 * a new item with no category yet.
 */
export type PackingEditing = { id: string } | { id: "new"; category: string | null } | null;

/** One row of the Packing list: a category's title, an item, what ends a category, or the add row. */
export type PackingListRow =
  | { type: "header"; key: string; category: string; packed: number; total: number }
  | { type: "item"; key: string; item: PackingItem }
  | { type: "footer"; key: string; category: string }
  | { type: "add"; key: string; isEmpty: boolean };

/** "Clothes" and "clothes " are one category. */
function categoryKey(category: string): string {
  return category.trim().toLowerCase();
}

/**
 * The categories laid end to end, so one list can render them. A category is
 * only ever built from its items, so one with no items left is not shown.
 */
export function buildPackingRows(items: PackingItem[]): PackingListRow[] {
  const groups = new Map<string, PackingItem[]>();
  for (const item of items) {
    const key = categoryKey(item.category);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const rows: PackingListRow[] = [];
  for (const [key, group] of groups) {
    const category = group[0].category;
    rows.push({
      type: "header",
      key: `header-${key}`,
      category,
      packed: group.filter((item) => item.is_packed).length,
      total: group.length,
    });
    for (const item of group) rows.push({ type: "item", key: item.id, item });
    rows.push({ type: "footer", key: `footer-${key}`, category });
  }
  rows.push({ type: "add", key: "add", isEmpty: items.length === 0 });
  return rows;
}

export interface PackingListItemProps {
  row: PackingListRow;
  editing: PackingEditing;
  /** False for a viewer: nothing can be added, edited, or ticked. */
  canEdit: boolean;
  onEdit: (target: PackingEditing) => void;
  onSave: (fields: PackingFields, existing: PackingItem | null) => Promise<string | null>;
  onDelete: (item: PackingItem) => Promise<string | null>;
  onToggle: (item: PackingItem) => void;
}

export function PackingListItem({
  row,
  editing,
  canEdit,
  onEdit,
  onSave,
  onDelete,
  onToggle,
}: PackingListItemProps) {
  if (row.type === "header") {
    return (
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-baseline">
          <Text
            numberOfLines={1}
            className="shrink text-[20px] font-semibold tracking-tight text-ink"
          >
            {row.category}
          </Text>
          <Text className="ml-2 text-[13px] text-subtle">
            {row.packed} of {row.total} packed
          </Text>
        </View>
        {canEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add an item to ${row.category}`}
            onPress={() => onEdit({ id: "new", category: row.category })}
            className="h-11 flex-row items-center pl-3 active:opacity-60"
          >
            <Plus size={16} color={colors.ink} />
            <Text className="ml-1 text-[14px] font-medium text-ink">Add</Text>
          </Pressable>
        ) : (
          <View className="h-11" />
        )}
      </View>
    );
  }

  if (row.type === "item") {
    const { item } = row;
    if (!canEdit) return <PackingRow item={item} />;
    if (editing?.id !== item.id) {
      return (
        <PackingRow
          item={item}
          onPress={() => onEdit({ id: item.id })}
          onToggle={() => onToggle(item)}
        />
      );
    }
    return (
      <View className="my-2">
        <PackingForm
          item={item}
          onSave={(fields) => onSave(fields, item)}
          onDelete={() => onDelete(item)}
          onClose={() => onEdit(null)}
        />
      </View>
    );
  }

  const isNew = canEdit && editing?.id === "new" && "category" in editing;

  if (row.type === "footer") {
    const isAdding = isNew && editing.category === row.category;
    return (
      <View className="mb-5">
        {isAdding ? (
          <View className="mt-2">
            <PackingForm
              item={null}
              category={row.category}
              onSave={(fields) => onSave(fields, null)}
              onClose={() => onEdit(null)}
            />
          </View>
        ) : null}
      </View>
    );
  }

  const isAdding = isNew && editing.category === null;
  return (
    <View>
      {row.isEmpty && !isAdding ? (
        <Text className="mb-5 text-center text-[14px] leading-5 text-subtle">
          {canEdit
            ? "Nothing to pack yet. Add an item and give it a category, such as Clothes."
            : "Nothing to pack yet."}
        </Text>
      ) : null}

      {!canEdit ? null : isAdding ? (
        <PackingForm
          item={null}
          onSave={(fields) => onSave(fields, null)}
          onClose={() => onEdit(null)}
        />
      ) : (
        <Button
          label={row.isEmpty ? "Add item" : "Add to a new category"}
          variant="secondary"
          onPress={() => onEdit({ id: "new", category: null })}
        />
      )}
    </View>
  );
}
