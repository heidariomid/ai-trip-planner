import { useEffect, useState } from "react";

import { lookupPlace, type PlaceInfo } from "../lib/places";

/** A place's photo and address, or null until they arrive or when there are none. */
export function usePlaceInfo(name: string, near: string): PlaceInfo | null {
  const [info, setInfo] = useState<PlaceInfo | null>(null);

  useEffect(() => {
    let active = true;
    setInfo(null);

    void lookupPlace(name, near).then((found) => {
      if (active) setInfo(found);
    });

    return () => {
      active = false;
    };
  }, [name, near]);

  return info;
}
