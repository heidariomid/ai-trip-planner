import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";

export interface RevealProps {
  children: ReactNode;
  /** Steps of 90ms, so neighbours arrive one after another. */
  delay?: 0 | 1 | 2 | 3 | 4;
  /** Shows at once instead of waiting to be scrolled to. */
  eager?: boolean;
  className?: string;
}

const DELAY = ["", "lp-d1", "lp-d2", "lp-d3", "lp-d4"] as const;

/** Fades its children up the first time they scroll into view. Web only. */
export function Reveal({ children, delay = 0, eager = false, className = "" }: RevealProps) {
  const ref = useRef<View>(null);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    // On the web a View's ref is its element.
    const element = ref.current as unknown as Element | null;
    if (eager || !element || typeof IntersectionObserver === "undefined") {
      setIsShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <View
      ref={ref}
      className={`lp-reveal ${DELAY[delay]} ${isShown ? "lp-in" : ""} ${className}`}
    >
      {children}
    </View>
  );
}
