import { View } from "react-native";

import {
  MAX_DETAIL_LENGTH,
  type BookingErrors,
  type CarRentalFields,
  type ExtraFields,
  type FlightFields,
  type HotelFields,
} from "../lib/validation";
import { DateField } from "./DateField";
import { TextField } from "./TextField";
import { TimeField } from "./TimeField";

interface InputsProps<Fields> {
  fields: Fields;
  errors: BookingErrors;
  onChange: (fields: Fields) => void;
  disabled: boolean;
}

export function FlightInputs({ fields, errors, onChange, disabled }: InputsProps<FlightFields>) {
  return (
    <View>
      <TextField
        label="Airline"
        value={fields.airline}
        onChangeText={(airline) => onChange({ ...fields, airline })}
        error={errors.airline}
        placeholder="ANA"
        autoCapitalize="words"
        editable={!disabled}
      />
      <TextField
        label="Flight number"
        value={fields.flightNumber}
        onChangeText={(flightNumber) => onChange({ ...fields, flightNumber })}
        error={errors.flightNumber}
        placeholder="NH 848"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!disabled}
      />
      <DateField
        label="Date"
        value={fields.departsOn}
        onChange={(departsOn) => onChange({ ...fields, departsOn })}
        disabled={disabled}
      />
      <View className="flex-row gap-3">
        <TimeField
          label="Departs"
          value={fields.departsAt}
          onChange={(departsAt) => onChange({ ...fields, departsAt })}
          optional
          disabled={disabled}
        />
        <TimeField
          label="Arrives"
          value={fields.arrivesAt}
          onChange={(arrivesAt) => onChange({ ...fields, arrivesAt })}
          optional
          disabled={disabled}
        />
      </View>
    </View>
  );
}

export function CarRentalInputs({
  fields,
  errors,
  onChange,
  disabled,
}: InputsProps<CarRentalFields>) {
  return (
    <View>
      <TextField
        label="Company"
        value={fields.company}
        onChangeText={(company) => onChange({ ...fields, company })}
        error={errors.company}
        placeholder="Toyota Rent a Car"
        autoCapitalize="words"
        editable={!disabled}
      />
      <TextField
        label="Pickup location"
        value={fields.pickupLocation}
        onChangeText={(pickupLocation) => onChange({ ...fields, pickupLocation })}
        placeholder="Narita Airport"
        autoCapitalize="words"
        editable={!disabled}
      />
      <View className="flex-row gap-3">
        <DateField
          label="Pickup date"
          value={fields.pickupOn}
          onChange={(pickupOn) => onChange({ ...fields, pickupOn })}
          disabled={disabled}
        />
        <TimeField
          label="Pickup time"
          value={fields.pickupAt}
          onChange={(pickupAt) => onChange({ ...fields, pickupAt })}
          optional
          disabled={disabled}
        />
      </View>
    </View>
  );
}

export function HotelInputs({ fields, errors, onChange, disabled }: InputsProps<HotelFields>) {
  return (
    <View>
      <TextField
        label="Hotel"
        value={fields.name}
        onChangeText={(name) => onChange({ ...fields, name })}
        error={errors.name}
        placeholder="Hotel Gracery Shinjuku"
        autoCapitalize="words"
        editable={!disabled}
      />
      <View className="flex-row gap-3">
        <DateField
          label="Check-in"
          value={fields.checkIn}
          onChange={(checkIn) => onChange({ ...fields, checkIn })}
          disabled={disabled}
        />
        <DateField
          label="Check-out"
          value={fields.checkOut}
          onChange={(checkOut) => onChange({ ...fields, checkOut })}
          error={errors.checkOut}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

export function ExtraInputs({ fields, errors, onChange, disabled }: InputsProps<ExtraFields>) {
  return (
    <View>
      <TextField
        label="Title"
        value={fields.title}
        onChangeText={(title) => onChange({ ...fields, title })}
        error={errors.title}
        placeholder="JR Pass (7 days)"
        autoCapitalize="sentences"
        editable={!disabled}
      />
      <TextField
        label="Detail"
        hint={`${fields.detail.length}/${MAX_DETAIL_LENGTH}`}
        value={fields.detail}
        onChangeText={(detail) => onChange({ ...fields, detail })}
        error={errors.detail}
        placeholder="Order number, pickup point, seat"
        multiline
        maxLength={MAX_DETAIL_LENGTH}
        editable={!disabled}
      />
    </View>
  );
}
