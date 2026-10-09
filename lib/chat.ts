import { fetch as streamingFetch } from "expo/fetch";

import type { Json } from "../types/database.types";
import { toReadableError } from "./errors";
import { supabase } from "./supabase";

export const MAX_CHAT_MESSAGE_LENGTH = 2000;

export interface PlaceCard {
  name: string;
  line: string;
  /** "Lisbon, Portugal". Empty on a reply saved before the assistant named one. */
  city: string;
}

export interface DayCardItem {
  time: string | null;
  place: string | null;
  activity: string;
}

export interface DayCard {
  /** Which day of the trip, from 1. */
  day: number;
  title: string;
  items: DayCardItem[];
}

/** The summary a new trip is made from. It has no source and no dates: a form asks. */
export interface TripSummaryCard {
  title: string;
  destination: string;
  dayCount: number;
  travelerCount: number;
  description: string;
}

export type BookingCard =
  | {
      kind: "hotel";
      name: string;
      checkIn: string | null;
      checkOut: string | null;
      /** Why this one: the area, the price level, who it suits. */
      line: string | null;
    }
  | { kind: "car"; company: string; pickupLocation: string | null; line: string | null }
  | { kind: "extra"; title: string; detail: string | null }
  | { kind: "flight"; airline: string; flightNumber: string };

/** Things to pack, under the category the packing list files them by. */
export interface PackingCard {
  category: string;
  items: string[];
}

/**
 * What the assistant attached to a reply. Part of the transcript only: a day
 * card here is not a row of the itinerary.
 */
export interface ChatCards {
  chips: string[];
  places: PlaceCard[];
  days: DayCard[];
  trip: TripSummaryCard | null;
  bookings: BookingCard[];
  packing: PackingCard[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards: ChatCards | null;
}

const LOAD_FAILED = "We couldn't load this conversation. Please try again.";
const SEND_FAILED = "The assistant could not answer. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asCount(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function toTripCard(value: unknown): TripSummaryCard | null {
  if (!isRecord(value)) return null;
  const title = asText(value.title);
  const destination = asText(value.destination);
  if (!title || !destination) return null;
  return {
    title,
    destination,
    dayCount: asCount(value.day_count, 1),
    travelerCount: asCount(value.traveler_count, 1),
    description: asText(value.description),
  };
}

function toBookingCard(value: unknown): BookingCard | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "hotel":
      return asText(value.name)
        ? {
            kind: "hotel",
            name: asText(value.name),
            checkIn: asText(value.check_in) || null,
            checkOut: asText(value.check_out) || null,
            line: asText(value.line) || null,
          }
        : null;
    case "car":
      return asText(value.company)
        ? {
            kind: "car",
            company: asText(value.company),
            pickupLocation: asText(value.pickup_location) || null,
            line: asText(value.line) || null,
          }
        : null;
    case "extra":
      return asText(value.title)
        ? { kind: "extra", title: asText(value.title), detail: asText(value.detail) || null }
        : null;
    case "flight":
      return asText(value.airline) && asText(value.flight_number)
        ? {
            kind: "flight",
            airline: asText(value.airline),
            flightNumber: asText(value.flight_number),
          }
        : null;
    default:
      return null;
  }
}

/** Reads cards back out of a `jsonb` column, keeping only the shapes the app draws. */
function toCards(value: unknown): ChatCards | null {
  if (!isRecord(value)) return null;

  const chips = asList(value.chips).map(asText).filter(Boolean);
  const places = asList(value.places)
    .filter(isRecord)
    .map((place) => ({
      name: asText(place.name),
      line: asText(place.line),
      city: asText(place.city),
    }))
    .filter((place) => place.name);
  const days = asList(value.days)
    .filter(isRecord)
    .map((day, index) => ({
      // A card saved before days were numbered counts from its place in the list.
      day: asCount(day.day, index + 1),
      title: asText(day.title),
      items: asList(day.items)
        .filter(isRecord)
        .map((item) => ({
          time: asText(item.time) || null,
          place: asText(item.place) || null,
          activity: asText(item.activity),
        }))
        .filter((item) => item.activity),
    }))
    .filter((day) => day.title && day.items.length > 0);

  const trip = toTripCard(value.trip);
  const bookings = asList(value.bookings)
    .map(toBookingCard)
    .filter((booking): booking is BookingCard => booking !== null);

  const packing = asList(value.packing)
    .filter(isRecord)
    .map((group) => ({
      category: asText(group.category),
      items: asList(group.items).map(asText).filter(Boolean),
    }))
    .filter((group) => group.category && group.items.length > 0);

  const isEmpty =
    chips.length + places.length + days.length + bookings.length + packing.length === 0 && !trip;
  if (isEmpty) return null;
  return { chips, places, days, trip, bookings, packing };
}

