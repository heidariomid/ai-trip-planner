import { Image, View } from "react-native";

import { shadows } from "../lib/theme";
import { Text } from "./Text";

export interface AvatarProps {
  uri: string | null | undefined;
  name: string;
  size?: number;
}

/** The profile picture, or the first letter of the name when there is none. */
export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const box = { width: size, height: size };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={box}
        className="rounded-full bg-surface"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={[box, shadows.soft]}
      className="items-center justify-center rounded-full bg-surface"
    >
      <Text className="font-semibold text-ink" style={{ fontSize: size * 0.4 }}>
        {name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
