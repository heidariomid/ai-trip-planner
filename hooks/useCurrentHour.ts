import { useEffect, useState } from "react";
import { AppState } from "react-native";

const ONE_MINUTE = 60_000;

/**
 * The hour on the phone's own clock, from 0 to 23, kept current. It is read
 * again every minute and whenever the app comes back to the foreground, so a
 * screen left open across noon does not go on saying "morning".
 */
export function useCurrentHour(): number {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const update = () => setHour(new Date().getHours());

    const timer = setInterval(update, ONE_MINUTE);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return hour;
}
