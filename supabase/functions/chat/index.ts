// Spec 11: the assistant. The app sends one message; this function checks who
// is asking, counts the request against the daily cap, reads the trip with the
// caller's own token, calls the model, and streams the reply back. The model
// key lives here as a function secret and never reaches the app.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Chosen at the start of spec 11: a Gemini Flash-Lite model, on the same
// GEMINI_API_KEY the cover in spec 13 uses.
const MODEL = "gemini-3.5-flash-lite";
const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`;

// Requests one user may make on one UTC day. The app does not send this and
// cannot raise it.
const DAILY_LIMIT = 30;
const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_MESSAGES = 20;
// A long trip must not grow the prompt without limit.
const MAX_ACTIVITIES_IN_PROMPT = 60;
const MAX_OUTPUT_TOKENS = 2048;

const OVER_LIMIT = `You have reached today's limit of ${DAILY_LIMIT} messages. Try again tomorrow.`;
const NOT_SET_UP = "The assistant is not set up yet.";
const BUSY = "The assistant is busy right now. Try again in a minute.";
const NO_ANSWER = "The assistant could not answer that. Try asking another way.";
const FAILED = "The assistant could not answer. Please try again.";

const CARDS_OPEN = "<cards>";
const CARDS_CLOSE = "</cards>";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;

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

// ---------------------------------------------------------------------------
// Cards: what the model may attach, cut down to what the app will draw
// ---------------------------------------------------------------------------

interface PlaceCard {
  name: string;
  line: string;
}

interface DayItem {
  time: string | null;
  place: string | null;
  activity: string;
}

interface DayCard {
  title: string;
  items: DayItem[];
}

interface Cards {
  chips: string[];
  places: PlaceCard[];
  days: DayCard[];
}

/** A short plain string. A URL the model wrote is dropped, never passed on. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(URL_PATTERN, "").replace(/\s+/g, " ").trim().slice(0, max);
}

function list(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function field(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function toCards(raw: string): Cards | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const chips = list(field(parsed, "chips"), 4)
    .map((chip) => clean(chip, 48))
    .filter(Boolean);

  const places = list(field(parsed, "places"), 6)
    .map((place) => ({ name: clean(field(place, "name"), 80), line: clean(field(place, "line"), 160) }))
    .filter((place) => place.name);

  const days = list(field(parsed, "days"), 7)
    .map((day) => ({
      title: clean(field(day, "title"), 80),
      items: list(field(day, "items"), 8)
        .map((item) => ({
          time: clean(field(item, "time"), 20) || null,
          place: clean(field(item, "place"), 80) || null,
          activity: clean(field(item, "activity"), 160),
        }))
        .filter((item) => item.activity),
    }))
    .filter((day) => day.title && day.items.length > 0);

  if (chips.length + places.length + days.length === 0) return null;
  return { chips, places, days };
}

/** Splits a finished reply into the text to show and the cards after it. */
function splitReply(full: string): { content: string; cards: Cards | null } {
  const start = full.indexOf(CARDS_OPEN);
  if (start === -1) return { content: full.trim(), cards: null };

  const end = full.indexOf(CARDS_CLOSE, start);
  const raw = full.slice(start + CARDS_OPEN.length, end === -1 ? undefined : end);
  return { content: full.slice(0, start).trim(), cards: toCards(raw.trim()) };
}

/**
 * How much of the reply so far is safe to show: everything before the cards
 * block, and not the last few characters if they could be its opening tag.
 */
function visibleLength(full: string): number {
  const start = full.indexOf(CARDS_OPEN);
  if (start !== -1) return start;

  for (let size = CARDS_OPEN.length - 1; size > 0; size -= 1) {
    if (full.endsWith(CARDS_OPEN.slice(0, size))) return full.length - size;
  }
  return full.length;
}

// ---------------------------------------------------------------------------
// The prompt
// ---------------------------------------------------------------------------

interface ActivityRow {
  starts_at: string | null;
  ends_at: string | null;
  place: string | null;
  activity: string | null;
}

interface DayRow {
  day_number: number;
  date: string;
  itinerary_activities: ActivityRow[];
}

