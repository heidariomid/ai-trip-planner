import { Image, Pressable, View } from "react-native";

import { useImageSource } from "../hooks/useImageSource";
import { pluralize } from "../lib/dates";
import type { TripPhoto } from "../lib/photos";
import { AddHeader } from "./AddHeader";
import { Text } from "./Text";

const PHOTOS_PER_ROW = 3;

/** One row of the Photos list: the heading, or up to three photos side by side. */
export type PhotoListRow =
  | { type: "header"; key: string; count: number }
  | { type: "photos"; key: string; photos: TripPhoto[] };

/** The gallery cut into rows of three, so one list can render the grid. */
export function buildPhotoRows(photos: TripPhoto[]): PhotoListRow[] {
  const rows: PhotoListRow[] = [{ type: "header", key: "photos-header", count: photos.length }];
  for (let index = 0; index < photos.length; index += PHOTOS_PER_ROW) {
    const group = photos.slice(index, index + PHOTOS_PER_ROW);
    rows.push({ type: "photos", key: group[0].id, photos: group });
  }
  return rows;
}

// A style object, not classes: on web a class does not override the intrinsic
// size of a bundled image, and the placeholder is one.
const THUMBNAIL_SIZE = { width: "100%", aspectRatio: 1 } as const;

interface PhotoThumbnailProps {
  photo: TripPhoto;
  onPress: () => void;
}

function PhotoThumbnail({ photo, onPress }: PhotoThumbnailProps) {
  const source = useImageSource(photo.image_path);

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={photo.caption ? `Open photo: ${photo.caption}` : "Open photo"}
      onPress={onPress}
      className="flex-1 active:opacity-80"
    >
      <Image
        source={source}
        resizeMode="cover"
        style={THUMBNAIL_SIZE}
        className="rounded-2xl bg-line"
        accessible={false}
      />
    </Pressable>
  );
}

export interface PhotoListItemProps {
  row: PhotoListRow;
  isUploading: boolean;
  onAdd: () => void;
  onOpen: (photo: TripPhoto) => void;
}

export function PhotoListItem({ row, isUploading, onAdd, onOpen }: PhotoListItemProps) {
  if (row.type === "header") {
    return (
      <View className="mb-2">
        <AddHeader
          title="Photos"
          detail={row.count > 0 ? pluralize(row.count, "photo") : undefined}
          addLabel="Add photos"
          onAdd={onAdd}
          busyLabel={isUploading ? "Uploading…" : null}
        />
        {row.count === 0 ? (
          <Text className="mt-1 text-[14px] leading-5 text-subtle">
            No photos yet. Add the ones you want to keep with this trip.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-2 flex-row gap-2">
      {row.photos.map((photo) => (
        <PhotoThumbnail key={photo.id} photo={photo} onPress={() => onOpen(photo)} />
      ))}
      {/* Empty cells keep a short last row the same size as the others. */}
      {Array.from({ length: PHOTOS_PER_ROW - row.photos.length }, (_, index) => (
        <View key={`empty-${index}`} className="flex-1" />
      ))}
    </View>
  );
}
