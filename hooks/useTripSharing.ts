import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  getJoinCode,
  listTripPeople,
  removeMember,
  rotateJoinCode,
  setMemberRole,
  type MemberRole,
  type TripPerson,
  type TripRole,
} from "../lib/members";

export interface UseTripSharingResult {
  people: TripPerson[];
  /** What the signed-in traveller is on this trip, or null before it is known. */
  role: TripRole | null;
  /** The join code. Only ever set for the owner. */
  code: string | null;
  isLoading: boolean;
  /** The list came back empty: the trip is gone, or the traveller is no longer on it. */
  isMissing: boolean;
  error: string | null;
  /** Each resolves to a sentence on failure, or null when it worked. */
  changeRole: (person: TripPerson, role: MemberRole) => Promise<string | null>;
  remove: (person: TripPerson) => Promise<string | null>;
  /** Makes a new code. The old one stops working. */
  regenerate: () => Promise<string | null>;
}

/** Who a trip is shared with and its join code, read again when the screen gains focus. */
export function useTripSharing(tripId: string): UseTripSharingResult {
  const [people, setPeople] = useState<TripPerson[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void (async () => {
        const result = await listTripPeople(tripId);
        if (!active) return;
        // A failed refresh keeps the list already on screen.
        if (result.success) {
          setPeople(result.data);
          setIsMissing(result.data.length === 0);
        }
        setError(result.error);
        setIsLoading(false);

        const isOwner = result.data.some((person) => person.isYou && person.role === "owner");
        if (!isOwner) return;
        const codeResult = await getJoinCode(tripId);
        if (!active) return;
        if (codeResult.success) setCode(codeResult.data);
        else setError(codeResult.error);
      })();

      return () => {
        active = false;
      };
    }, [tripId]),
  );

  const changeRole = useCallback<UseTripSharingResult["changeRole"]>(
    async (person, role) => {
      const result = await setMemberRole(tripId, person.id, role);
      if (!result.success) return result.error;
      setPeople((current) =>
        current.map((item) => (item.id === person.id ? { ...item, role } : item)),
      );
      return null;
    },
    [tripId],
  );

  const remove = useCallback<UseTripSharingResult["remove"]>(
    async (person) => {
      const result = await removeMember(tripId, person.id);
      if (!result.success) return result.error;
      setPeople((current) => current.filter((item) => item.id !== person.id));
      return null;
    },
    [tripId],
  );

  const regenerate = useCallback<UseTripSharingResult["regenerate"]>(async () => {
    const result = await rotateJoinCode(tripId);
    if (!result.success) return result.error;
    setCode(result.data);
    return null;
  }, [tripId]);

  return {
    people,
    role: people.find((person) => person.isYou)?.role ?? null,
    code,
    isLoading,
    isMissing,
    error,
    changeRole,
    remove,
    regenerate,
  };
}
