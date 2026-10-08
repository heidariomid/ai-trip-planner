import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  deletePackingItem,
  listPackingItems,
  savePackingItem,
  setPackingItemPacked,
  sortPackingItems,
  type PackingItem,
} from "../lib/packing";
import type { PackingFields } from "../lib/validation";

export interface UsePackingResult {
  items: PackingItem[];
  isLoading: boolean;
  error: string | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  saveItem: (fields: PackingFields, existing: PackingItem | null) => Promise<string | null>;
  removeItem: (item: PackingItem) => Promise<string | null>;
  /** Marks an item packed, or clears the mark. */
  toggleItem: (item: PackingItem) => Promise<string | null>;
}

/** A trip's packing list, read again when the screen gains focus. */
export function usePacking(tripId: string): UsePackingResult {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void listPackingItems(tripId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the list already on screen.
        if (result.success) setItems(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const saveItem = useCallback<UsePackingResult["saveItem"]>(
    async (fields, existing) => {
      const result = await savePackingItem(tripId, fields, existing?.id ?? null);
      const saved = result.data;
      if (!result.success || !saved) return result.error ?? "We couldn't save this item.";

      setItems((current) =>
        sortPackingItems([...current.filter((item) => item.id !== saved.id), saved]),
      );
      return null;
    },
    [tripId],
  );

  const removeItem = useCallback<UsePackingResult["removeItem"]>(async (item) => {
    const result = await deletePackingItem(item.id);
    if (!result.success) return result.error;

    setItems((current) => current.filter((other) => other.id !== item.id));
    return null;
  }, []);

  const toggleItem = useCallback<UsePackingResult["toggleItem"]>(async (item) => {
    const setPacked = (isPacked: boolean) =>
      setItems((current) =>
        current.map((other) => (other.id === item.id ? { ...other, is_packed: isPacked } : other)),
      );

    // The tick moves at once and goes back if the save fails.
    setPacked(!item.is_packed);
    const result = await setPackingItemPacked(item.id, !item.is_packed);
    if (!result.success) setPacked(item.is_packed);
    return result.error;
  }, []);

  return { items, isLoading, error, saveItem, removeItem, toggleItem };
}
