import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";

import { getImageSource, PLACEHOLDER_IMAGE } from "../lib/storage";

/** A private Storage image for an `<Image>`: the placeholder until it is signed. */
export function useImageSource(path: string | null | undefined): ImageSourcePropType {
  const [source, setSource] = useState<ImageSourcePropType>(PLACEHOLDER_IMAGE);

  useEffect(() => {
    let active = true;
    setSource(PLACEHOLDER_IMAGE);

    void getImageSource(path).then((next) => {
      if (active) setSource(next);
    });

    return () => {
      active = false;
    };
  }, [path]);

  return source;
}
