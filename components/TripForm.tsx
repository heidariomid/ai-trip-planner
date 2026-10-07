import { View, type ImageSourcePropType } from "react-native";

import type { UseTripFormResult } from "../hooks/useTripForm";
import { countDays, pluralize } from "../lib/dates";
import { MAX_DESCRIPTION_LENGTH, MAX_TRAVELERS } from "../lib/validation";
import { Button } from "./Button";
import { CoverPicker } from "./CoverPicker";
import { DateField } from "./DateField";
import { FormMessage } from "./FormMessage";
import { Stepper } from "./Stepper";
import { Text } from "./Text";
import { TextField } from "./TextField";

export interface TripFormProps {
  form: UseTripFormResult;
  /** The cover the trip already has, when editing one that has a cover. */
  existingCover?: ImageSourcePropType;
  saveLabel?: string;
  onSave: () => void;
  onDone: () => void;
}

function describeTravelers(count: number): string {
  return count === 1 ? "Just me" : pluralize(count, "traveler");
}

export function TripForm({
  form,
  existingCover,
  saveLabel = "Save trip",
  onSave,
  onDone,
}: TripFormProps) {
  const { values, setValue, errors, formError, savedNotice, isSaving } = form;
  const isLocked = isSaving || savedNotice !== null;
  const hasValidDates = values.endDate >= values.startDate;
  const dayCount = hasValidDates ? countDays(values.startDate, values.endDate) : 0;

  return (
    <View>
      <TextField
        label="Trip title"
        value={values.title}
        onChangeText={(text) => setValue("title", text)}
        error={errors.title}
        placeholder="Japan adventure"
        autoCapitalize="sentences"
        returnKeyType="next"
        editable={!isLocked}
      />
      <TextField
        label="From"
        value={values.source}
        onChangeText={(text) => setValue("source", text)}
        error={errors.source}
        placeholder="Vancouver, Canada"
        autoCapitalize="words"
        returnKeyType="next"
        editable={!isLocked}
      />
      <TextField
        label="To"
        value={values.destination}
        onChangeText={(text) => setValue("destination", text)}
        error={errors.destination}
        placeholder="Tokyo, Japan"
        autoCapitalize="words"
        returnKeyType="done"
        editable={!isLocked}
      />

      <View className="flex-row gap-3">
        <DateField
          label="Start date"
          value={values.startDate}
          onChange={(date) => setValue("startDate", date)}
          error={errors.startDate}
          disabled={isLocked}
        />
        <DateField
          label="End date"
          value={values.endDate}
          onChange={(date) => setValue("endDate", date)}
          error={errors.endDate}
          disabled={isLocked}
        />
      </View>
      {hasValidDates ? (
        <Text className="mb-3.5 ml-1 text-[14px] font-medium text-ink">
          {pluralize(dayCount, "day")}, {pluralize(dayCount - 1, "night")}
        </Text>
      ) : null}

      <CoverPicker
        previewUri={values.cover?.uri ?? null}
        existing={existingCover}
        onPick={() => void form.pickCover()}
        onRemove={() => setValue("cover", null)}
        disabled={isLocked}
      />

      <TextField
        label="Description"
        hint={`${values.description.length}/${MAX_DESCRIPTION_LENGTH}`}
        value={values.description}
        onChangeText={(text) => setValue("description", text)}
        error={errors.description}
        placeholder="Write a short description"
        multiline
        maxLength={MAX_DESCRIPTION_LENGTH}
        editable={!isLocked}
      />

      <Stepper
        label="Travelers"
        value={values.travelerCount}
        min={1}
        max={MAX_TRAVELERS}
        onChange={(count) => setValue("travelerCount", count)}
        describe={describeTravelers}
        disabled={isLocked}
      />

      {/* Beside Save, not at the top: the top of the form is off screen by now. */}
      <View className="mt-3">
        <FormMessage message={formError} />
        <FormMessage message={savedNotice} tone="info" />
        {savedNotice ? (
          <Button label="Done" onPress={onDone} />
        ) : (
          <Button label={saveLabel} onPress={onSave} loading={isSaving} />
        )}
      </View>
    </View>
  );
}
