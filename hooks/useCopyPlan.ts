import { useState } from "react";

import { todayISO } from "../lib/dates";
import { copyExplorePlan, getCopyEndDate, type ExplorePlanDetail } from "../lib/explore";
import { validateCopyPlan, type CopyPlanFields } from "../lib/validation";
import { useAuth } from "./useAuth";

export interface UseCopyPlanResult {
  source: string;
  setSource: (source: string) => void;
  startDate: string;
  setStartDate: (startDate: string) => void;
  /** Worked out from the start date and the plan's day count. Never typed. */
  endDate: string;
  errors: Partial<Record<keyof CopyPlanFields, string>>;
  formError: string | null;
  isSaving: boolean;
  /** Resolves to the new trip's id, or null when nothing was created. */
  copy: () => Promise<string | null>;
}

export function useCopyPlan(plan: ExplorePlanDetail): UseCopyPlanResult {
  const { user } = useAuth();
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState(todayISO);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allErrors = validateCopyPlan({ source, startDate });

  async function copy(): Promise<string | null> {
    setHasSubmitted(true);
    setFormError(null);
    if (Object.keys(allErrors).length > 0) return null;

    if (!user) {
      setFormError("You are signed out. Sign in again to copy a plan.");
      return null;
    }

    setIsSaving(true);
    const result = await copyExplorePlan(user.id, plan, source.trim(), startDate);
    setIsSaving(false);

    if (!result.success) setFormError(result.error);
    return result.data;
  }

  return {
    source,
    setSource,
    startDate,
    setStartDate,
    endDate: getCopyEndDate(startDate, plan.days.length),
    errors: hasSubmitted ? allErrors : {},
    formError,
    isSaving,
    copy,
  };
}
