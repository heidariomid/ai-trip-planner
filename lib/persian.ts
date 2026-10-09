import { isValidElement, type ReactNode } from "react";

const PERSIAN = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/** True when the text holds a Persian or Arabic letter, which Outfit cannot draw. */
export function hasPersian(text: string | null | undefined): boolean {
  return Boolean(text) && PERSIAN.test(text as string);
}

/** The same question for whatever a `Text` was given to show. */
export function hasPersianChildren(children: ReactNode): boolean {
  if (typeof children === "string") return hasPersian(children);
  if (Array.isArray(children)) return children.some(hasPersianChildren);
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return hasPersianChildren(children.props.children);
  }
  return false;
}

const FIRST_LETTER = /[A-Za-z\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** True when the first letter is Persian, so the text reads right to left. */
export function isRightToLeft(text: string | null | undefined): boolean {
  const first = text ? FIRST_LETTER.exec(text)?.[0] : undefined;
  return first !== undefined && PERSIAN.test(first);
}

function toPlainText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(toPlainText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return toPlainText(children.props.children);
  }
  return "";
}

export function isRightToLeftChildren(children: ReactNode): boolean {
  return isRightToLeft(toPlainText(children));
}

/** A raw style, because the writing direction has no class. */
export const RIGHT_TO_LEFT = { writingDirection: "rtl", textAlign: "right" } as const;
