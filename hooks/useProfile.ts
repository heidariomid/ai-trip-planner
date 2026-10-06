import { useEffect, useState } from "react";

import { getProfile, type Profile } from "../lib/profiles";
import { useAuth } from "./useAuth";

export interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    void getProfile(userId).then((result) => {
      if (!active) return;
      setProfile(result.data);
      setError(result.error);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  return { profile, isLoading, error };
}
