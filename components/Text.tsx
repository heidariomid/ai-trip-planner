import { Text as NativeText, type TextProps } from "react-native";

const HAS_WEIGHT = /\bfont-(medium|semibold|bold)\b/;

/**
 * The app's text. React Native has no inherited font, so every string goes
 * through this to land in Outfit. A weight class already names its own Outfit
 * file, and adding `font-regular` beside it would leave two families competing.
 */
export function Text({ className = "", ...props }: TextProps) {
  const family = HAS_WEIGHT.test(className) ? "" : "font-regular ";

  return <NativeText className={`${family}${className}`} {...props} />;
}
