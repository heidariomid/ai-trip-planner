import type { ReactNode } from "react";
import { View } from "react-native";

import { shadows } from "../lib/theme";

export interface CardProps {
  children: ReactNode;
}

/** White surface lifted off the canvas by a soft shadow. */
export function Card({ children }: CardProps) {
  return (
    <View style={shadows.card} className="rounded-card bg-surface px-5 py-6">
      {children}
    </View>
  );
}
