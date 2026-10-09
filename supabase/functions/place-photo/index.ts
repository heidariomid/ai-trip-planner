// Spec 12 addition: a real photo for a place the assistant recommends. The app
// sends a place name and the city; this function asks Google Places for the
// place and one photo of it. The Google key lives here as a function secret and
// never reaches the app, and every lookup counts against a daily cap, because
// each one is a paid request.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
// Only fields of the Pro tier. A rating would move every lookup to a dearer one.
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.photos";
const PHOTO_WIDTH = 640;

// Lookups one user may make on one UTC day. The app cannot raise it.
const DAILY_LIMIT = 100;
const MAX_NAME_LENGTH = 120;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const apiKey = request.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!token || !apiKey || !supabaseUrl) return json(401, { error: "Sign in first." });

  const supabase = createClient(supabaseUrl, apiKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return json(401, { error: "Sign in first." });

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Send a place name." });
  }
  const name = text(payload?.name, MAX_NAME_LENGTH);
  const near = text(payload?.near, MAX_NAME_LENGTH);
  if (!name) return json(400, { error: "Send a place name." });

  const placesKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!placesKey) {
    console.error("[place-photo] GOOGLE_PLACES_API_KEY is not set");
    return json(503, { error: "Place photos are not set up yet." });
  }

  // Counted before Google is called, so a request over the cap costs nothing.
  const { data: allowed, error: capError } = await supabase.rpc("consume_place_lookup", {
    p_limit: DAILY_LIMIT,
  });
  if (capError) {
    console.error("[place-photo] cap check failed", capError);
    return json(500, { error: "The place could not be looked up." });
  }
  if (!allowed) return json(429, { error: "No more place photos today." });

  try {
    const search = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: near && !name.toLowerCase().includes(near.toLowerCase()) ? `${name}, ${near}` : name,
        pageSize: 1,
        languageCode: "en",
      }),
    });
    if (!search.ok) {
      console.error("[place-photo] search answered", search.status, await search.text());
      return json(502, { error: "The place could not be looked up." });
    }

    const place = (await search.json())?.places?.[0];
    // Found nothing: an answer, not a failure. The app keeps its placeholder.
    if (!place) return json(200, { place: null });

    const photo = Array.isArray(place.photos) ? place.photos[0] : null;
    let photoUrl: string | null = null;
    if (photo?.name) {
      // skipHttpRedirect returns the picture's address as JSON instead of the
      // picture, so the key stays here and the app loads the image itself.
      const media = await fetch(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${PHOTO_WIDTH}&skipHttpRedirect=true`,
        { headers: { "X-Goog-Api-Key": placesKey } },
      );
      if (media.ok) photoUrl = text((await media.json())?.photoUri, 2000) || null;
      else console.error("[place-photo] photo answered", media.status, await media.text());
    }

    return json(200, {
      place: {
        id: text(place.id, 200),
        name: text(place.displayName?.text, 120) || name,
        address: text(place.formattedAddress, 200) || null,
        maps_url: text(place.googleMapsUri, 500) || null,
        photo_url: photoUrl,
        // Google asks for the photographer's name wherever the photo shows.
        photo_credit: text(photo?.authorAttributions?.[0]?.displayName, 80) || null,
      },
    });
  } catch (error) {
    console.error("[place-photo] lookup failed", error);
    return json(502, { error: "The place could not be looked up." });
  }
});