function toMessage(row: {
  id: string;
  role: string;
  content: string;
  cards: Json | unknown;
}): ChatMessage {
  return {
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    cards: toCards(row.cards),
  };
}

export interface ThreadResult {
  success: boolean;
  /** Null when there is no conversation yet. */
  threadId: string | null;
  messages: ChatMessage[];
  error: string | null;
}

/**
 * The newest conversation about a trip, or the newest one with no trip when
 * `tripId` is null. Row-level security limits it to the caller's own threads.
 */
export async function getLatestThread(tripId: string | null): Promise<ThreadResult> {
  try {
    const query = supabase.from("chat_threads").select("id");
    const { data: thread, error: threadError } = await (
      tripId ? query.eq("trip_id", tripId) : query.is("trip_id", null)
    )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (threadError) {
      return {
        success: false,
        threadId: null,
        messages: [],
        error: toReadableError("chat", threadError, LOAD_FAILED),
      };
    }
    if (!thread) return { success: true, threadId: null, messages: [], error: null };

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, cards")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });

    if (error) {
      return {
        success: false,
        threadId: null,
        messages: [],
        error: toReadableError("chat", error, LOAD_FAILED),
      };
    }
    return { success: true, threadId: thread.id, messages: data.map(toMessage), error: null };
  } catch (error) {
    return {
      success: false,
      threadId: null,
      messages: [],
      error: toReadableError("chat", error, LOAD_FAILED),
    };
  }
}

/** One saved conversation, as the history lists it. */
export interface ChatThreadSummary {
  id: string;
  /** How the conversation began: the traveller's first message. */
  title: string;
  /** The trip it is about, or null. */
  tripTitle: string | null;
  /** ISO timestamp of its newest message. */
  updatedAt: string;
}

export interface ThreadListResult {
  success: boolean;
  data: ChatThreadSummary[];
  error: string | null;
}

const HISTORY_FAILED = "We couldn't load your conversations. Please try again.";
const DELETE_FAILED = "We couldn't delete this conversation. Please try again.";
const MAX_THREADS = 50;

/** The traveller's conversations, newest first. Row-level security limits them to their own. */
export async function listThreads(): Promise<ThreadListResult> {
  try {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id, updated_at, trips(title), chat_messages(content, role)")
      .order("updated_at", { ascending: false })
      .order("created_at", { referencedTable: "chat_messages", ascending: true })
      .limit(1, { referencedTable: "chat_messages" })
      .limit(MAX_THREADS);

    if (error) {
      return { success: false, data: [], error: toReadableError("chat", error, HISTORY_FAILED) };
    }
    const threads = data
      // A thread whose first message never saved has nothing to open.
      .filter((thread) => thread.chat_messages.length > 0)
      .map((thread) => ({
        id: thread.id,
        title: thread.chat_messages[0].content,
        tripTitle: thread.trips?.title ?? null,
        updatedAt: thread.updated_at,
      }));
    return { success: true, data: threads, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("chat", error, HISTORY_FAILED) };
  }
}

export interface OpenThreadResult extends ThreadResult {
  /** The trip the conversation is about, or null. */
  tripId: string | null;
}

/** One conversation by its id, for opening it from the history. */
export async function getThread(threadId: string): Promise<OpenThreadResult> {
  const failed = (error: unknown): OpenThreadResult => ({
    success: false,
    threadId: null,
    tripId: null,
    messages: [],
    error: toReadableError("chat", error, LOAD_FAILED),
  });

  try {
    const { data, error } = await supabase
      .from("chat_threads")
      .select("id, trip_id, chat_messages(id, role, content, cards, created_at)")
      .eq("id", threadId)
      .order("created_at", { referencedTable: "chat_messages", ascending: true })
      .maybeSingle();

    if (error) return failed(error);
    if (!data) return failed("thread not found");

    return {
      success: true,
      threadId: data.id,
      tripId: data.trip_id,
      messages: data.chat_messages.map(toMessage),
      error: null,
    };
  } catch (error) {
    return failed(error);
  }
}

