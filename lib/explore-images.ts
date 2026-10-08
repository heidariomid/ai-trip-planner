import { Asset } from "expo-asset";
import type { ImageRequireSource, ImageSourcePropType } from "react-native";

import { PLACEHOLDER_IMAGE, type LocalImage } from "./storage";

// Plan pictures ship inside the app. A plan row holds only the key, because
// Storage has no folder a plan could own and a migration cannot upload a file.
const IMAGES: Record<string, ImageRequireSource> = {
  alps: require("../assets/explore/alps.jpg"),
  chicago: require("../assets/explore/chicago.jpg"),
  dubai: require("../assets/explore/dubai.jpg"),
  "los-angeles": require("../assets/explore/los-angeles.jpg"),
  tahoe: require("../assets/explore/tahoe.jpg"),
};

/** The bundled picture for a plan, or the shared placeholder for an unknown key. */
export function getExploreImage(key: string | null | undefined): ImageSourcePropType {
  return (key ? IMAGES[key] : undefined) ?? PLACEHOLDER_IMAGE;
}

/**
 * The same picture as a file that can be uploaded, so a copied plan can start
 * with it as the trip's own cover. Null when the key is unknown or the file
 * cannot be read; the copy then simply has no cover.
 */
export async function getExploreImageFile(
  key: string | null | undefined,
): Promise<LocalImage | null> {
  const module = key ? IMAGES[key] : undefined;
  if (module === undefined) return null;

  try {
    const asset = await Asset.fromModule(module).downloadAsync();
    return { uri: asset.localUri ?? asset.uri, mimeType: "image/jpeg" };
  } catch (error) {
    console.error("[explore] could not read the plan picture", error);
    return null;
  }
}
