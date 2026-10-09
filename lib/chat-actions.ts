import { addActivities } from "./itinerary";
import { saveBooking } from "./bookings";
import type { BookingCard, DayCard, TripSummaryCard } from "./chat";
import { addDays, formatDate } from "./dates";
import { toReadableError } from "./errors";
import { findDestinationPicture } from "./places";
import { supabase } from "./supabase";
import { createTrip, type CreateTripResult, type TripStatusValue } from "./trips";
import { MAX_DESCRIPTION_LENGTH, MAX_TRAVELERS, type BookingDraft } from "./validation";

// Everything the chat can save. The model only proposes cards; each function
// here runs after the traveller tapped a button, with their own session.

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A time the database will accept, or none. */
function toTime(value: string | null): string | null {
  return value && TIME.test(value) ? value : null;
}

/** A whole trip as one reply proposed it: the summary and its day cards. */
export interface ChatPlan {
  trip: TripSummaryCard;
  days: DayCard[];
}

export interface PendingPlan {
  plan: ChatPlan;
  status: TripStatusValue;
}

// Held here while the create-trip screen is open. A plan is too large and too
// nested for a route parameter, and it is only needed for that one hop.
let pendingPlan: PendingPlan | null = null;

export function setPendingPlan(pending: PendingPlan): void {
  pendingPlan = pending;
}

export function getPendingPlan(): PendingPlan | null {
  return pendingPlan;
}

/**
 * How many days the new trip gets: the summary's count, or the highest day a
 * card names when that is more, so no activity points past the end.
 */
export function getPlanLength(plan: ChatPlan): number {
  return plan.days.reduce((longest, day) => Math.max(longest, day.day), plan.trip.dayCount);
}

export function getPlanEndDate(startDate: string, plan: ChatPlan): string {
  return addDays(startDate, getPlanLength(plan) - 1);
}

/**
 * Creates the trip, its days, and every day card's activities in one call,
 * then gives it a photo of the destination as its cover, so a trip made in the
 * chat does not arrive with the grey placeholder. With no photo to be found,
 * or when the upload fails, the trip is still created.
 */
export async function createTripFromPlan(
  userId: string,
  plan: ChatPlan,
  source: string,
  startDate: string,
  status: TripStatusValue,
): Promise<CreateTripResult> {
  const cover = await findDestinationPicture(plan.trip.destination);

  return createTrip(userId, {
    title: plan.trip.title,
    source,
    destination: plan.trip.destination,
    startDate,
    endDate: getPlanEndDate(startDate, plan),
    description: plan.trip.description.slice(0, MAX_DESCRIPTION_LENGTH),
    travelerCount: Math.min(MAX_TRAVELERS, Math.max(1, plan.trip.travelerCount)),
    cover,
    status,
    activities: plan.days.flatMap((day) =>
      day.items.map((item) => ({
        day_number: day.day,
        starts_at: toTime(item.time),
        ends_at: null,
        place: item.place,
        activity: item.activity,
        notes: null,
      })),
    ),
  });
}

/** A day that already exists on a trip, as a day card can be saved onto it. */
export interface TripDayOption {
  id: string;
  dayNumber: number;
  /** `YYYY-MM-DD`. */
  date: string | null;
  /** The sort order the next activity on this day takes. */
  nextSortOrder: number;
  /** How many activities the day already has. */
  activityCount: number;
}

/** Put a card's stops after what a day has, or in place of it. */
export type DaySaveMode = "add" | "replace";

export interface TripDaysResult {
  success: boolean;
  data: TripDayOption[];
  error: string | null;
}

const DAYS_FAILED = "We couldn't load this trip's days. Please try again.";

/** The days a trip has. The chat picks from these and never adds one. */
export async function listTripDays(tripId: string): Promise<TripDaysResult> {
  try {
    const { data, error } = await supabase
      .from("itinerary_days")
      .select("id, day_number, date, itinerary_activities(sort_order)")
      .eq("trip_id", tripId)
      .order("day_number", { ascending: true });

    if (error) {
      return { success: false, data: [], error: toReadableError("chat", error, DAYS_FAILED) };
    }
    const days = data.map((day) => ({
      id: day.id,
      dayNumber: day.day_number,
      date: day.date,
      activityCount: day.itinerary_activities.length,
      nextSortOrder: day.itinerary_activities.reduce(
        (highest, item) => Math.max(highest, item.sort_order + 1),
        0,
      ),
    }));
    return { success: true, data: days, error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("chat", error, DAYS_FAILED) };
  }
}

