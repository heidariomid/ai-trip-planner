import { useCallback, useEffect, useState } from "react";

import { listExplorePlans, type ExplorePlan } from "../lib/explore";

export interface UseExplorePlansResult {
  plans: ExplorePlan[];
  /** True only for the first load, before there is anything to show. */
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
}

/** The curated plans. They rarely change, so they load once and on a pull. */
export function useExplorePlans(): UseExplorePlansResult {
  const [plans, setPlans] = useState<ExplorePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listExplorePlans();
    // A failed refresh keeps the plans already on screen.
    if (result.success) setPlans(result.data);
    setError(result.error);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void load();
  }, [load]);

  return { plans, isLoading, isRefreshing, error, refresh };
}
