import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { addDays, todayISO } from "../lib/dates";
import type { LocalImage } from "../lib/storage";
import { createTrip } from "../lib/trips";
import { validateTrip, type TripFields } from "../lib/validation";
import { useAuth } from "./useAuth";

const DEFAULT_TRIP_LENGTH_DAYS = 3;

export type TripFieldErrors = Partial<Record<keyof TripFields, string>>;

export interface TripFormValues extends TripFields {
  travelerCount: number;
  cover: LocalImage | null;
}

export interface UseTripFormResult {
  values: TripFormValues;
  setValue: <K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) => void;
  errors: TripFieldErrors;
  formError: string | null;
  /** Set once the trip is saved but its cover is not. The form is finished. */
  savedNotice: string | null;
  isSaving: boolean;
  pickCover: () => Promise<void>;
  /** Resolves true when the trip was saved with nothing left to tell. */
  save: () => Promise<boolean>;
}

function initialValues(): TripFormValues {
  const today = todayISO();
  return {
    title: "",
    source: "",
    destination: "",
    startDate: today,
    endDate: addDays(today, DEFAULT_TRIP_LENGTH_DAYS),
    description: "",
    travelerCount: 1,
    cover: null,
  };
}

export function useTripForm(): UseTripFormResult {
  const { user } = useAuth();
  const [values, setValues] = useState<TripFormValues>(initialValues);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allErrors = validateTrip(values);
  // The date order is checked as soon as a date changes. An empty required
  // field is only called out after the first attempt to save.
  const errors: TripFieldErrors = hasSubmitted ? allErrors : { endDate: allErrors.endDate };

  function setValue<K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function pickCover() {
    setFormError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        // Below 1 the picker re-encodes, which also turns a HEIC photo into a
        // JPEG that every platform can show.
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setValue("cover", {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
    } catch (error) {
      console.error("[trip form] picker failed", error);
      setFormError("We couldn't open your photos. Please try again.");
    }
  }

  async function save(): Promise<boolean> {
    setHasSubmitted(true);
    setFormError(null);
    if (Object.keys(allErrors).length > 0) return false;

    if (!user) {
      setFormError("You are signed out. Sign in again to save a trip.");
      return false;
    }

    setIsSaving(true);
    const result = await createTrip(user.id, {
      title: values.title.trim(),
      source: values.source.trim(),
      destination: values.destination.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      description: values.description.trim(),
      travelerCount: values.travelerCount,
      cover: values.cover,
    });
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return false;
    }
    if (result.notice) {
      setSavedNotice(result.notice);
      return false;
    }
    return true;
  }

  return { values, setValue, errors, formError, savedNotice, isSaving, pickCover, save };
}
