import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../../../components/Button";
import { Chip } from "../../../../components/Chip";
import { ConfirmDialog } from "../../../../components/ConfirmDialog";
import { DayChips } from "../../../../components/DayChips";
import { EmptyState } from "../../../../components/EmptyState";
import { FormMessage } from "../../../../components/FormMessage";
import {
  ItineraryFooter,
  ItineraryItem,
  type EditingTarget,
} from "../../../../components/Itinerary";
import { TripBanner } from "../../../../components/TripBanner";
import { TripMenu } from "../../../../components/TripMenu";
import { useTripDetail } from "../../../../hooks/useTripDetail";
import { todayISO } from "../../../../lib/dates";
import { colors } from "../../../../lib/theme";
import type { ItineraryDay } from "../../../../lib/trip-detail";

const SECTIONS = ["Itinerary", "Bookings", "Packing", "Photos", "Notes"] as const;
type Section = (typeof SECTIONS)[number];

const CONTENT_STYLE = {
  width: "100%",
  maxWidth: 420,
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingTop: 12,
  paddingBottom: 40,
} as const;

/** Today's day while the trip is on, otherwise the first one. */
function defaultDay(days: ItineraryDay[]): ItineraryDay | null {
  const today = todayISO();
  return days.find((day) => day.date === today) ?? days[0] ?? null;
}

export default function TripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, isLoading, isMissing, error, saveActivity, removeActivity, removeTrip } =
    useTripDetail(id);

  const [section, setSection] = useState<Section>("Itinerary");
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/trips");
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    const failure = await removeTrip();
    setIsDeleting(false);
    if (failure) setDeleteError(failure);
    else goBack();
  }

  if (!trip) {
    return (
      <View className="flex-1 bg-canvas">
        <SafeAreaView className="flex-1 items-center justify-center px-5">
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <EmptyState
              message={
                isMissing
                  ? "This trip isn't available. It may have been deleted."
                  : (error ?? "We couldn't load this trip.")
              }
            >
              <Button label="Go back" variant="secondary" onPress={goBack} />
            </EmptyState>
          )}
        </SafeAreaView>
      </View>
    );
  }

  const day = trip.days.find((item) => item.id === selectedDayId) ?? defaultDay(trip.days);
  const showsItinerary = section === "Itinerary" && day !== null;

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            data={showsItinerary ? day.activities : []}
            keyExtractor={(activity) => activity.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={CONTENT_STYLE}
            ListHeaderComponent={
              <View className="pb-5">
                <TripBanner trip={trip} onBack={goBack} onOpenMenu={() => setIsMenuOpen(true)} />
                <View className="mt-3">
                  <FormMessage message={error} />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                  className="mt-2"
                >
                  {SECTIONS.map((item) => (
                    <Chip
                      key={item}
                      label={item}
                      selected={item === section}
                      onPress={() => setSection(item)}
                    />
                  ))}
                </ScrollView>

                {showsItinerary ? (
                  <View className="mt-4">
                    <DayChips
                      days={trip.days}
                      selectedId={day.id}
                      onSelect={(dayId) => {
                        setSelectedDayId(dayId);
                        setEditing(null);
                      }}
                    />
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item, index }) =>
              day ? (
                <ItineraryItem
                  activity={item}
                  day={day}
                  destination={trip.destination}
                  isLast={index === day.activities.length - 1}
                  isEditing={editing === item.id}
                  onEdit={setEditing}
                  onSave={saveActivity}
                  onDelete={removeActivity}
                />
              ) : null
            }
            ListFooterComponent={
              showsItinerary ? (
                <ItineraryFooter
                  day={day}
                  isAdding={editing === "new"}
                  onEdit={setEditing}
                  onSave={saveActivity}
                />
              ) : (
                <EmptyState message={`Nothing here yet. ${section} will arrive in a later update.`} />
              )
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <TripMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onEdit={() => {
          setIsMenuOpen(false);
          router.push({ pathname: "/trip/[id]/edit", params: { id: trip.id } });
        }}
        onDelete={() => {
          setIsMenuOpen(false);
          setDeleteError(null);
          setIsConfirmingDelete(true);
        }}
      />
      <ConfirmDialog
        visible={isConfirmingDelete}
        title="Delete this trip?"
        message="The trip, its days, its activities, and its pictures will be removed. This cannot be undone."
        confirmLabel="Delete trip"
        loading={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </View>
  );
}
