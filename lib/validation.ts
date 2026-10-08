const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 6;

export interface SignUpFields {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFields {
  email: string;
  password: string;
}

/**
 * Client validation is UX only — it keeps obvious mistakes off the network.
 * The database and Supabase Auth remain the real boundary.
 */
export function validateSignIn(fields: SignInFields): Partial<Record<keyof SignInFields, string>> {
  const errors: Partial<Record<keyof SignInFields, string>> = {};

  if (!fields.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "That doesn't look like an email address.";

  if (!fields.password) errors.password = "Enter your password.";

  return errors;
}

export function validateSignUp(fields: SignUpFields): Partial<Record<keyof SignUpFields, string>> {
  const errors: Partial<Record<keyof SignUpFields, string>> = {};

  if (!fields.fullName.trim()) errors.fullName = "Enter your name.";

  if (!fields.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "That doesn't look like an email address.";

  if (!fields.password) errors.password = "Choose a password.";
  else if (fields.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Both passwords need to match.";
  }

  return errors;
}

export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_TRAVELERS = 20;

export interface TripFields {
  title: string;
  source: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
}

export function validateTrip(fields: TripFields): Partial<Record<keyof TripFields, string>> {
  const errors: Partial<Record<keyof TripFields, string>> = {};

  if (!fields.title.trim()) errors.title = "Give your trip a title.";
  if (!fields.source.trim()) errors.source = "Enter where you are leaving from.";
  if (!fields.destination.trim()) errors.destination = "Enter where you are going.";

  if (!fields.startDate) errors.startDate = "Choose a start date.";
  if (!fields.endDate) errors.endDate = "Choose an end date.";
  else if (fields.startDate && fields.endDate < fields.startDate) {
    errors.endDate = "The end date can't be before the start date.";
  }

  if (fields.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  return errors;
}

export interface CopyPlanFields {
  source: string;
  startDate: string;
}

export function validateCopyPlan(
  fields: CopyPlanFields,
): Partial<Record<keyof CopyPlanFields, string>> {
  const errors: Partial<Record<keyof CopyPlanFields, string>> = {};

  if (!fields.source.trim()) errors.source = "Enter where you are leaving from.";
  if (!fields.startDate) errors.startDate = "Choose a start date.";

  return errors;
}

export const MAX_NOTE_LENGTH = 200;

export interface ActivityFields {
  /** `HH:MM`, or null when not chosen. */
  startsAt: string | null;
  endsAt: string | null;
  place: string;
  activity: string;
  notes: string;
}

export function validateActivity(
  fields: ActivityFields,
): Partial<Record<keyof ActivityFields, string>> {
  const errors: Partial<Record<keyof ActivityFields, string>> = {};

  if (!fields.startsAt) errors.startsAt = "Choose a start time.";
  else if (fields.endsAt && fields.endsAt < fields.startsAt) {
    errors.endsAt = "The end time can't be before the start time.";
  }

  if (!fields.activity.trim()) errors.activity = "Say what you will do.";

  if (fields.notes.length > MAX_NOTE_LENGTH) {
    errors.notes = `Keep the note under ${MAX_NOTE_LENGTH} characters.`;
  }

  return errors;
}

export const MAX_PACKING_CATEGORY_LENGTH = 40;
export const MAX_PACKING_LABEL_LENGTH = 80;

export interface PackingFields {
  category: string;
  label: string;
}

export function validatePackingItem(
  fields: PackingFields,
): Partial<Record<keyof PackingFields, string>> {
  const errors: Partial<Record<keyof PackingFields, string>> = {};

  if (!fields.label.trim()) errors.label = "Say what to pack.";
  if (!fields.category.trim()) errors.category = "Name a category, such as Clothes.";

  return errors;
}

export const MAX_DETAIL_LENGTH = 200;

export interface FlightFields {
  airline: string;
  flightNumber: string;
  /** `YYYY-MM-DD`. */
  departsOn: string;
  /** `HH:MM`, or null when not chosen. */
  departsAt: string | null;
  arrivesAt: string | null;
}

export interface CarRentalFields {
  company: string;
  pickupLocation: string;
  pickupOn: string;
  pickupAt: string | null;
}

export interface HotelFields {
  name: string;
  checkIn: string;
  checkOut: string;
}

export interface ExtraFields {
  title: string;
  detail: string;
}

/** What a booking form holds, tagged with the kind of booking it is for. */
export type BookingDraft =
  | { kind: "flight"; fields: FlightFields }
  | { kind: "car"; fields: CarRentalFields }
  | { kind: "hotel"; fields: HotelFields }
  | { kind: "extra"; fields: ExtraFields };

export type BookingKind = BookingDraft["kind"];

/** Keyed by the name of the field the message belongs under. */
export type BookingErrors = Partial<Record<string, string>>;

export function validateBooking(draft: BookingDraft): BookingErrors {
  const errors: BookingErrors = {};

  switch (draft.kind) {
    case "flight":
      if (!draft.fields.airline.trim()) errors.airline = "Enter the airline.";
      if (!draft.fields.flightNumber.trim()) errors.flightNumber = "Enter the flight number.";
      break;
    case "car":
      if (!draft.fields.company.trim()) errors.company = "Enter the rental company.";
      break;
    case "hotel":
      if (!draft.fields.name.trim()) errors.name = "Enter the hotel's name.";
      if (draft.fields.checkOut < draft.fields.checkIn) {
        errors.checkOut = "Check-out can't be before check-in.";
      }
      break;
    case "extra":
      if (!draft.fields.title.trim()) errors.title = "Give it a title.";
      if (draft.fields.detail.length > MAX_DETAIL_LENGTH) {
        errors.detail = `Keep the detail under ${MAX_DETAIL_LENGTH} characters.`;
      }
      break;
  }

  return errors;
}
