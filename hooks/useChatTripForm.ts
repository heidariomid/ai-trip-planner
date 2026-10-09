import { useState } from "react";

import { createTripFromPlan, getPlanEndDate, type PendingPlan } from "../lib/chat-actions";
import { todayISO } from "../lib/dates";
import { validateCopyPlan, type CopyPlanFields } from "../lib/validation";
import { useAuth } from "./useAuth";

export interface UseChatTripFormResult {
  source: string;
  setSource: (source: string) => void;
  startDate: string;
  setStartDate: (startDate: string) => void;
  /** Worked out from the start date and the plan's length. Never typed. */
  endDate: string;
  errors: Partial<Record<keyof CopyPlanFields, string>>;
  formError: string | null;
  isSaving: boolean;
  /** Resolves to the new trip's id, or null when nothing was created. */
  create: () => Promise<string | null>;
}

/**
 * The two things a plan from the chat cannot know: where the traveller leaves
 * from, and when. Sending this form is what confirms the new trip.
 */
export function useChatTripForm({ plan, status }: PendingPlan): UseChatTripFormResult {
  const { user } = useAuth();
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState(todayISO);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allErrors = validateCopyPlan({ source, startDate });

  async function create(): Promise<string | null> {
    setHasSubmitted(true);
    setFormError(null);
    if (Object.keys(allErrors).length > 0) return null;

    if (!user) {
      setFormError("You are signed out. Sign in again to save a trip.");
      return null;
    }

    setIsSaving(true);
    const result = await createTripFromPlan(user.id, plan, source.trim(), startDate, status);
    setIsSaving(false);

    if (!result.success) setFormError(result.error);
    return result.data;
  }

  return {
    source,
    setSource,
    startDate,
    setStartDate,
    endDate: getPlanEndDate(startDate, plan),
    errors: hasSubmitted ? allErrors : {},
    formError,
    isSaving,
    create,
  };
}
