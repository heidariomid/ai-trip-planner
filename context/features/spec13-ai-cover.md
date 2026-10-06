# Spec 13 — AI Cover Image

## Overview

Spec 13 of 17. Depends on spec 4 and spec 12.

Generating a cover is a second model, a second secret, and its own
failures. It is not part of writing trip rows. The control spec 4 left
disabled on Add New Trip starts working here. The chat does not gain an
image button in this step.

## Requirements

- Its own Edge Function, or its own route on the function from spec 11,
  with its own secret. The chat secret is not reused as a convenience
  if the image provider is a different account. Either way the secret
  stays off the device
- Its own daily cap, a constant in the function, starting at 5 per user
  per UTC day. It does not draw from the chat cap of 30, and the client
  cannot raise it. Over the cap, the form says to try again tomorrow
- The traveller describes the trip, or the form sends the title and
  destination already typed. The function returns image bytes for a
  preview on the form. It does not write Storage and it does not call
  `create_trip`
- Save is what persists it. Save calls `create_trip`, uploads the
  preview into `{owner_id}/{trip_id}/`, and sets `image_path`, the same
  order as a gallery photo. Leaving the form before Save drops the
  preview. My Trips does not gain a trip
- A failed generation does not block Save. The traveller can still pick
  a photo from the gallery. A failed or empty image is a readable
  sentence on the form, not a broken image and not a URL the model
  printed

## Out of scope

- Generating photos for place cards or the gallery
- Changing itinerary rows, bookings, or draft status
- Letting the chat model call this by itself

## Done when

- On a phone, generate a cover, see the preview, and go back. My Trips
  has no new trip. Generate again, save, and the card shows that cover.
  A failed generation still lets them save with a gallery photo or none
- A sixth generation on the same UTC day is refused and does not call
  the image model
- The app bundle contains no image-model secret
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec4-create-trip.md
- @context/features/spec12-ai-trip-actions.md
- The Add New Trip board in @context/plan/
