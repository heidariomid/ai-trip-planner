// Trip dates are calendar days with no time zone, stored as `YYYY-MM-DD`.
// Everything here reads and writes them in the phone's local time, because
// `new Date("2026-10-07")` is parsed as UTC and lands on the day before for
// anyone west of Greenwich.

const MS_PER_DAY = 86_400_000;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export type TripStatus = "Upcoming" | "Ongoing" | "Past";

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(value: string, days: number): string {
  const date = fromISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Inclusive: a trip that starts and ends on the same date is one day. */
export function countDays(startDate: string, endDate: string): number {
  const start = fromISODate(startDate);
  const end = fromISODate(endDate);
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((utcEnd - utcStart) / MS_PER_DAY) + 1;
}

export function formatDate(value: string): string {
  const date = fromISODate(value);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = fromISODate(startDate);
  const end = fromISODate(endDate);
  const startText = `${MONTHS[start.getMonth()]} ${start.getDate()}`;

  if (start.getFullYear() !== end.getFullYear()) {
    return `${startText}, ${start.getFullYear()} – ${formatDate(endDate)}`;
  }
  return `${startText} – ${formatDate(endDate)}`;
}

export function formatMonth(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** ISO dates sort as text, so the comparison needs no parsing. */
export function getTripStatus(
  startDate: string,
  endDate: string,
  today: string = todayISO(),
): TripStatus {
  if (today < startDate) return "Upcoming";
  if (today > endDate) return "Past";
  return "Ongoing";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** "Tue, Oct 6": short enough for a chip. */
export function formatDayLabel(value: string): string {
  const date = fromISODate(value);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** Postgres returns a `time` as `HH:MM:SS`. The app keeps `HH:MM`. */
export function toTimeValue(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

export function buildTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

/** "09:30" becomes "9:30 AM". */
export function formatTime(value: string): string {
  const { hour, minute } = parseTime(value);
  const period = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${period}`;
}
