import { useCallback, useState } from "react";

import type { BookingCard, DayCard } from "../lib/chat";
import {
  addBookingCard,
  addDayCardToDay,
  listTripDays,
  replaceDayWithCard,
  type BookingTrip,
  type DaySaveMode,
  type TripDayOption,
} from "../lib/chat-actions";

/** A day card waiting for the traveller to pick a day and confirm. */
export interface DayTarget {
  key: string;
  card: DayCard;
  /** Null while the trip's days are being read. */
  days: TripDayOption[] | null;
}

/** A booking card waiting for the traveller to confirm. */
export interface BookingTarget {
  key: string;
  card: BookingCard;
}

export interface UseChatActionsResult {
  /** True once the card with this key was saved, while the screen stays open. */
  isAdded: (key: string) => boolean;
  dayTarget: DayTarget | null;
  bookingTarget: BookingTarget | null;
  isSaving: boolean;
  /** A failure from the open sheet or dialog. */
  error: string | null;
  openDay: (key: string, card: DayCard) => void;
  /** Writes the card's activities onto the chosen day, after or in place of what it has. */
  confirmDay: (day: TripDayOption, mode: DaySaveMode) => Promise<void>;
  /** A day card as the traveller left it: with their edits, or as proposed. */
  getDay: (key: string, proposed: DayCard) => DayCard;
  /** Keeps the traveller's version of a day card for as long as the screen is open. */
  editDay: (key: string, card: DayCard) => void;
  openBooking: (key: string, card: BookingCard) => void;
  confirmBooking: () => Promise<void>;
  /** Closes whichever is open. Nothing is written. */
  close: () => void;
}

/**
 * Saving a card from the chat onto the selected trip. Every write waits for a
 * confirmation, and a saved card is remembered only while the screen is open.
 */
export function useChatActions(trip: BookingTrip | null): UseChatActionsResult {
  const [added, setAdded] = useState<ReadonlySet<string>>(() => new Set());
  const [edits, setEdits] = useState<Readonly<Record<string, DayCard>>>({});
  const [dayTarget, setDayTarget] = useState<DayTarget | null>(null);
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAdded = useCallback((key: string) => {
    setAdded((current) => new Set(current).add(key));
  }, []);

  const openDay = useCallback(
    (key: string, card: DayCard) => {
      if (!trip) return;
      setError(null);
      setDayTarget({ key, card, days: null });

      void listTripDays(trip.id).then((result) => {
        setError(result.error);
        // Only if the same card is still the one open.
        setDayTarget((current) =>
          current && current.key === key ? { ...current, days: result.data } : current,
        );
      });
    },
    [trip],
  );

  const confirmDay = useCallback(
    async (day: TripDayOption, mode: DaySaveMode) => {
      if (!dayTarget) return;
      setError(null);
      setIsSaving(true);
      const result =
        mode === "replace"
          ? await replaceDayWithCard(day, dayTarget.card)
          : await addDayCardToDay(day, dayTarget.card);
      setIsSaving(false);

      if (!result.success) {
        setError(result.error);
        return;
      }
      markAdded(dayTarget.key);
      setDayTarget(null);
    },
    [dayTarget, markAdded],
  );

  const openBooking = useCallback((key: string, card: BookingCard) => {
    setError(null);
    setBookingTarget({ key, card });
  }, []);

  const confirmBooking = useCallback(async () => {
    if (!bookingTarget || !trip) return;
    setError(null);
    setIsSaving(true);
    const result = await addBookingCard(bookingTarget.card, trip);
    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    markAdded(bookingTarget.key);
    setBookingTarget(null);
  }, [bookingTarget, trip, markAdded]);

  const getDay = useCallback(
    (key: string, proposed: DayCard) => edits[key] ?? proposed,
    [edits],
  );

  const editDay = useCallback((key: string, card: DayCard) => {
    setEdits((current) => ({ ...current, [key]: card }));
  }, []);

  const close = useCallback(() => {
    setDayTarget(null);
    setBookingTarget(null);
    setError(null);
  }, []);

  return {
    isAdded: (key) => added.has(key),
    dayTarget,
    bookingTarget,
    isSaving,
    error,
    openDay,
    confirmDay,
    getDay,
    editDay,
    openBooking,
    confirmBooking,
    close,
  };
}
