# Spec 12 — AI Trip Actions

## Overview

Spec 12 of 17. Depends on spec 7 and spec 11.

The buttons spec 11 left disabled now write, except the cover control.
The assistant can create a trip, save a draft, regenerate a suggestion,
save a day's activities onto a trip, and update bookings. The cover
image is spec 13.

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
- Save a day card onto the selected trip. Its activities are inserted
  on a day that already exists, the card's day by default, and the
  traveller can pick another. The chat never inserts a row in
  `itinerary_days`. Days come from the trip's dates. When a suggestion
  needs more days than the trip has, the assistant says so, and the
  traveller changes the dates on the trip screen, which goes through
  `reschedule_trip` from spec 5
- A trip made in the chat can be created first and filled one day card
  at a time. Create Trip does not have to carry every day's activities
- Update flights, cars, hotels, and extras using the tables from
  spec 7. Never write a booking the user did not accept
- An explore plan from spec 6 gains a Plan with AI button. It opens the
  chat with no trip selected and a message already typed that names the
  plan's title and day count. Nothing is sent until the traveller sends
  it
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
- Accept a day card and a hotel. The activities show on that day and
  the hotel shows under Bookings. Dismissing the card writes nothing.
  The trip has the same number of days as before
- Plan with AI on an explore plan opens the chat with the message typed
  and not sent
- A second user cannot see the new trip
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- @context/features/spec6-explore.md
- @context/features/spec7-bookings.md
- @context/features/spec11-ai-chat.md
- The AI Agent Chat board and the Add New Trip board in @context/plan/
