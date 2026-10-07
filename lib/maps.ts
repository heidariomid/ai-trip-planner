import { Linking } from "react-native";

const SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

/**
 * A Google Maps search for a place typed as text. The trip's destination is
 * added so "Central Station" lands in the right city. No key and no stored
 * location: Maps resolves the words itself.
 */
export function buildMapsUrl(place: string, destination: string): string {
  const query = place.toLowerCase().includes(destination.toLowerCase())
    ? place
    : `${place}, ${destination}`;
  return `${SEARCH_URL}${encodeURIComponent(query)}`;
}

/** Resolves false when the phone could not open the link. */
export async function openInMaps(place: string, destination: string): Promise<boolean> {
  try {
    await Linking.openURL(buildMapsUrl(place, destination));
    return true;
  } catch (error) {
    console.error("[maps] could not open", error);
    return false;
  }
}
