import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  deleteBooking,
  listBookings,
  saveBooking as saveBookingRow,
  sortBookings,
  type Booking,
} from "../lib/bookings";
import type { BookingDraft } from "../lib/validation";

export interface UseBookingsResult {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  saveBooking: (draft: BookingDraft, existing: Booking | null) => Promise<string | null>;
  removeBooking: (booking: Booking) => Promise<string | null>;
}

/** A trip's bookings, read again when the screen gains focus. */
export function useBookings(tripId: string): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void listBookings(tripId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the bookings already on screen.
        if (result.success) setBookings(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const saveBooking = useCallback<UseBookingsResult["saveBooking"]>(
    async (draft, existing) => {
      const result = await saveBookingRow(tripId, draft, existing?.id ?? null);
      const saved = result.data;
      if (!result.success || !saved) return result.error ?? "We couldn't save this booking.";

      setBookings((current) =>
        sortBookings([...current.filter((item) => item.id !== saved.id), saved]),
      );
      return null;
    },
    [tripId],
  );

  const removeBooking = useCallback<UseBookingsResult["removeBooking"]>(async (booking) => {
    const result = await deleteBooking(booking);
    if (!result.success) return result.error;

    setBookings((current) => current.filter((item) => item.id !== booking.id));
    return null;
  }, []);

  return { bookings, isLoading, error, saveBooking, removeBooking };
}
