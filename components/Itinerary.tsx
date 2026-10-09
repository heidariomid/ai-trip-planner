import { View } from "react-native";

import type { Activity, ItineraryDay } from "../lib/trip-detail";
import type { ActivityFields } from "../lib/validation";
import { ActivityForm } from "./ActivityForm";
import { ActivityRow } from "./ActivityRow";
import { Button } from "./Button";
import { Text } from "./Text";

/** Which row is open as a form: an activity's id, "new", or nothing. */
export type EditingTarget = string | "new" | null;

export interface ItineraryItemProps {
  activity: Activity;
  day: ItineraryDay;
  destination: string;
  isLast: boolean;
  isEditing: boolean;
  /** False for a viewer: the row is read-only and has no tick. */
  canEdit: boolean;
  onEdit: (target: EditingTarget) => void;
  onSave: (
    day: ItineraryDay,
    fields: ActivityFields,
    existing: Activity | null,
  ) => Promise<string | null>;
  onDelete: (activity: Activity) => Promise<string | null>;
  onToggleDone: (activity: Activity) => void;
}

/** One activity: a timeline row, or the inline form while it is being edited. */
export function ItineraryItem({
  activity,
  day,
  destination,
  isLast,
  isEditing,
  canEdit,
  onEdit,
  onSave,
  onDelete,
  onToggleDone,
}: ItineraryItemProps) {
  if (!canEdit) {
    return <ActivityRow activity={activity} destination={destination} isLast={isLast} />;
  }
  if (!isEditing) {
    return (
      <ActivityRow
        activity={activity}
        destination={destination}
        isLast={isLast}
        onPress={() => onEdit(activity.id)}
        onToggleDone={() => onToggleDone(activity)}
      />
    );
  }

  return (
    <View className="mb-6">
      <ActivityForm
        activity={activity}
        onSave={(fields) => onSave(day, fields, activity)}
        onDelete={() => onDelete(activity)}
        onClose={() => onEdit(null)}
      />
    </View>
  );
}

export interface ItineraryFooterProps {
  day: ItineraryDay;
  isAdding: boolean;
  canEdit: boolean;
  onEdit: (target: EditingTarget) => void;
  onSave: ItineraryItemProps["onSave"];
}

/** Below the timeline: the empty sentence, then the add button or the add form. */
export function ItineraryFooter({
  day,
  isAdding,
  canEdit,
  onEdit,
  onSave,
}: ItineraryFooterProps) {
  return (
    <View>
      {day.activities.length === 0 && !isAdding ? (
        <Text className="mb-5 text-center text-[14px] leading-5 text-subtle">
          Nothing is planned for this day yet.
        </Text>
      ) : null}

      {!canEdit ? null : isAdding ? (
        <ActivityForm
          activity={null}
          onSave={(fields) => onSave(day, fields, null)}
          onClose={() => onEdit(null)}
        />
      ) : (
        <Button label="Add activity" variant="secondary" onPress={() => onEdit("new")} />
      )}
    </View>
  );
}
