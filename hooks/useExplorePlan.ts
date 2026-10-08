import { useEffect, useState } from "react";

import { getExplorePlan, type ExplorePlanDetail } from "../lib/explore";

export interface UseExplorePlanResult {
  plan: ExplorePlanDetail | null;
  isLoading: boolean;
  /** The plan loaded as nothing: there is no plan with this id. */
  isMissing: boolean;
  error: string | null;
}

export function useExplorePlan(planId: string): UseExplorePlanResult {
  const [plan, setPlan] = useState<ExplorePlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    void getExplorePlan(planId).then((result) => {
      if (!active) return;
      setPlan(result.data);
      setIsMissing(result.success && result.data === null);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [planId]);

  return { plan, isLoading, isMissing, error };
}
