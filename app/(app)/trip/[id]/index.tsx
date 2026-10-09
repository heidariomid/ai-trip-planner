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

import {
  BookingListItem,
  buildBookingItems,
  type BookingEditing,
  type BookingItem,
} from "../../../../components/Bookings";
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
import {
  NoteListItem,
  buildNoteRows,
  type NoteEditing,
  type NoteListRow,
} from "../../../../components/Notes";
import {
  PackingListItem,
  buildPackingRows,
  type PackingEditing,
  type PackingListRow,
} from "../../../../components/Packing";
import { PhotoViewer } from "../../../../components/PhotoViewer";
import {
  PhotoListItem,
  buildPhotoRows,
  type PhotoListRow,
} from "../../../../components/Photos";
import { TripBanner } from "../../../../components/TripBanner";
import { TripMenu } from "../../../../components/TripMenu";
import { useBookings } from "../../../../hooks/useBookings";
import { useNotes } from "../../../../hooks/useNotes";
import { usePacking } from "../../../../hooks/usePacking";
import { usePhotos } from "../../../../hooks/usePhotos";
import { useTripDetail } from "../../../../hooks/useTripDetail";
import { todayISO } from "../../../../lib/dates";
import type { PackingItem } from "../../../../lib/packing";
import { colors } from "../../../../lib/theme";
import type { Activity, ItineraryDay } from "../../../../lib/trip-detail";

const SECTIONS = ["Itinerary", "Bookings", "Packing", "Photos", "Notes"] as const;
type Section = (typeof SECTIONS)[number];

/** One row of the screen's list: an activity of the selected day, or a row of another section. */
type TripRow =
  | { type: "activity"; key: string; activity: Activity; isLast: boolean }
  | { type: "booking"; key: string; item: BookingItem }
  | { type: "packing"; key: string; row: PackingListRow }
  | { type: "photos"; key: string; row: PhotoListRow }
  | { type: "notes"; key: string; row: NoteListRow };

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
  const {
    trip,
    isLoading,
    isMissing,
    error,
    saveActivity,
    removeActivity,
    toggleActivity,
    removeTrip,
    activate,
  } = useTripDetail(id);
  const bookings = useBookings(id);
  const packing = usePacking(id);
  const photos = usePhotos(id);
  const notes = useNotes(id);

  const [section, setSection] = useState<Section>("Itinerary");
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [editingBooking, setEditingBooking] = useState<BookingEditing>(null);
  const [editingPacking, setEditingPacking] = useState<PackingEditing>(null);
  const [editingNote, setEditingNote] = useState<NoteEditing>(null);
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [tickError, setTickError] = useState<string | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/trips");
  }

  async function handleToggle(activity: Activity) {
    setTickError(null);
    setTickError(await toggleActivity(activity));
  }

  async function handlePack(item: PackingItem) {
    setTickError(null);
    setTickError(await packing.toggleItem(item));
  }

  async function handleAddPhotos(ownerId: string) {
    setTickError(null);
    setTickError(await photos.addPhotos(ownerId));
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
  const showsBookings = section === "Bookings";
  const showsPacking = section === "Packing";
  const loadingBySection: Record<Section, boolean> = {
    Itinerary: false,
    Bookings: bookings.isLoading,
    Packing: packing.isLoading,
    Photos: photos.isLoading,
    Notes: notes.isLoading,
  };
  const errorBySection: Record<Section, string | null> = {
    Itinerary: null,
    Bookings: bookings.error,
    Packing: packing.error,
    Photos: photos.error,
    Notes: notes.error,
  };
  const isSectionLoading = loadingBySection[section];
  const sectionError = errorBySection[section];

  let rows: TripRow[] = [];
  if (showsItinerary) {
    rows = day.activities.map((activity, index) => ({
      type: "activity",
      key: activity.id,
      activity,
      isLast: index === day.activities.length - 1,
    }));
  } else if (showsBookings && !bookings.isLoading) {
    rows = buildBookingItems(bookings.bookings).map((item) => ({
      type: "booking",
      key: item.key,
      item,
    }));
  } else if (showsPacking && !packing.isLoading) {
    rows = buildPackingRows(packing.items).map((row) => ({
      type: "packing",
      key: row.key,
      row,
    }));
  } else if (section === "Photos" && !photos.isLoading) {
    rows = buildPhotoRows(photos.photos).map((row) => ({ type: "photos", key: row.key, row }));
  } else if (section === "Notes" && !notes.isLoading) {
    rows = buildNoteRows(notes.notes).map((row) => ({ type: "notes", key: row.key, row }));
  }

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={CONTENT_STYLE}
            ListHeaderComponent={
              <View className="pb-5">
                <TripBanner trip={trip} onBack={goBack} onOpenMenu={() => setIsMenuOpen(true)} />
                <View className="mt-3">
                  <FormMessage message={error ?? tickError ?? sectionError} />
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
            renderItem={({ item: row }) => {
              if (row.type === "booking") {
                return (
                  <BookingListItem
                    item={row.item}
                    editing={editingBooking}
                    tripStart={trip.start_date}
                    tripEnd={trip.end_date}
                    onEdit={setEditingBooking}
                    onSave={bookings.saveBooking}
                    onDelete={bookings.removeBooking}
                  />
                );
              }
              if (row.type === "packing") {
                return (
                  <PackingListItem
                    row={row.row}
                    editing={editingPacking}
                    onEdit={setEditingPacking}
                    onSave={packing.saveItem}
                    onDelete={packing.removeItem}
                    onToggle={(item) => void handlePack(item)}
                  />
                );
              }
              if (row.type === "photos") {
                return (
                  <PhotoListItem
                    row={row.row}
                    isUploading={photos.isUploading}
                    onAdd={() => void handleAddPhotos(trip.user_id)}
                    onOpen={(photo) => setOpenPhotoId(photo.id)}
                  />
                );
              }
              if (row.type === "notes") {
                return (
                  <NoteListItem
                    row={row.row}
                    editing={editingNote}
                    onEdit={setEditingNote}
                    onSave={notes.saveNote}
                    onDelete={notes.removeNote}
                  />
                );
              }
              return day ? (
                <ItineraryItem
                  activity={row.activity}
                  day={day}
                  destination={trip.destination}
                  isLast={row.isLast}
                  isEditing={editing === row.activity.id}
                  onEdit={setEditing}
                  onSave={saveActivity}
                  onDelete={removeActivity}
                  onToggleDone={(activity) => void handleToggle(activity)}
                />
              ) : null;
            }}
            ListFooterComponent={
              showsItinerary ? (
                <ItineraryFooter
                  day={day}
                  isAdding={editing === "new"}
                  onEdit={setEditing}
                  onSave={saveActivity}
                />
              ) : isSectionLoading ? (
                <View className="py-10">
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <TripMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onAsk={() => {
          setIsMenuOpen(false);
          router.push({ pathname: "/chat", params: { tripId: trip.id } });
        }}
        onActivate={
          trip.status === "draft"
            ? () => {
                setIsMenuOpen(false);
                setTickError(null);
                void activate().then(setTickError);
              }
            : undefined
        }
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
      <PhotoViewer
        photo={photos.photos.find((photo) => photo.id === openPhotoId) ?? null}
        onSaveCaption={photos.saveCaption}
        onDelete={photos.removePhoto}
        onClose={() => setOpenPhotoId(null)}
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
