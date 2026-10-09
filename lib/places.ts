import { supabase } from "./supabase";

/** What is known about a place the assistant named. */
export interface PlaceInfo {
  name: string;
  address: string | null;
  /** The place's own page in Google Maps, when the source knows it. */
  mapsUrl: string | null;
  photoUrl: string | null;
  /** Who to credit, shown with the photo. */
  photoCredit: string | null;
}

/**
 * Where place photos come from. `wikipedia` is free and needs no key (user
 * decision, 2026-10-09, "a free model for now"): well-known places get a real
 * photo and the rest keep the placeholder. `google` is the paid, complete
 * source: it works once `GOOGLE_PLACES_API_KEY` is set on the `place-photo`
 * Edge Function, and switching is this one line.
 */
const PLACE_SOURCE: "wikipedia" | "google" = "wikipedia";

function asText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

// ---------------------------------------------------------------------------
// Wikipedia
// ---------------------------------------------------------------------------

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const PHOTO_WIDTH = 640;
const COVER_WIDTH = 1280;
// Wikipedia turns away a burst of requests, so they go out one at a time with
// a short pause between them.
const PAUSE_BETWEEN_REQUESTS_MS = 400;
// How long to wait before the one retry after being told to slow down.
const SLOW_DOWN_WAIT_MS = 2000;

const SMALL_WORDS = new Set([
  "the", "of", "de", "da", "do", "dos", "das", "di", "del", "la", "le", "el", "and", "a", "in", "at",
]);

/** "Castelo de São Jorge" becomes ["castelo", "sao", "jorge"]. */
function toWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !SMALL_WORDS.has(word));
}

/**
 * True when a page's title is about the place that was asked for. A search
 * always returns something, and a wrong photo is worse than none: "Hotel
 * Avenida" must not show a picture of the avenue.
 */
function isSamePlace(name: string, title: string): boolean {
  const asked = toWords(name);
  const found = new Set(toWords(title));
  if (asked.length === 0 || found.size === 0) return false;

  const shared = asked.filter((word) => found.has(word));
  return (
    shared.some((word) => word.length >= 4) &&
    shared.length / Math.min(asked.length, found.size) >= 0.66
  );
}

interface WikipediaPage {
  title: string;
  photoUrl: string | null;
}

/** The best page for a search, or null. `undefined` means Wikipedia said to slow down. */
async function searchWikipedia(
  query: string,
  width: number = PHOTO_WIDTH,
): Promise<WikipediaPage | null | undefined> {
  const url =
    `${WIKIPEDIA_API}?action=query&format=json&origin=*&generator=search&gsrlimit=1` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=${width}` +
    `&gsrsearch=${encodeURIComponent(query)}`;

  const response = await fetch(url);
  if (response.status === 429) return undefined;
  if (!response.ok) return null;

  const body: unknown = await response.json();
  const pages = (body as { query?: { pages?: Record<string, unknown> } }).query?.pages;
  const page = pages ? Object.values(pages)[0] : null;
  if (typeof page !== "object" || page === null) return null;

  const fields = page as { title?: unknown; thumbnail?: { source?: unknown } };
  const title = asText(fields.title);
  return title ? { title, photoUrl: asText(fields.thumbnail?.source) } : null;
}

let queue: Promise<unknown> = Promise.resolve();

/** Runs one job after the ones already waiting, then pauses. */
function inTurn<T>(job: () => Promise<T>): Promise<T> {
  const result = queue.then(job, job);
  queue = result.then(
    () => new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_REQUESTS_MS)),
    () => undefined,
  );
  return result;
}

async function fetchFromWikipedia(name: string, near: string): Promise<PlaceInfo | null> {
  // The name alone first: a famous place has a page of that name. The city is
  // added only as a second try.
  const queries = near ? [name, `${name} ${near}`] : [name];

  for (const query of queries) {
    let page = await inTurn(() => searchWikipedia(query));
    if (page === undefined) {
      page = await inTurn(async () => {
        await new Promise((resolve) => setTimeout(resolve, SLOW_DOWN_WAIT_MS));
        return searchWikipedia(query);
      });
    }
    if (page === undefined) throw new Error("Wikipedia asked to slow down");
    if (page?.photoUrl && isSamePlace(name, page.title)) {
      return {
        name,
        address: null,
        mapsUrl: null,
        photoUrl: page.photoUrl,
        photoCredit: "Wikipedia",
      };
    }
  }
  return null;
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** A picture to upload as a trip's cover: where it is, and what kind it is. */
export interface RemotePicture {
  uri: string;
  mimeType: string;
}

/**
 * A wide photo of a destination, for the cover of a trip made in the chat, or
 * null when there is none. "Lisbon, Portugal" is looked up as "Lisbon". Free,
 * from Wikipedia; spec 13 replaces it with a generated cover.
 */
export async function findDestinationPicture(destination: string): Promise<RemotePicture | null> {
  const city = destination.split(",")[0]?.trim() ?? "";
  if (!city) return null;

  try {
    const page = await inTurn(() => searchWikipedia(city, COVER_WIDTH));
    if (!page?.photoUrl || !isSamePlace(city, page.title)) return null;

    const extension = page.photoUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    const mimeType = MIME_TYPES[extension];
    // An SVG flag or map is not a cover.
    return mimeType ? { uri: page.photoUrl, mimeType } : null;
  } catch (error) {
    console.warn("[places] destination picture failed", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Google Places, through the Edge Function that holds the key
// ---------------------------------------------------------------------------

async function fetchFromGoogle(name: string, near: string): Promise<PlaceInfo | null> {
  const { data, error } = await supabase.functions.invoke("place-photo", {
    body: { name, near },
  });
  // Not set up, over today's cap, or offline: the card keeps its placeholder.
  if (error) return null;

  const place: unknown = (data as { place?: unknown } | null)?.place;
  if (typeof place !== "object" || place === null) return null;
  const fields = place as Record<string, unknown>;

  return {
    name: asText(fields.name) ?? name,
    address: asText(fields.address),
    mapsUrl: asText(fields.maps_url),
    photoUrl: asText(fields.photo_url),
    photoCredit: asText(fields.photo_credit),
  };
}

// ---------------------------------------------------------------------------

// One lookup per place for as long as the app is open, so a card that scrolls
// back into view does not ask again. A miss is kept too.
const lookups = new Map<string, Promise<PlaceInfo | null>>();

/**
 * A real photo of a place, or null when there is none to show. `near` is the
 * city, so "Central Station" finds the right one.
 */
export function lookupPlace(name: string, near: string): Promise<PlaceInfo | null> {
  const key = `${name.trim().toLowerCase()}|${near.trim().toLowerCase()}`;
  const known = lookups.get(key);
  if (known) return known;

  const fetchPlace = PLACE_SOURCE === "google" ? fetchFromGoogle : fetchFromWikipedia;
  const lookup = fetchPlace(name.trim(), near.trim()).catch((error: unknown) => {
    console.warn("[places] lookup failed", error);
    // Not kept: the next card that asks for this place tries again.
    lookups.delete(key);
    return null;
  });
  lookups.set(key, lookup);
  return lookup;
}
