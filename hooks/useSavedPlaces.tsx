import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  getSavedPlaceKey,
  listSavedPlaces,
  removeSavedPlace,
  savePlace,
  type PlaceToSave,
  type SavedPlace,
} from "../lib/saved-places";
import { useAuth } from "./useAuth";

export interface SavedPlacesValue {
  /** Newest first. */
  places: SavedPlace[];
  /** True only for the first load, before there is anything to show. */
  isLoading: boolean;
  error: string | null;
  /** Reads the list again. A screen calls it when it gains focus. */
  refresh: () => void;
  isSaved: (name: string, city: string) => boolean;
  /**
   * Saves the place, or removes it when it is already saved. The list changes
   * at once and goes back if the request fails. Resolves to a sentence on
   * failure, or null when it worked or a change to this place was still pending.
   */
  toggle: (place: PlaceToSave) => Promise<string | null>;
}

const SavedPlacesContext = createContext<SavedPlacesValue | null>(null);

const PENDING_ID = "pending:";

function newestFirst(places: SavedPlace[]): SavedPlace[] {
  return [...places].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * The traveller's saved places, held once for the whole signed-in app, so a
 * heart in the chat, the count on Profile, and the list agree without each
 * place card asking the database.
 */
export function SavedPlacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The places with a save or a removal on its way. A second tap is dropped.
  const pending = useRef(new Set<string>());
  // Only the newest read may fill the list.
  const latestLoad = useRef(0);
  const isReading = useRef(false);

  const refresh = useCallback(() => {
    const load = ++latestLoad.current;
    isReading.current = true;

    void listSavedPlaces().then((result) => {
      if (load !== latestLoad.current) return;
      isReading.current = false;
      if (result.success) {
        // A place whose change has not landed yet keeps what the screen shows.
        setPlaces((current) => {
          const waiting = pending.current;
          const kept = current.filter((place) =>
            waiting.has(getSavedPlaceKey(place.name, place.city)),
          );
          const read = result.data.filter(
            (place) => !waiting.has(getSavedPlaceKey(place.name, place.city)),
          );
          return newestFirst([...kept, ...read]);
        });
      }
      // A failed refresh keeps the list already on screen.
      setError(result.error);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    pending.current.clear();
    setPlaces([]);
    setError(null);
    setIsLoading(true);

    if (userId) refresh();
    // Whatever was being read belonged to the account that just left.
    else latestLoad.current += 1;
  }, [userId, refresh]);

  const savedKeys = useMemo(
    () => new Set(places.map((place) => getSavedPlaceKey(place.name, place.city))),
    [places],
  );

  const isSaved = useCallback(
    (name: string, city: string) => savedKeys.has(getSavedPlaceKey(name, city)),
    [savedKeys],
  );

  const toggle = useCallback(
    async (place: PlaceToSave) => {
      const key = getSavedPlaceKey(place.name, place.city);
      if (!place.name.trim() || pending.current.has(key)) return null;

      const matches = (row: SavedPlace) => getSavedPlaceKey(row.name, row.city) === key;
      const saved = places.find(matches);
      pending.current.add(key);

      try {
        if (saved) {
          setPlaces((current) => current.filter((row) => !matches(row)));
          const result = await removeSavedPlace(saved.id);
          if (!result.success) {
            setPlaces((current) =>
              current.some(matches) ? current : newestFirst([saved, ...current]),
            );
          }
          return result.error;
        }

        const draft: SavedPlace = {
          id: `${PENDING_ID}${key}`,
          name: place.name.trim(),
          label: place.label.trim(),
          city: place.city.trim(),
          created_at: new Date().toISOString(),
        };
        setPlaces((current) => [draft, ...current.filter((row) => !matches(row))]);

        const result = await savePlace(place);
        const row = result.data;
        setPlaces((current) => {
          const others = current.filter((item) => !matches(item));
          return row ? newestFirst([row, ...others]) : others;
        });
        return result.error;
      } finally {
        pending.current.delete(key);
        // A read that started before this change landed would bring the old state back.
        if (isReading.current) refresh();
      }
    },
    [places, refresh],
  );

  const value = useMemo(
    () => ({ places, isLoading, error, refresh, isSaved, toggle }),
    [places, isLoading, error, refresh, isSaved, toggle],
  );

  return <SavedPlacesContext.Provider value={value}>{children}</SavedPlacesContext.Provider>;
}

export function useSavedPlaces(): SavedPlacesValue {
  const context = useContext(SavedPlacesContext);
  if (!context) {
    throw new Error("useSavedPlaces must be used inside <SavedPlacesProvider>");
  }
  return context;
}
