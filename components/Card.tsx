import type { ReactNode } from "react";
import { View } from "react-native";

import { shadows } from "../lib/theme";

export interface CardProps {
  children: ReactNode;
  /** No padding, for a card whose picture runs edge to edge. */
  flush?: boolean;
}

/** White surface lifted off the canvas by a soft shadow. */
export function Card({ children, flush = false }: CardProps) {
  return (
    <View
      style={shadows.card}
      className={`rounded-card bg-surface ${flush ? "" : "px-5 py-6"}`}
    >
      {children}
    </View>
  );
}
