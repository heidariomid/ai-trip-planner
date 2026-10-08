import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  addPhoto,
  deletePhoto,
  listPhotos,
  updatePhotoCaption,
  type TripPhoto,
} from "../lib/photos";

/** How many photos one visit to the picker can add. */
export const MAX_PHOTOS_PER_PICK = 10;

export interface UsePhotosResult {
  photos: TripPhoto[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  /**
   * Opens the picker and uploads what was chosen into the trip owner's folder.
   * Each resolves to a sentence on failure, or null when it worked.
   */
  addPhotos: (ownerId: string) => Promise<string | null>;
  saveCaption: (photo: TripPhoto, caption: string) => Promise<string | null>;
  removePhoto: (photo: TripPhoto) => Promise<string | null>;
}

function describeFailures(failed: number, total: number, reason: string | null): string {
  if (total === 1) return reason ?? "The photo could not be added. Please try again.";
  const lead =
    failed === total
      ? "None of the photos could be added."
      : `${failed} of ${total} photos could not be added. The rest are saved.`;
  return reason ? `${lead} ${reason}` : lead;
}

/** A trip's gallery, read again when the screen gains focus. */
export function usePhotos(tripId: string): UsePhotosResult {
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void listPhotos(tripId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the photos already on screen.
        if (result.success) setPhotos(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const addPhotos = useCallback<UsePhotosResult["addPhotos"]>(
    async (ownerId) => {
      let assets: ImagePicker.ImagePickerAsset[];
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          selectionLimit: MAX_PHOTOS_PER_PICK,
          // Below 1 the picker re-encodes, which also turns a HEIC photo into a
          // JPEG that every platform can show.
          quality: 0.8,
        });
        if (result.canceled) return null;
        // The web picker has no limit of its own.
        assets = result.assets.slice(0, MAX_PHOTOS_PER_PICK);
      } catch (pickerError) {
        console.error("[photos] picker failed", pickerError);
        return "We couldn't open your photos. Please try again.";
      }

      setIsUploading(true);
      let failed = 0;
      let reason: string | null = null;

      // One at a time, so a slow connection is not asked for ten uploads at once.
      for (const asset of assets) {
        const result = await addPhoto(ownerId, tripId, {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
        });
        const saved = result.data;
        if (result.success && saved) {
          setPhotos((current) => [saved, ...current]);
        } else {
          failed += 1;
          reason = result.error;
        }
      }

      setIsUploading(false);
      return failed > 0 ? describeFailures(failed, assets.length, reason) : null;
    },
    [tripId],
  );

  const saveCaption = useCallback<UsePhotosResult["saveCaption"]>(async (photo, caption) => {
    const result = await updatePhotoCaption(photo.id, caption);
    const saved = result.data;
    if (!result.success || !saved) return result.error ?? "We couldn't save the caption.";

    setPhotos((current) => current.map((other) => (other.id === saved.id ? saved : other)));
    return null;
  }, []);

  const removePhoto = useCallback<UsePhotosResult["removePhoto"]>(async (photo) => {
    const result = await deletePhoto(photo);
    if (!result.success) return result.error;

    setPhotos((current) => current.filter((other) => other.id !== photo.id));
    return null;
  }, []);

  return { photos, isLoading, isUploading, error, addPhotos, saveCaption, removePhoto };
}
