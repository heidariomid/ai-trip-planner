import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import { getImageSource, PLACEHOLDER_IMAGE } from "../lib/storage";

/**
 * The picture for an avatar, or null when there is none to show. An uploaded
 * avatar (`path`, private) comes first, then the public `url` a Google
 * sign-in brought. Unlike a cover, an avatar never shows the placeholder:
 * null lets the caller draw the first letter of the name instead.
 */
export function useAvatarSource(
  path: string | null | undefined,
  url: string | null | undefined,
): ImageSourcePropType | null {
  const [signed, setSigned] = useState<ImageSourcePropType | null>(null);
  const [isSigning, setIsSigning] = useState(Boolean(path));

  useEffect(() => {
    let active = true;
    setSigned(null);
    setIsSigning(Boolean(path));
    if (!path) return;

    void getImageSource(path).then((source) => {
      if (!active) return;
      setSigned(source === PLACEHOLDER_IMAGE ? null : source);
      setIsSigning(false);
    });

    return () => {
      active = false;
    };
  }, [path]);

  if (signed) return signed;
  // While the uploaded picture is being signed, the letter shows rather than
  // a Google picture the traveller has already replaced.
  if (path && isSigning) return null;
  return url ? { uri: url } : null;
}
