import { useEffect, useRef, useState } from "react";
import { Animated, Platform } from "react-native";

import { Text } from "./Text";

export interface RotatingTextProps {
  /** Shown one at a time, in order, then from the start again. */
  phrases: readonly string[];
  className?: string;
  /** How long one phrase stays, in milliseconds. */
  interval?: number;
}

const FADE_MS = 260;
const RISE = 8;
// The native driver does not exist on web, and asking for it there logs a warning.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

/** One line of text that swaps to the next phrase with a short fade and rise. */
export function RotatingText({ phrases, className, interval = 2600 }: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phrases.length < 2) return;

    const timer = setInterval(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setIndex((current) => (current + 1) % phrases.length);
        Animated.timing(progress, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      });
    }, interval);

    return () => {
      clearInterval(timer);
      progress.stopAnimation();
    };
  }, [phrases.length, interval, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] });

  return (
    // The animation is on a wrapper: classes do not reach an Animated.Text, and
    // the phrase would fall back to the system font.
    <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>
      <Text
        numberOfLines={1}
        // The whole set is read once, so a screen reader is not interrupted by each swap.
        accessibilityLabel={phrases.join(", ")}
        className={className}
      >
        {phrases[index]}
      </Text>
    </Animated.View>
  );
}
