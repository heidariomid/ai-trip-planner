import type { ReactNode } from "react";

export interface DocumentScrollProps {
  children: ReactNode;
}

/** The landing page only exists in a browser; see `DocumentScroll.web.tsx`. */
export function DocumentScroll({ children }: DocumentScrollProps) {
  return <>{children}</>;
}
