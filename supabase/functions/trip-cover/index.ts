// Spec 13: a cover picture for a trip, drawn by an image model. The app sends
// the trip's title, destination, and description; this function builds the
// prompt, asks Cloudflare Workers AI for one landscape picture, and hands the
// bytes back for a preview. It writes nothing: the app uploads the picture
// when the traveller saves. The Cloudflare token lives here as a function
// secret and never reaches the app.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const WIDTH = 1024;
const HEIGHT = 576;
const MODEL_TIMEOUT_MS = 60_000;

// Generations one user may make on one UTC day. The app cannot raise it. The
// model's free allowance is shared by everyone, so this also keeps one account
// from using all of it.
const DAILY_LIMIT = 5;

const MAX_TITLE_LENGTH = 80;
const MAX_DESTINATION_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 200;

const NOT_SET_UP = "Cover generation is not set up yet.";
const OVER_LIMIT = "You've used today's covers. Try again tomorrow, or choose a photo.";
const SHARED_LIMIT =
  "The free daily limit for everyone was reached. Back tomorrow, or choose a photo.";
const FAILED = "We couldn't create a cover this time. Try again, or choose a photo.";

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

// The traveller's words only say what the trip is. Everything about how the
// picture looks is fixed here.
function buildPrompt(title: string, destination: string, description: string): string {
  const about = [title, description].filter(Boolean).join(". ");
  return [
    `A travel photograph of ${destination}.`,
    about ? `The trip: ${about}.` : "",
    "Wide landscape view of the place itself, natural light, realistic, vivid but not oversaturated.",
    "No text, no captions, no logos, no watermark, no borders, no people in the foreground.",
  ]
    .filter(Boolean)
    .join(" ");
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
    return json(400, { error: "Send the trip's destination." });
  }

  // The form asks how many are left before the traveller spends one.
  if (payload?.check === true) {
    const { data: used, error } = await supabase.rpc("cover_generations_used");
    if (error || typeof used !== "number") {
      console.error("[trip-cover] usage check failed", error);
      return json(500, { error: FAILED });
    }
    return json(200, { remaining: Math.max(0, DAILY_LIMIT - used) });
  }

  const title = text(payload?.title, MAX_TITLE_LENGTH);
  const destination = text(payload?.destination, MAX_DESTINATION_LENGTH);
  const description = text(payload?.description, MAX_DESCRIPTION_LENGTH);
  if (!destination) return json(400, { error: "Add a destination first." });

  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const cloudflareToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
  if (!accountId || !cloudflareToken) {
    console.error("[trip-cover] the Cloudflare secrets are not set");
    return json(503, { error: NOT_SET_UP });
  }

  // Counted before the model is called, so a request over the cap never
  // reaches it. A generation that fails after this still used one.
  const { data: remaining, error: capError } = await supabase.rpc("consume_cover_generation", {
    p_limit: DAILY_LIMIT,
  });
  if (capError || typeof remaining !== "number") {
    console.error("[trip-cover] cap check failed", capError);
    return json(500, { error: FAILED });
  }
  if (remaining < 0) return json(429, { error: OVER_LIMIT, remaining: 0 });

  const form = new FormData();
  form.append("prompt", buildPrompt(title, destination, description));
  form.append("width", String(WIDTH));
  form.append("height", String(HEIGHT));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    // No Content-Type by hand: the form sets its own, with the boundary.
    const answer = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${cloudflareToken}` },
        body: form,
        signal: controller.signal,
      },
    );

    if (!answer.ok) {
      // A blocked prompt and a spent daily allowance both land here.
      const detail = (await answer.text()).slice(0, 500);
      console.error("[trip-cover] model answered", answer.status, detail);
      const sharedLimit =
        answer.status === 429 || /quota|neuron|allowance|billing/i.test(detail);
      return json(502, { error: sharedLimit ? SHARED_LIMIT : FAILED, remaining });
    }

    const image: unknown = (await answer.json())?.result?.image;
    if (typeof image !== "string" || image.length === 0) {
      console.error("[trip-cover] model answered with no image");
      return json(502, { error: FAILED, remaining });
    }

    return json(200, { image, mime_type: "image/jpeg", remaining });
  } catch (error) {
    console.error("[trip-cover] generation failed", error);
    return json(502, { error: FAILED, remaining });
  } finally {
    clearTimeout(timer);
  }
});
