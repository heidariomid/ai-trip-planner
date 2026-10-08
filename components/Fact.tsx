import { View } from "react-native";

import { Text } from "./Text";

export interface FactProps {
  label: string;
  value: string;
}

/** A small `subtle` label above a bold `ink` value. */
export function Fact({ label, value }: FactProps) {
  return (
    <View>
      <Text className="text-[13px] text-subtle">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-semibold text-ink">{value}</Text>
    </View>
  );
}
