import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const ACTIVE_CLASS = "lp-document";

export interface DocumentScrollProps {
  children: ReactNode;
}

/**
 * Draws its children straight under `body` and lets the document itself
 * scroll. The app scrolls inside a fixed-height root, and a phone browser only
 * tucks its bars away, and draws the page behind them, when the document is
 * what moves.
 */
export function DocumentScroll({ children }: DocumentScrollProps) {
  const [host] = useState(() => document.createElement("div"));

  useLayoutEffect(() => {
    document.body.appendChild(host);
    document.documentElement.classList.add(ACTIVE_CLASS);

    return () => {
      document.documentElement.classList.remove(ACTIVE_CLASS);
      host.remove();
      window.scrollTo(0, 0);
    };
  }, [host]);

  return createPortal(children, host);
}
