import type { Tables } from "../types/database.types";
import { toReadableError } from "./errors";
import { supabase } from "./supabase";
import type { BookingDraft, BookingKind } from "./validation";

export type Flight = Pick<
  Tables<"booking_flights">,
  | "id"
  | "airline"
  | "flight_number"
  | "route"
  | "seat"
  | "departs_on"
  | "departs_at"
  | "arrives_at"
  | "confirmation_code"
  | "notes"
  | "created_at"
> & { kind: "flight" };

export type CarRental = Pick<
  Tables<"booking_car_rentals">,
  | "id"
  | "company"
  | "vehicle"
  | "pickup_location"
  | "dropoff_location"
  | "pickup_on"
  | "pickup_at"
  | "dropoff_on"
  | "dropoff_at"
  | "confirmation_code"
  | "notes"
  | "created_at"
> & { kind: "car" };

export type Hotel = Pick<
  Tables<"booking_hotels">,
  "id" | "name" | "check_in" | "check_out" | "created_at"
> & { kind: "hotel" };

export type Extra = Pick<Tables<"booking_extras">, "id" | "title" | "detail" | "created_at"> & {
  kind: "extra";
};

export type Booking = Flight | CarRental | Hotel | Extra;

export interface BookingListResult {
  success: boolean;
  data: Booking[];
  error: string | null;
}

export interface BookingResult {
  success: boolean;
  data: Booking | null;
  error: string | null;
}

export interface BookingDeleteResult {
  success: boolean;
  error: string | null;
}

const LOAD_FAILED = "We couldn't load this trip's bookings. Please try again.";
const SAVE_FAILED = "We couldn't save this booking. Please try again.";
const DELETE_FAILED = "We couldn't delete this booking. Please try again.";

const FLIGHT_COLUMNS =
  "id, airline, flight_number, route, seat, departs_on, departs_at, arrives_at, confirmation_code, notes, created_at";
const CAR_COLUMNS =
  "id, company, vehicle, pickup_location, dropoff_location, pickup_on, pickup_at, dropoff_on, dropoff_at, confirmation_code, notes, created_at";
const HOTEL_COLUMNS = "id, name, check_in, check_out, created_at";
const EXTRA_COLUMNS = "id, title, detail, created_at";

const TABLES = {
  flight: "booking_flights",
  car: "booking_car_rentals",
  hotel: "booking_hotels",
  extra: "booking_extras",
} as const satisfies Record<BookingKind, string>;

type DraftOf<K extends BookingKind> = Extract<BookingDraft, { kind: K }>;

/** What a kind is ordered by: when it happens, or when it was added. */
function sortKey(booking: Booking): string {
  switch (booking.kind) {
    case "flight":
      return `${booking.departs_on ?? "9999"} ${booking.departs_at ?? "99"}`;
    case "car":
      return `${booking.pickup_on ?? "9999"} ${booking.pickup_at ?? "99"}`;
    case "hotel":
      return booking.check_in;
    case "extra":
      return "";
  }
}

export function sortBookings(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    const byWhen = sortKey(a).localeCompare(sortKey(b));
    return byWhen !== 0 ? byWhen : a.created_at.localeCompare(b.created_at);
  });
}

/** Every booking of a trip, all four kinds in one list. */
export async function listBookings(tripId: string): Promise<BookingListResult> {
  try {
    const [flights, cars, hotels, extras] = await Promise.all([
      supabase.from("booking_flights").select(FLIGHT_COLUMNS).eq("trip_id", tripId),
      supabase.from("booking_car_rentals").select(CAR_COLUMNS).eq("trip_id", tripId),
      supabase.from("booking_hotels").select(HOTEL_COLUMNS).eq("trip_id", tripId),
      supabase.from("booking_extras").select(EXTRA_COLUMNS).eq("trip_id", tripId),
    ]);

    const error = flights.error ?? cars.error ?? hotels.error ?? extras.error;
    if (error) {
      return { success: false, data: [], error: toReadableError("bookings", error, LOAD_FAILED) };
    }

    const data: Booking[] = [
      ...(flights.data ?? []).map((row): Flight => ({ ...row, kind: "flight" })),
      ...(cars.data ?? []).map((row): CarRental => ({ ...row, kind: "car" })),
      ...(hotels.data ?? []).map((row): Hotel => ({ ...row, kind: "hotel" })),
      ...(extras.data ?? []).map((row): Extra => ({ ...row, kind: "extra" })),
    ];
    return { success: true, data: sortBookings(data), error: null };
  } catch (error) {
    return { success: false, data: [], error: toReadableError("bookings", error, LOAD_FAILED) };
  }
}