function describeTrip(trip: Record<string, unknown>, days: DayRow[]): string {
  const lines = [
    "The traveller has this trip selected:",
    `- Title: ${trip.title}`,
    `- From ${trip.source} to ${trip.destination}`,
    `- Dates: ${trip.start_date} to ${trip.end_date}`,
  ];
  if (trip.description) lines.push(`- Description: ${trip.description}`);

  let sent = 0;
  const planned: string[] = [];
  for (const day of [...days].sort((a, b) => a.day_number - b.day_number)) {
    const activities = [...day.itinerary_activities].sort((a, b) =>
      (a.starts_at ?? "").localeCompare(b.starts_at ?? ""),
    );
    for (const activity of activities) {
      if (sent >= MAX_ACTIVITIES_IN_PROMPT) break;
      const time = activity.starts_at ? activity.starts_at.slice(0, 5) : "no time";
      const where = activity.place ? ` at ${activity.place}` : "";
      planned.push(
        `- Day ${day.day_number} (${day.date}), ${time}: ${activity.activity ?? "activity"}${where}`,
      );
      sent += 1;
    }
  }

  if (planned.length === 0) {
    lines.push("Nothing is planned on this trip yet.");
  } else {
    lines.push(
      "Already on this trip. Do not suggest a place that is already listed here:",
      ...planned,
    );
  }
  return lines.join("\n");
}

function buildSystemPrompt(tripContext: string | null, interests: string[]): string {
  const parts = [
    "You are the assistant inside a trip planning app. You help a traveller plan trips: where to go, what to do each day, what to eat, and how to pace it.",
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    "You can only talk. You cannot create, save, or change a trip, an itinerary, a booking, or a picture, and you must never say that you did. If asked to save something, say that saving from the chat is not available yet.",
    "Keep replies short and practical. Ask one follow-up question when you need a detail such as dates, budget, or pace.",
    "Write in Markdown using only headings, bold, and lists. Never write a link, a URL, or an image.",
    [
      "After your text you may add one cards block, on its own at the very end, in exactly this form:",
      '<cards>{"chips":["..."],"places":[{"name":"...","line":"..."}],"days":[{"title":"Day 1: ...","items":[{"time":"09:00","place":"...","activity":"..."}]}]}</cards>',
      "Every key is optional. chips: up to 4 short follow-up messages the traveller might send next. places: up to 6 places, each with a name and one short line. days: up to 7 days, each with up to 8 items. Use days when you propose a day-by-day plan and places when you recommend specific places. The block must be valid JSON on one line, with no URLs. Do not mention the block in your text, and do not repeat its contents as a long list in the text.",
    ].join("\n"),
  ];

  if (interests.length > 0) {
    parts.push(`The traveller's interests: ${interests.join(", ")}.`);
  }
  parts.push(tripContext ?? "No trip is selected. The traveller may be exploring ideas.");
  return parts.join("\n\n");
}

interface StoredMessage {
  role: string;
  content: string;
  cards: unknown;
}

/** Earlier turns, oldest first, with same-role neighbours joined as the model expects. */
function toContents(history: StoredMessage[], message: string) {
  const turns = [
    ...history.map((row) => ({
      role: row.role === "assistant" ? "model" : "user",
      text: row.cards
        ? `${row.content}\n${CARDS_OPEN}${JSON.stringify(row.cards)}${CARDS_CLOSE}`
        : row.content,
    })),
    { role: "user", text: message },
  ];

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const turn of turns) {
    const last = contents[contents.length - 1];
    if (last && last.role === turn.role) last.parts.push({ text: turn.text });
    else contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }
  // The first turn has to be the traveller's.
  while (contents.length > 0 && contents[0].role !== "user") contents.shift();
  return contents;
}

async function loadContext(supabase: SupabaseClient, userId: string, tripId: string | null) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("interests")
    .eq("id", userId)
    .maybeSingle();
  const interests: string[] = Array.isArray(profile?.interests) ? profile.interests : [];

  if (!tripId) return { interests, tripContext: null };

  // Read with the caller's token, so row-level security decides what is seen.
  const { data: trip } = await supabase
    .from("trips")
    .select(
      "title, source, destination, start_date, end_date, description, itinerary_days(day_number, date, itinerary_activities(starts_at, ends_at, place, activity))",
    )
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) return { interests, tripContext: null };
  return { interests, tripContext: describeTrip(trip, trip.itinerary_days as DayRow[]) };
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

/** Yields the reply's text as it arrives. */
async function* readModelText(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
      if (!line.startsWith("data:")) continue;

      try {
        const chunk = JSON.parse(line.slice(5).trim());
        const parts = chunk?.candidates?.[0]?.content?.parts;
        if (!Array.isArray(parts)) continue;
        for (const part of parts) {
          if (typeof part?.text === "string" && !part.thought) yield part.text;
        }
      } catch {
        // A line that is not JSON carries nothing to show.
      }
    }
  }
}

