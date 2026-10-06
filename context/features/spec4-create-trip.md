# Spec 4 — Create a Trip

## Overview

Spec 4 of 17. Depends on spec 2 and spec 3.

The Add New Trip form. Saving calls `create_trip`, uploads the cover,
and shows the card in My Trips and on Home.

## Requirements

- The form opens from the Create a trip button that spec 3 left
  disabled in the My Plan and My Trips empty states, and from a plus
  button on My Trips that stays once the list has trips
- The form fields are title, source, destination, start date, end date,
  cover, description, and travelers. Title, source, destination, and the
  two dates are required. Description is optional and stops at 200
  characters. Travelers is a count, optional, default 1
- Source and destination are plain text. No place-search API
- Dates default to today and today plus 3. The form shows the computed
  day count and night count. Those numbers are not stored
- End date cannot be before start date. Show the failure on the form
- Cover: pick from the gallery, show a preview, upload to the private
  `images` bucket at `{user_id}/{trip_id}/{filename}`, then store the
  path in `image_path`. Call `create_trip` first, with a null image
  path, so the trip id exists before the upload. If the upload fails,
  the trip stays and the screen says the cover did not save. The
  "generate with AI" control is visible and disabled until spec 13
- Every screen that shows a private image uses one helper,
  `lib/storage.ts`: given a path, it returns a signed URL with a short
  expiry, and given null or a failed signature it returns one shared
  placeholder. Cards, banners, and avatars call that helper. They do
  not build signed URLs themselves
- Save calls `create_trip`. It does not insert the trip and then the
  days from the phone. Days come back from that one call, `day_number`
  starting at 1
- The trip card is one component, used on Home and on My Trips. It
  shows the cover, the title, source and destination, the date range,
  the computed day count, and a badge: Upcoming before the start date,
  Ongoing while today falls inside the dates, Past after the end date.
  It does not show a cost, a place count, tags, or a map picture. Those
  belong to the Explore card, and `trips` has no column for them. The
  planning progress bar on this card arrives in spec 8
- The new card appears under My Trips and under Home's My Plan and All
  Plans. Active shows the trip only when today falls inside its dates
- Explore still shows the static cards from spec 3
- Inline validation. The keyboard does not cover the fields or Save
- Failures are readable sentences

## Out of scope

- Editing the trip after save. That is spec 5
- Activities on the days. The days are empty on purpose
- AI image generation. That is spec 13
- Bookings, packing, photos, notes

## Done when

- On a phone, a new trip with a cover shows up in My Trips and on Home.
  The cover is loaded through the signed-URL helper
- Killing the app halfway through save does not leave a trip with the
  wrong number of days. The days are created with the trip
- A trip whose dates include today appears under Active. One that does
  not, does not. The badge on each card matches its dates
- A second user does not see the trip
- The description cannot pass 200 characters, and the date check holds
- Airplane mode fails with a readable error, not a spinner that never ends
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec2-database-and-storage.md
- @context/features/spec3-app-shell.md
- The Add New Trip board in @context/plan/