/** Saves a day card's activities onto a day the trip already has. */
export function addDayCardToDay(day: TripDayOption, card: DayCard) {
  return addActivities(
    day.id,
    day.nextSortOrder,
    card.items.map((item) => ({
      startsAt: toTime(item.time),
      place: item.place,
      activity: item.activity,
    })),
  );
}

const REPLACE_FAILED = "We couldn't replace this day's activities. Nothing was changed.";

/**
 * Puts a day card's activities in place of everything the day has. One
 * database call, so the day is never left empty between the two halves.
 */
export async function replaceDayWithCard(
  day: TripDayOption,
  card: DayCard,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.rpc("replace_day_activities", {
      p_day_id: day.id,
      p_activities: card.items.map((item) => ({
        starts_at: toTime(item.time),
        place: item.place,
        activity: item.activity,
      })),
    });
    if (error) {
      return { success: false, error: toReadableError("chat", error, REPLACE_FAILED) };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("chat", error, REPLACE_FAILED) };
  }
}

/** The dates a booking falls back on when the card gave none. */
export interface BookingTrip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function toBookingDraft(card: BookingCard, trip: BookingTrip): BookingDraft {
  switch (card.kind) {
    case "hotel": {
      const hasDates =
        card.checkIn !== null &&
        card.checkOut !== null &&
        DATE.test(card.checkIn) &&
        DATE.test(card.checkOut) &&
        card.checkOut >= card.checkIn;
      return {
        kind: "hotel",
        fields: {
          name: card.name,
          checkIn: hasDates && card.checkIn ? card.checkIn : trip.start_date,
          checkOut: hasDates && card.checkOut ? card.checkOut : trip.end_date,
        },
      };
    }
    case "car":
      return {
        kind: "car",
        fields: {
          company: card.company,
          pickupLocation: card.pickupLocation ?? "",
          pickupOn: trip.start_date,
          pickupAt: null,
        },
      };
    case "extra":
      return { kind: "extra", fields: { title: card.title, detail: card.detail ?? "" } };
    case "flight":
      return {
        kind: "flight",
        fields: {
          airline: card.airline,
          flightNumber: card.flightNumber,
          departsOn: trip.start_date,
          departsAt: null,
          arrivesAt: null,
        },
      };
  }
}

/** What a booking card is called on screen. */
export function getBookingTitle(card: BookingCard): string {
  switch (card.kind) {
    case "hotel":
      return card.name;
    case "car":
      return card.company;
    case "extra":
      return card.title;
    case "flight":
      return `${card.airline} ${card.flightNumber}`;
  }
}

const KIND_LABELS = {
  hotel: "Hotel",
  car: "Car rental",
  extra: "Extra",
  flight: "Flight",
} as const satisfies Record<BookingCard["kind"], string>;

export function getBookingKindLabel(card: BookingCard): string {
  return KIND_LABELS[card.kind];
}

/** Says exactly what accepting the card writes, for the dialog that asks first. */
export function describeBooking(card: BookingCard, trip: BookingTrip): string {
  const draft = toBookingDraft(card, trip);
  const title = getBookingTitle(card);

  switch (draft.kind) {
    case "hotel":
      return `This adds ${title} as a hotel on ${trip.title}, from ${formatDate(
        draft.fields.checkIn,
      )} to ${formatDate(draft.fields.checkOut)}. You can change it on the trip.`;
    case "car":
      return `This adds a car rental with ${title} to ${trip.title}, picked up on ${formatDate(
        draft.fields.pickupOn,
      )}. You can change it on the trip.`;
    case "flight":
      return `This adds the flight ${title} to ${trip.title}, on ${formatDate(
        draft.fields.departsOn,
      )}. You can change it on the trip.`;
    case "extra":
      return `This adds "${title}" to the extras of ${trip.title}. You can change it on the trip.`;
  }
}

/** Adds one booking through the same call the trip screen uses. Never edits one. */
export function addBookingCard(card: BookingCard, trip: BookingTrip) {
  return saveBooking(trip.id, toBookingDraft(card, trip), null);
}
