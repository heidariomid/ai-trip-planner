import { hasPersian } from "./persian";
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
 * decision, 2026-10-09, "a free model for now"): a place with its own page gets
 * that photo, then Wikimedia Commons is searched, and what is left gets a photo
 * of its city, so a card is rarely left with the placeholder. `google` is the paid, complete
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

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const COMMONS_CANDIDATES = 5;
const PHOTO_WIDTH = 640;
const COVER_WIDTH = 1280;
// Wikipedia turns away a burst of requests, so they go out one at a time with
// a short pause between them.
const PAUSE_BETWEEN_REQUESTS_MS = 400;
// How long to wait before the one retry after being told to slow down, when
// Wikipedia does not say. It usually says 24 seconds.
const SLOW_DOWN_WAIT_MS = 25000;
const LONGEST_WAIT_MS = 30000;
let slowDownWaitMs = SLOW_DOWN_WAIT_MS;

/** Remembers how long a refusal said to wait. */
function noteSlowDown(response: Response): void {
  const seconds = Number(response.headers.get("Retry-After"));
  slowDownWaitMs =
    Number.isFinite(seconds) && seconds > 0
      ? Math.min(seconds * 1000 + 1000, LONGEST_WAIT_MS)
      : SLOW_DOWN_WAIT_MS;
}

// Wikimedia throttles an app that does not say who it is: with the name Expo
// sends by default, a reply with six places ran out after about ten requests
// and the rest kept the placeholder. A browser cannot set `User-Agent`, so the
// second header says the same thing there.
const WHO_IS_ASKING = "AITripPlanner/1.0 (Expo React Native app)";
const REQUEST_HEADERS = { "User-Agent": WHO_IS_ASKING, "Api-User-Agent": WHO_IS_ASKING };
// How many pages of one search are looked at for the right one.
const SEARCH_CANDIDATES = 3;

// A word many places share. Two names that share only these are not the same
// place: "Hotel Avenida Palace" is not the "Alvear Palace Hotel".
const COMMON_WORDS = new Set([
  "hotel", "palace", "market", "restaurant", "cafe", "museum", "park", "tower", "church",
  "bridge", "square", "garden", "gardens", "station", "beach", "temple", "shrine", "castle",
  "national", "city", "center", "centre", "street", "house", "old", "town",
]);

const SMALL_WORDS = new Set([
  "the", "of", "de", "da", "do", "dos", "das", "di", "del", "la", "le", "el", "and", "a", "in", "at",
]);

/** "Castelo de São Jorge" becomes ["castelo", "sao", "jorge"]. */
function toWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Punctuation only, so a name in Persian keeps its letters.
    .replace(/[\s!-/:-@[-`{-~،؛؟«»]+/g, " ")
    .split(" ")
    .filter((word) => word && !SMALL_WORDS.has(word));
}

function isTellingWord(word: string): boolean {
  return word.length >= 4 && !COMMON_WORDS.has(word);
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
    shared.some(isTellingWord) &&
    shared.length / Math.min(asked.length, found.size) >= 0.66
  );
}

/**
 * True when a Commons file is named after the place. A file name is long
 * ("Avenida Palace, Lisbon (52313315402).jpg"), so only the asked words count.
 */
function mentionsPlace(name: string, fileTitle: string): boolean {
  const asked = toWords(name);
  const found = new Set(toWords(fileTitle.replace(/^File:/i, "").replace(/\.\w+$/, "")));
  if (asked.length === 0) return false;

  const shared = asked.filter((word) => found.has(word));
  return shared.some(isTellingWord) && shared.length / asked.length >= 0.66;
}

/** The Wikipedia that is written in the language of the text. */
function getWikipediaApi(text: string): string {
  return `https://${hasPersian(text) ? "fa" : "en"}.wikipedia.org/w/api.php`;
}

interface WikipediaPage {
  title: string;
  photoUrl: string | null;
}

/**
 * The first page of a search that is about `name` and has a photo, or null.
 * `undefined` means Wikipedia said to slow down.
 */
async function searchWikipedia(
  query: string,
  name: string,
  width: number = PHOTO_WIDTH,
): Promise<WikipediaPage | null | undefined> {
  const url =
    `${getWikipediaApi(query)}?action=query&format=json&origin=*&generator=search` +
    `&gsrlimit=${SEARCH_CANDIDATES}&prop=pageimages&piprop=thumbnail&pithumbsize=${width}` +
    `&gsrsearch=${encodeURIComponent(query)}`;

  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (response.status === 429) {
    noteSlowDown(response);
    return undefined;
  }
  if (!response.ok) return null;

  const body: unknown = await response.json();
  const found = (body as { query?: { pages?: Record<string, unknown> } }).query?.pages;
  const pages = Object.values(found ?? {}) as {
    title?: unknown;
    index?: unknown;
    thumbnail?: { source?: unknown };
  }[];

  // Best match first: the object's own order is by page id.
  pages.sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0));
  for (const page of pages) {
    const title = asText(page.title);
    const photoUrl = asText(page.thumbnail?.source);
    if (title && photoUrl && isSamePlace(name, title)) return { title, photoUrl };
  }
  return null;
}