async function writeFlight(tripId: string, draft: DraftOf<"flight">, id: string | null) {
  const values = {
    airline: draft.fields.airline.trim(),
    flight_number: draft.fields.flightNumber.trim(),
    departs_on: draft.fields.departsOn,
    departs_at: draft.fields.departsAt,
    arrives_at: draft.fields.arrivesAt,
    route: draft.fields.route.trim() || null,
    seat: draft.fields.seat.trim() || null,
    confirmation_code: draft.fields.confirmationCode.trim() || null,
    notes: draft.fields.notes.trim() || null,
  };
  const table = supabase.from("booking_flights");
  const { data, error } = id
    ? await table.update(values).eq("id", id).select(FLIGHT_COLUMNS).single()
    : await table.insert({ trip_id: tripId, ...values }).select(FLIGHT_COLUMNS).single();
  return { data: data ? ({ ...data, kind: "flight" } satisfies Flight) : null, error };
}

async function writeCar(tripId: string, draft: DraftOf<"car">, id: string | null) {
  const values = {
    company: draft.fields.company.trim(),
    pickup_location: draft.fields.pickupLocation.trim() || null,
    pickup_on: draft.fields.pickupOn,
    pickup_at: draft.fields.pickupAt,
    vehicle: draft.fields.vehicle.trim() || null,
    dropoff_location: draft.fields.dropoffLocation.trim() || null,
    dropoff_on: draft.fields.dropoffOn,
    dropoff_at: draft.fields.dropoffAt,
    confirmation_code: draft.fields.confirmationCode.trim() || null,
    notes: draft.fields.notes.trim() || null,
  };
  const table = supabase.from("booking_car_rentals");
  const { data, error } = id
    ? await table.update(values).eq("id", id).select(CAR_COLUMNS).single()
    : await table.insert({ trip_id: tripId, ...values }).select(CAR_COLUMNS).single();
  return { data: data ? ({ ...data, kind: "car" } satisfies CarRental) : null, error };
}

async function writeHotel(tripId: string, draft: DraftOf<"hotel">, id: string | null) {
  const values = {
    name: draft.fields.name.trim(),
    check_in: draft.fields.checkIn,
    check_out: draft.fields.checkOut,
  };
  const table = supabase.from("booking_hotels");
  const { data, error } = id
    ? await table.update(values).eq("id", id).select(HOTEL_COLUMNS).single()
    : await table.insert({ trip_id: tripId, ...values }).select(HOTEL_COLUMNS).single();
  return { data: data ? ({ ...data, kind: "hotel" } satisfies Hotel) : null, error };
}

async function writeExtra(tripId: string, draft: DraftOf<"extra">, id: string | null) {
  const values = {
    title: draft.fields.title.trim(),
    detail: draft.fields.detail.trim() || null,
  };
  const table = supabase.from("booking_extras");
  const { data, error } = id
    ? await table.update(values).eq("id", id).select(EXTRA_COLUMNS).single()
    : await table.insert({ trip_id: tripId, ...values }).select(EXTRA_COLUMNS).single();
  return { data: data ? ({ ...data, kind: "extra" } satisfies Extra) : null, error };
}

function write(tripId: string, draft: BookingDraft, id: string | null) {
  switch (draft.kind) {
    case "flight":
      return writeFlight(tripId, draft, id);
    case "car":
      return writeCar(tripId, draft, id);
    case "hotel":
      return writeHotel(tripId, draft, id);
    case "extra":
      return writeExtra(tripId, draft, id);
  }
}

/** Adds a booking, or saves over the one with `id`. */
export async function saveBooking(
  tripId: string,
  draft: BookingDraft,
  id: string | null,
): Promise<BookingResult> {
  try {
    const { data, error } = await write(tripId, draft, id);
    if (error || !data) {
      return {
        success: false,
        data: null,
        error: toReadableError("bookings", error ?? "no row saved", SAVE_FAILED),
      };
    }
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: toReadableError("bookings", error, SAVE_FAILED) };
  }
}

export async function deleteBooking(booking: Booking): Promise<BookingDeleteResult> {
  try {
    const { data, error } = await supabase
      .from(TABLES[booking.kind])
      .delete()
      .eq("id", booking.id)
      .select("id");

    if (error || data.length === 0) {
      return {
        success: false,
        error: toReadableError("bookings", error ?? "no row deleted", DELETE_FAILED),
      };
    }
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: toReadableError("bookings", error, DELETE_FAILED) };
  }
}
