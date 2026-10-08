import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { getProfile, type Profile } from "../lib/profiles";
import { useAuth } from "./useAuth";

export interface UseProfileResult {
  profile: Profile | null;
  /** True only for the first load, before there is anything to show. */
  isLoading: boolean;
  error: string | null;
}

/**
 * The signed-in user's profile, read again every time the screen gains focus.
 * Home and Profile each hold their own copy, so this is what brings an edit
 * made on one screen to the other.
 */
export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      let active = true;

      void getProfile(userId).then((result) => {
        if (!active) return;
        // A failed refresh keeps the profile already on screen.
        if (result.success) setProfile(result.data);
        setError(result.error);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [userId]),
  );

  return { profile, isLoading, error };
}