// ---------------------------------------------------------------------------
// The request
// ---------------------------------------------------------------------------

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const apiKey = request.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!token || !apiKey || !supabaseUrl) return json(401, { error: "Sign in to use the assistant." });

  // Every query below runs as the caller. The secret key is never used.
  const supabase = createClient(supabaseUrl, apiKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return json(401, { error: "Sign in to use the assistant." });
  const userId = auth.user.id;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Send a message to the assistant." });
  }

  const rawMessage = field(payload, "message");
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
  const threadId = field(payload, "thread_id");
  const tripId = field(payload, "trip_id");

  if (!message) return json(400, { error: "Write a message first." });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return json(400, { error: `Keep your message under ${MAX_MESSAGE_LENGTH} characters.` });
  }
  if (threadId != null && (typeof threadId !== "string" || !UUID.test(threadId))) {
    return json(400, { error: "That conversation isn't available." });
  }
  if (tripId != null && (typeof tripId !== "string" || !UUID.test(tripId))) {
    return json(400, { error: "That trip isn't available." });
  }

  const modelKey = Deno.env.get("GEMINI_API_KEY");
  if (!modelKey) {
    console.error("[chat] GEMINI_API_KEY is not set");
    return json(503, { error: NOT_SET_UP });
  }

  // The thread: an existing one of the caller's, or a new one.
  let thread: { id: string; trip_id: string | null };
  if (typeof threadId === "string") {
    const { data } = await supabase
      .from("chat_threads")
      .select("id, trip_id")
      .eq("id", threadId)
      .maybeSingle();
    if (!data) return json(404, { error: "That conversation isn't available." });
    thread = data;
  } else {
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ trip_id: typeof tripId === "string" ? tripId : null })
      .select("id, trip_id")
      .single();
    if (error || !data) {
      console.error("[chat] thread insert failed", error);
      return json(403, { error: "That trip isn't available." });
    }
    thread = data;
  }

  // Counted before the model is called, so a request over the cap never reaches it.
  const { data: allowed, error: capError } = await supabase.rpc("consume_chat_request", {
    p_limit: DAILY_LIMIT,
  });
  if (capError) {
    console.error("[chat] cap check failed", capError);
    return json(500, { error: FAILED });
  }
  if (!allowed) return json(429, { error: OVER_LIMIT });

  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content, cards")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_MESSAGES);
  const history = ((historyRows ?? []) as StoredMessage[]).reverse();

  const { data: userMessage, error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({ thread_id: thread.id, role: "user", content: message })
    .select("id, created_at")
    .single();
  if (userMessageError || !userMessage) {
    console.error("[chat] user message insert failed", userMessageError);
    return json(500, { error: FAILED });
  }

  const { interests, tripContext } = await loadContext(supabase, userId, thread.trip_id);

  let modelResponse: Response;
  try {
    modelResponse = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": modelKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt(tripContext, interests) }] },
        contents: toContents(history, message),
        generationConfig: { temperature: 0.7, maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
    });
  } catch (error) {
    console.error("[chat] model request failed", error);
    return json(502, { error: FAILED, thread_id: thread.id });
  }

  if (!modelResponse.ok || !modelResponse.body) {
    // The provider's own words are logged for us and never shown.
    console.error("[chat] model answered", modelResponse.status, await modelResponse.text());
    const error = modelResponse.status === 429 ? BUSY : FAILED;
    return json(502, { error, thread_id: thread.id });
  }

  const modelBody = modelResponse.body;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      send({ type: "thread", thread_id: thread.id, user_message: userMessage });

      let full = "";
      let shown = 0;
      try {
        for await (const text of readModelText(modelBody)) {
          full += text;
          const visible = visibleLength(full);
          if (visible > shown) {
            send({ type: "delta", text: full.slice(shown, visible) });
            shown = visible;
          }
        }

        const { content, cards } = splitReply(full);
        if (!content && !cards) {
          send({ type: "error", message: NO_ANSWER });
        } else {
          const { data: saved, error } = await supabase
            .from("chat_messages")
            .insert({ thread_id: thread.id, role: "assistant", content, cards })
            .select("id, role, content, cards, created_at")
            .single();
          if (error || !saved) {
            console.error("[chat] assistant message insert failed", error);
            // The traveller still gets the reply; it is only missing next time.
            send({
              type: "done",
              message: {
                id: crypto.randomUUID(),
                role: "assistant",
                content,
                cards,
                created_at: new Date().toISOString(),
              },
            });
          } else {
            send({ type: "done", message: saved });
          }
        }
      } catch (error) {
        console.error("[chat] stream failed", error);
        send({ type: "error", message: FAILED });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