/** A photo on Wikimedia Commons whose file is named after the place, or null. */
async function searchCommons(
  name: string,
  city: string,
): Promise<string | null | undefined> {
  const url =
    `${COMMONS_API}?action=query&format=json&origin=*&generator=search&gsrnamespace=6` +
    `&gsrlimit=${COMMONS_CANDIDATES}&prop=imageinfo&iiprop=url&iiurlwidth=${PHOTO_WIDTH}` +
    `&gsrsearch=${encodeURIComponent(`${name} ${city} filetype:bitmap`)}`;

  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (response.status === 429) {
    noteSlowDown(response);
    return undefined;
  }
  if (!response.ok) return null;

  const body: unknown = await response.json();
  const pages = (body as { query?: { pages?: Record<string, unknown> } }).query?.pages;
  const files = Object.values(pages ?? {}) as {
    title?: unknown;
    index?: unknown;
    imageinfo?: { thumburl?: unknown }[];
  }[];

  // Best match first: the object's own order is by page id.
  files.sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0));
  for (const file of files) {
    const title = asText(file.title);
    const photoUrl = asText(file.imageinfo?.[0]?.thumburl);
    if (title && photoUrl && mentionsPlace(name, title)) return photoUrl;
  }
  return null;
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

/** Runs a search in turn and tries once more when told to slow down. */
async function patiently<T>(search: () => Promise<T | undefined>): Promise<T> {
  let found = await inTurn(search);
  if (found === undefined) {
    found = await inTurn(async () => {
      // The wait holds the whole line, so the cards behind this one do not
      // run into the same refusal. They fill in late instead of never.
      await new Promise((resolve) => setTimeout(resolve, slowDownWaitMs));
      return search();
    });
  }
  if (found === undefined) throw new Error("Wikipedia asked to slow down");
  return found;
}

// One lookup per city: several cards in a reply fall back on the same photo.
const cityPhotos = new Map<string, Promise<string | null>>();

function findCityPhoto(city: string): Promise<string | null> {
  const key = city.toLowerCase();
  const known = cityPhotos.get(key);
  if (known) return known;

  const lookup = patiently(() => searchWikipedia(city, city)).then(
    (page) => page?.photoUrl ?? null,
    () => {
      cityPhotos.delete(key);
      return null;
    },
  );
  cityPhotos.set(key, lookup);
  return lookup;
}

function toPhoto(name: string, photoUrl: string, photoCredit: string): PlaceInfo {
  return { name, address: null, mapsUrl: null, photoUrl, photoCredit };
}

async function fetchFromWikipedia(name: string, near: string): Promise<PlaceInfo | null> {
  const city = near.split(/[,،]/)[0]?.trim() ?? "";
  // With the city first, so "Time Out Market" finds the one in Lisbon and not
  // the magazine. The name alone is the second try.
  const queries = city ? [`${name} ${city}`, name] : [name];

  for (const query of queries) {
    const page = await patiently(() => searchWikipedia(query, name));
    if (page?.photoUrl) return toPhoto(name, page.photoUrl, "Wikipedia");
  }

  // A hotel or a restaurant rarely has a page, and often has a photo.
  const filePhoto = await patiently(() => searchCommons(name, city));
  if (filePhoto) return toPhoto(name, filePhoto, "Wikimedia Commons");

  // Better the city than a grey box, and the credit says which it is.
  const cityPhoto = city ? await findCityPhoto(city) : null;
  return cityPhoto ? toPhoto(name, cityPhoto, `${city} · Wikipedia`) : null;
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
  const city = destination.split(/[,،]/)[0]?.trim() ?? "";
  if (!city) return null;

  try {
    const page = await inTurn(() => searchWikipedia(city, city, COVER_WIDTH));
    if (!page?.photoUrl) return null;

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
