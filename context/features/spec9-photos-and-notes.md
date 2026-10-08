# Spec 9 — Photos and Notes

## Overview

Spec 9 of 17. Depends on spec 5. The Photos tab and the Notes tab.

Photos are a gallery, separate from the cover image. Notes are a list,
not one long field.

## Requirements

- Photos upload to the private `images` bucket under
  `{user_id}/{trip_id}/…`, which spec 2 already allows. A `trip_photos`
  row stores the path and an optional caption. Select uses
  `private.can_access_trip`. Insert, update, and delete use
  `private.can_edit_trip`. Deleting a photo deletes the row and the
  object
- The gallery shows those photos. It does not show the cover unless the
  cover was also added as a photo. Gallery and cover both use the
  signed-URL helper from spec 4
- Notes: `trip_id` and a body. The same two functions as photos. Add,
  edit, and delete. The newest note is first
- Both tabs are the ones left empty in spec 5
- Decided when the spec was built (2026-10-08): a caption can be added
  or changed after upload and is at most 120 characters; a note is at
  most 500; the gallery is three thumbnails to a row, newest first;
  tapping a photo opens it full screen with its caption and Delete,
  which asks first; up to 10 photos can be picked in one go
- A photo's file is `photo-{time}-{random}` in `{owner_id}/{trip_id}/`,
  beside `cover-{time}`, where the owner is the trip's `user_id`. The
  upload is one shared helper in `lib/storage.ts`, which spec 13 reuses
  for a generated cover

## Out of scope

- A ticket file in the `documents` bucket
- Comments on a photo
- AI captions

## Done when

- On a phone, add two photos and a note, edit the note, delete one photo.
  Leave and come back. What remains is still there, and the deleted photo
  does not load
- A second user cannot see the photos or the notes
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec2-database-and-storage.md
- @context/features/spec5-trip-itinerary.md
- The Trip Details and Family Share boards in @context/plan/
