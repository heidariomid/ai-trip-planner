import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";

import type { Booking } from "../lib/bookings";
import { toTimeValue } from "../lib/dates";
import {
  validateBooking,
  type BookingDraft,
  type BookingErrors,
  type BookingKind,
} from "../lib/validation";
import { CarRentalInputs, ExtraInputs, FlightInputs, HotelInputs } from "./BookingFields";
import { Button } from "./Button";
import { Card } from "./Card";
import { FormMessage } from "./FormMessage";
import { Text } from "./Text";

export interface BookingFormProps {
  kind: BookingKind;
  /** The booking being edited, or null for a new one. */
  booking: Booking | null;
  /** The trip's dates, which a new booking starts from. */
  tripStart: string;
  tripEnd: string;
  /** Each resolves to a sentence on failure, or null when it worked. */
  onSave: (draft: BookingDraft) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}

function initialDraft(
  kind: BookingKind,
  booking: Booking | null,
  tripStart: string,
  tripEnd: string,
): BookingDraft {
  switch (kind) {
    case "flight": {
      const flight = booking?.kind === "flight" ? booking : null;
      return {
        kind,
        fields: {
          airline: flight?.airline ?? "",
          flightNumber: flight?.flight_number ?? "",
          departsOn: flight?.departs_on ?? tripStart,
          departsAt: toTimeValue(flight?.departs_at ?? null),
          arrivesAt: toTimeValue(flight?.arrives_at ?? null),
        },
      };
    }
    case "car": {
      const car = booking?.kind === "car" ? booking : null;
      return {
        kind,
        fields: {
          company: car?.company ?? "",
          pickupLocation: car?.pickup_location ?? "",
          pickupOn: car?.pickup_on ?? tripStart,
          pickupAt: toTimeValue(car?.pickup_at ?? null),
        },
      };
    }
    case "hotel": {
      const hotel = booking?.kind === "hotel" ? booking : null;
      return {
        kind,
        fields: {
          name: hotel?.name ?? "",
          checkIn: hotel?.check_in ?? tripStart,
          checkOut: hotel?.check_out ?? tripEnd,
        },
      };
    }
    case "extra": {
      const extra = booking?.kind === "extra" ? booking : null;
      return { kind, fields: { title: extra?.title ?? "", detail: extra?.detail ?? "" } };
    }
  }
}

interface InputsProps {
  draft: BookingDraft;
  errors: BookingErrors;
  onChange: (draft: BookingDraft) => void;
  disabled: boolean;
}

function Inputs({ draft, errors, onChange, disabled }: InputsProps) {
  const shared = { errors, disabled };

  switch (draft.kind) {
    case "flight":
      return (
        <FlightInputs
          {...shared}
          fields={draft.fields}
          onChange={(fields) => onChange({ kind: "flight", fields })}
        />
      );
    case "car":
      return (
        <CarRentalInputs
          {...shared}
          fields={draft.fields}
          onChange={(fields) => onChange({ kind: "car", fields })}
        />
      );
    case "hotel":
      return (
        <HotelInputs
          {...shared}
          fields={draft.fields}
          onChange={(fields) => onChange({ kind: "hotel", fields })}
        />
      );
    case "extra":
      return (
        <ExtraInputs
          {...shared}
          fields={draft.fields}
          onChange={(fields) => onChange({ kind: "extra", fields })}
        />
      );
  }
}

/** The inline row for adding or editing one booking. A failure stays on it. */
export function BookingForm({
  kind,
  booking,
  tripStart,
  tripEnd,
  onSave,
  onDelete,
  onClose,
}: BookingFormProps) {
  const [draft, setDraft] = useState<BookingDraft>(() =>
    initialDraft(kind, booking, tripStart, tripEnd),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const allErrors = validateBooking(draft);
  // The date order is checked as soon as a date changes.
  const errors: BookingErrors = hasSubmitted ? allErrors : { checkOut: allErrors.checkOut };
  const isBusy = pending !== null;

  async function run(action: "save" | "delete", work: () => Promise<string | null>) {
    Keyboard.dismiss();
    setFormError(null);
    setPending(action);
    const error = await work();
    setPending(null);
    if (error) setFormError(error);
    else onClose();
  }

  function handleSave() {
    setHasSubmitted(true);
    if (Object.keys(allErrors).length > 0) return;
    void run("save", () => onSave(draft));
  }

  return (
    <Card>
      <Inputs draft={draft} errors={errors} onChange={setDraft} disabled={isBusy} />

      <FormMessage message={formError} />

      <View className="flex-row items-center justify-between">
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void run("delete", onDelete)}
            className="h-11 justify-center pr-3"
          >
            <Text className="ml-1 text-[14px] font-medium text-red-600">
              {pending === "delete" ? "Deleting…" : "Delete"}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        <View className="flex-row gap-3">
          <Button label="Cancel" variant="secondary" onPress={onClose} disabled={isBusy} />
          <Button
            label="Save"
            onPress={handleSave}
            loading={pending === "save"}
            disabled={isBusy}
          />
        </View>
      </View>
    </Card>
  );
}
