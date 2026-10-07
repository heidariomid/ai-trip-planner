import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { listTrips, type Trip } from "../lib/trips";

export interface UseTripsResult {
  trips: Trip[];
  /** True only for the first load, before there is anything to show. */
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
}

/** The traveller's trips, read again every time the screen gains focus. */
export function useTrips(): UseTripsResult {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listTrips();
    // A failed refresh keeps the trips already on screen.
    if (result.success) setTrips(result.data);
    setError(result.error);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void load();
  }, [load]);

  return { trips, isLoading, isRefreshing, error, refresh };
}
