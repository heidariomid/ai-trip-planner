import type { Session, User } from "@supabase/supabase-js";
import { useLinkingURL } from "expo-linking";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { createSessionFromUrl } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read back on cold start. */
  isRestoring: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Covers the case where the OAuth redirect opens the app cold, so there is no
  // openAuthSessionAsync call waiting to receive the tokens.
  const linkingUrl = useLinkingURL();

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
      })
      .catch((error: unknown) => {
        console.error("[auth] could not restore session", error);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsRestoring(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // On web, detectSessionInUrl already consumes the redirect; doing it here
    // too would race with it.
    if (!linkingUrl || Platform.OS === "web") return;
    void createSessionFromUrl(linkingUrl);
  }, [linkingUrl]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isRestoring }),
    [session, isRestoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
