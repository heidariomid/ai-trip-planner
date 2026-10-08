import { Image, View } from "react-native";

import { useAvatarSource } from "../hooks/useAvatarSource";
import { shadows } from "../lib/theme";
import { Text } from "./Text";

export interface AvatarProps {
  /** A private Storage path to an uploaded avatar. Shown first when set. */
  path?: string | null;
  /** A public or local picture, used when there is no uploaded avatar. */
  uri?: string | null;
  name: string;
  size?: number;
}

/** The profile picture, or the first letter of the name when there is none. */
export function Avatar({ path, uri, name, size = 48 }: AvatarProps) {
  const source = useAvatarSource(path, uri);
  const box = { width: size, height: size };

  if (source) {
    return (
      <Image
        source={source}
        resizeMode="cover"
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
