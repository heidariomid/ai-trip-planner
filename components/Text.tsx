import { Text as NativeText, type TextProps } from "react-native";

import { hasPersianChildren, isRightToLeftChildren } from "../lib/persian";

const WEIGHT = /\bfont-(regular|medium|semibold|bold)\b/;
const ALIGNMENT = /\btext-(left|center|right)\b/;
// Outfit's tight settings. Persian letters join, so spacing between them
// breaks a word apart, and they stand taller, so tight lines run into each
// other.
const TIGHT = /\b(tracking-\S+|leading-(none|tight|snug))\s*/g;
const LINE_HEIGHT = /\bleading-(5|6|\[18px\]|\[22px\])(?=\s|$)/;

// Written out in full so Tailwind finds each class.
const ROOMIER_LINES: Record<string, string> = {
  "[18px]": "leading-[22px]",
  "5": "leading-6",
  "[22px]": "leading-7",
  "6": "leading-7",
};

function toPersianSpacing(className: string): string {
  return className
    .replace(TIGHT, "")
    .replace(LINE_HEIGHT, (_match, size: string) => ROOMIER_LINES[size]);
}

// Written out in full so Tailwind finds each class.
const PERSIAN_FAMILIES: Record<string, string> = {
  regular: "font-fa-regular",
  medium: "font-fa-medium",
  semibold: "font-fa-semibold",
  bold: "font-fa-bold",
};

/**
 * The app's text. React Native has no inherited font, so every string goes
 * through this to land in Outfit. A weight class already names its own Outfit
 * file, and adding `font-regular` beside it would leave two families competing.
 * Persian text is drawn in IRANSansX at the same weight, because Outfit has no
 * Persian letters and the platform would pick its own font for them, and it
 * reads right to left when its first letter is Persian.
 */
export function Text({ className = "", ...props }: TextProps) {
  const weight = WEIGHT.exec(className)?.[1];

  if (hasPersianChildren(props.children)) {
    const family = PERSIAN_FAMILIES[weight ?? "regular"];
    const isRightToLeft = isRightToLeftChildren(props.children);
    // A class that already places the text, such as `text-center`, is kept.
    const alignment = isRightToLeft && !ALIGNMENT.test(className) ? "text-right " : "";

    return (
      <NativeText
        className={`${family} ${alignment}${toPersianSpacing(className.replace(WEIGHT, ""))}`}
        {...props}
        style={isRightToLeft ? [props.style, { writingDirection: "rtl" }] : props.style}
      />
    );
  }

  const family = weight ? "" : "font-regular ";
  return <NativeText className={`${family}${className}`} {...props} />;
}
