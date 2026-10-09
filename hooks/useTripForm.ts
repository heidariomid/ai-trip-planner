import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";

import { generateCover as requestCover, getCoversLeft } from "../lib/covers";
import { addDays, todayISO } from "../lib/dates";
import type { LocalImage } from "../lib/storage";
import { countDaysToDrop, updateTrip, type TripDetail } from "../lib/trip-detail";
import { createTrip, type NewTrip } from "../lib/trips";
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
  /**
   * How many days with activities the new dates would remove. Set when a save
   * stopped to ask; nothing has been sent yet.
   */
  daysToDrop: number | null;
  pickCover: () => Promise<void>;
  /** Asks the image model for a cover from what the form already holds. */
  generateCover: () => Promise<void>;
  isGeneratingCover: boolean;
  /** Why the last generation gave no picture. Saving is still possible. */
  coverError: string | null;
  /** Generations left today, or null while that is not known. */
  coversLeft: number | null;
  /** Resolves true when the trip was saved with nothing left to tell. */
  save: () => Promise<boolean>;
  /** Saves after the traveller agreed to lose those days. */
  confirmDrop: () => Promise<boolean>;
  cancelDrop: () => void;
}

function initialValues(trip: TripDetail | undefined): TripFormValues {
  if (trip) {
    return {
      title: trip.title,
      source: trip.source,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      description: trip.description ?? "",
      travelerCount: trip.traveler_count,
      cover: null,
    };
  }

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

function toNewTrip(values: TripFormValues): NewTrip {
  return {
    title: values.title.trim(),
    source: values.source.trim(),
    destination: values.destination.trim(),
    startDate: values.startDate,
    endDate: values.endDate,
    description: values.description.trim(),
    travelerCount: values.travelerCount,
    cover: values.cover,
  };
}

/** The trip form. With a trip it edits that trip; without one it creates a trip. */
export function useTripForm(trip?: TripDetail): UseTripFormResult {
  const { user } = useAuth();
  const [values, setValues] = useState<TripFormValues>(() => initialValues(trip));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [daysToDrop, setDaysToDrop] = useState<number | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coversLeft, setCoversLeft] = useState<number | null>(null);
  // Counts every change to the cover, so a picture that arrives after the
  // traveller picked or removed one is dropped instead of replacing theirs.
  const coverChanges = useRef(0);

  useEffect(() => {
    let isCurrent = true;
    void getCoversLeft().then((left) => {
      if (isCurrent && left !== null) setCoversLeft(left);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const allErrors = validateTrip(values);
  // The date order is checked as soon as a date changes. An empty required
  // field is only called out after the first attempt to save.
  const errors: TripFieldErrors = hasSubmitted ? allErrors : { endDate: allErrors.endDate };

  function setValue<K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) {
    if (key === "cover") coverChanges.current += 1;
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function generateCover() {
    // One tap is one generation: a second tap while it works is dropped.
    if (isGeneratingCover) return;
    if (!values.destination.trim()) {
      setCoverError("Add where you're going first, so the cover can show it.");
      return;
    }

    setCoverError(null);
    setIsGeneratingCover(true);
    const startedAt = coverChanges.current;
    const result = await requestCover({
      title: values.title.trim(),
      destination: values.destination.trim(),
      description: values.description.trim(),
    });
    setIsGeneratingCover(false);

    if (result.remaining !== null) setCoversLeft(result.remaining);
    if (!result.success || !result.data) {
      setCoverError(result.error);
      return;
    }
    if (coverChanges.current === startedAt) setValue("cover", result.data);
  }

  async function pickCover() {
    setFormError(null);
    setCoverError(null);
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

  /** True when the save has to stop and ask about days that would be lost. */
  async function mustAskFirst(existing: TripDetail): Promise<boolean> {
    const datesChanged =
      values.startDate !== existing.start_date || values.endDate !== existing.end_date;
    if (!datesChanged) return false;

    const check = await countDaysToDrop(existing.id, values.startDate, values.endDate);
    if (!check.success) {
      setFormError(check.error);
      return true;
    }
    if (check.data > 0) setDaysToDrop(check.data);
    return check.data > 0;
  }

  async function send(confirmed: boolean): Promise<boolean> {
    if (!user) {
      setFormError("You are signed out. Sign in again to save a trip.");
      return false;
    }

    setIsSaving(true);
    if (trip && !confirmed && (await mustAskFirst(trip))) {
      setIsSaving(false);
      return false;
    }

    const result = trip
      ? await updateTrip(trip, toNewTrip(values), confirmed)
      : await createTrip(user.id, toNewTrip(values));
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

  async function save(): Promise<boolean> {
    setHasSubmitted(true);
    setFormError(null);
    if (Object.keys(allErrors).length > 0) return false;
    return send(false);
  }

  async function confirmDrop(): Promise<boolean> {
    setDaysToDrop(null);
    setFormError(null);
    return send(true);
  }

  return {
    values,
    setValue,
    errors,
    formError,
    savedNotice,
    isSaving,
    daysToDrop,
    pickCover,
    generateCover,
    isGeneratingCover,
    coverError,
    coversLeft,
    save,
    confirmDrop,
    cancelDrop: () => setDaysToDrop(null),
  };
}
