# Spec 12 — AI Trip Actions

## Overview

Spec 12 of 17. Depends on spec 7 and spec 11.

The buttons spec 11 left disabled now write, except the cover control.
The assistant can create a trip, save a draft, regenerate a suggestion,
add a day, and update bookings. The cover image is spec 13.

## Requirements

- Add `status` to `trips`, text, not null, default `active`, limited to
  `active` and `draft`. Existing rows stay `active`. A draft is hidden
  from Active and shown in My Trips and All Plans
- Create Trip calls `create_trip` with the summary card's fields, its
  days' activities, and `status` active, then opens the trip. Save Draft
  is the same call with `status = draft`. This step adds that argument,
  defaulting to `active`, so a draft is not a second request after an
  active insert. Drop the spec 2 signature first, then create the new
  one. `create or replace` does not replace a function when the
  arguments change, and two overloads make the API call ambiguous.
  Regenerate replaces the
  suggestion in the transcript and does not touch a trip until the
  traveller saves
- Add a day, or an activity, on the selected trip, using the tables from
  spec 2. Update flights, cars, hotels, and extras using the tables from
  spec 7. Never write a booking the user did not accept
- The user confirms before a write that changes an existing trip. A new
  trip from Create Trip is itself the confirmation
- Failures stay in the chat as a readable sentence. `create_trip` is
  one transaction, so a failed create leaves no trip behind
- The secret key still never ships in the app

## Out of scope

- Hearts and the saved-places list
- Generating a cover image
- Family share
- Buying what the booking rows describe

## Done when

- On a phone, create a trip from the chat, see it in My Trips, save
  another as a draft, and confirm the draft is not under Active
- Accept an added day and a hotel. They show on the trip. Dismissing the
  card writes nothing
- A second user cannot see the new trip
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec7-bookings.md
- @context/features/spec11-ai-chat.md
- The AI Agent Chat board and the Add New Trip board in @context/plan/
