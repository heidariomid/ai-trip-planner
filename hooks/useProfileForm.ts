import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { updateProfile, type Profile } from "../lib/profiles";
import type { LocalImage } from "../lib/storage";
import { validateProfileName } from "../lib/validation";

export interface ProfileFormValues {
  fullName: string;
  interests: string[];
  /** A newly picked picture, not uploaded yet. */
  avatar: LocalImage | null;
}

export interface UseProfileFormResult {
  values: ProfileFormValues;
  setValue: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void;
  nameError: string | null;
  formError: string | null;
  /** Set once the profile is saved but its picture is not. The form is finished. */
  savedNotice: string | null;
  isSaving: boolean;
  pickAvatar: () => Promise<void>;
  /** Resolves true when the profile was saved with nothing left to tell. */
  save: () => Promise<boolean>;
}

/** The edit-profile form, started from a profile that has loaded. */
export function useProfileForm(profile: Profile): UseProfileFormResult {
  const [values, setValues] = useState<ProfileFormValues>(() => ({
    fullName: profile.full_name ?? "",
    interests: profile.interests ?? [],
    avatar: null,
  }));
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const nameProblem = validateProfileName(values.fullName);

  function setValue<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function pickAvatar() {
    // The picker takes a moment to appear. A second tap in that moment would
    // ask for a second picker, which the first one then refuses.
    if (isPicking) return;
    setFormError(null);
    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        // No crop step: the avatar fills its circle from the centre of the
        // picture, and one screen less is one wait less.
        // Below 1 the picker re-encodes, which also turns a HEIC photo into a
        // JPEG that every platform can show.
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      setValue("avatar", {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
      });
    } catch (error) {
      console.error("[profile form] picker failed", error);
      setFormError("We couldn't open your photos. Please try again.");
    } finally {
      setIsPicking(false);
    }
  }

  async function save(): Promise<boolean> {
    setHasSubmitted(true);
    setFormError(null);
    if (nameProblem) return false;

    setIsSaving(true);
    const result = await updateProfile(profile, values);
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

  return {
    values,
    setValue,
    nameError: hasSubmitted ? nameProblem : null,
    formError,
    savedNotice,
    isSaving,
    pickAvatar,
    save,
  };
}