/** Deletes a conversation and, through the cascade, its messages. */
export async function deleteThread(
  threadId: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("chat_threads")
      .delete()
      .eq("id", threadId)
      .select("id");

    // No row back means row-level security refused the delete.
    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("chat", error ?? "no row deleted", DELETE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("chat", error, DELETE_FAILED) };
  }
}

export interface SendChatOptions {
  /** Empty when `regenerate` is set: the last question is answered again. */
  message: string;
  /** Replaces the newest reply in the thread instead of adding a message. */
  regenerate?: boolean;
  /** Null starts a new conversation. */
  threadId: string | null;
  /** Used only when a new conversation starts. */
  tripId: string | null;
  signal: AbortSignal;
  /** The conversation this message landed in. Called before any text. */
  onThread: (threadId: string) => void;
  /** A further piece of the reply. */
  onDelta: (text: string) => void;
}

export interface SendChatResult {
  success: boolean;
  /** The finished reply. */
  message: ChatMessage | null;
  error: string | null;
  /** True when the traveller stopped the reply themselves. */
  stopped?: boolean;
}

interface StreamOutcome {
  message: ChatMessage | null;
  error: string | null;
}

/** Reads the function's event stream until it ends. */
async function readEvents(
  body: ReadableStream<Uint8Array>,
  options: SendChatOptions,
): Promise<StreamOutcome> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const outcome: StreamOutcome = { message: null, error: null };
  let buffer = "";

  function handle(line: string) {
    if (!line.startsWith("data:")) return;
    let event: unknown;
    try {
      event = JSON.parse(line.slice(5).trim());
    } catch {
      return;
    }
    if (!isRecord(event)) return;

    if (event.type === "thread" && typeof event.thread_id === "string") {
      options.onThread(event.thread_id);
    } else if (event.type === "delta" && typeof event.text === "string") {
      options.onDelta(event.text);
    } else if (event.type === "done" && isRecord(event.message)) {
      outcome.message = toMessage({
        id: asText(event.message.id),
        role: "assistant",
        content: asText(event.message.content),
        cards: event.message.cards,
      });
    } else if (event.type === "error") {
      outcome.error = asText(event.message) || SEND_FAILED;
    }
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      handle(buffer.slice(0, newline).trim());
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
    }
  }
  handle(buffer.trim());

  return outcome;
}

/**
 * Sends one message to the assistant and streams the reply. The model is
 * called from the `chat` Edge Function, so its key never reaches the app; this
 * sends only the traveller's own session token.
 */
export async function sendChatMessage(options: SendChatOptions): Promise<SendChatResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return { success: false, message: null, error: "You are signed out. Sign in again." };
    }

    // `expo/fetch` rather than the global one: it is the fetch that can read a
    // response as it arrives on a phone.
    const response = await streamingFetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({
          message: options.message,
          regenerate: options.regenerate === true,
          thread_id: options.threadId,
          trip_id: options.tripId,
        }),
        signal: options.signal,
      },
    );

    if (!response.ok || !response.body) {
      // The function answers a refused request with one readable sentence.
      const failure: unknown = await response.json().catch(() => null);
      if (isRecord(failure) && typeof failure.thread_id === "string") {
        options.onThread(failure.thread_id);
      }
      const sentence = isRecord(failure) ? asText(failure.error) : "";
      // A refusal that came with its own sentence is already on screen.
      if (!sentence) console.error("[chat] request refused", response.status, failure);
      return { success: false, message: null, error: sentence || SEND_FAILED };
    }

    const outcome = await readEvents(response.body, options);
    if (outcome.message) return { success: true, message: outcome.message, error: null };
    return { success: false, message: null, error: outcome.error ?? SEND_FAILED };
  } catch (error) {
    if (options.signal.aborted) {
      return { success: false, message: null, error: null, stopped: true };
    }
    return { success: false, message: null, error: toReadableError("chat", error, SEND_FAILED) };
  }
}
