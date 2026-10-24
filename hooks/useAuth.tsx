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

import {
  closePasswordRecovery,
  createSessionFromUrl,
  isPasswordRecoveryOpen,
  readPasswordRecoveryHold,
} from "../lib/auth";
import { supabase } from "../lib/supabase";
import { noteFirstGoogleSignIn } from "../lib/traffic";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the stored session has been read back on cold start. */
  isRestoring: boolean;
  /**
   * A reset code has been accepted and the new password is not saved yet.
   * The route guard stays on the auth screens while this is true.
   */
  isRecovering: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  // Covers the case where the OAuth redirect opens the app cold, so there is no
  // openAuthSessionAsync call waiting to receive the tokens.
  const linkingUrl = useLinkingURL();

  useEffect(() => {
    let active = true;

    Promise.all([supabase.auth.getSession(), readPasswordRecoveryHold()])
      .then(([{ data }, hold]) => {
        if (!active) return;
        setSession(data.session);
        // A reload between the code and the saved password must not open Home.
        setIsRecovering(hold && data.session !== null);
        if (hold && data.session === null) void closePasswordRecovery();
      })
      .catch((error: unknown) => {
        console.error("[auth] could not restore session", error);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY" || (isPasswordRecoveryOpen() && event === "SIGNED_IN")) {
        setIsRecovering(true);
      } else if (event === "USER_UPDATED" && isPasswordRecoveryOpen()) {
        void closePasswordRecovery();
        setIsRecovering(false);
      } else if (event === "SIGNED_OUT") {
        void closePasswordRecovery();
        setIsRecovering(false);
      }
      setSession(nextSession);
      setIsRestoring(false);
      // Deferred so this does not call the API while the auth lock is held.
      if (event === "SIGNED_IN") {
        const user = nextSession?.user ?? null;
        setTimeout(() => noteFirstGoogleSignIn(user), 0);
      }
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
    () => ({ session, user: session?.user ?? null, isRestoring, isRecovering }),
    [session, isRestoring, isRecovering],
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
