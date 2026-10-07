import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "./Text";

export interface EmptyStateProps {
  message: string;
  /** At most one button. */
  children?: ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <View className="items-center px-4 py-10">
      <Text className="text-center text-[14px] leading-5 text-subtle">{message}</Text>
      {children ? <View className="mt-5">{children}</View> : null}
    </View>
  );
}
