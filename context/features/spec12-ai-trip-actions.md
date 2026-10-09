# Spec 12 — AI Trip Actions

## Overview

Spec 12 of 17. Depends on spec 7 and spec 11.

The buttons spec 11 left disabled now write, except the cover control.
From the chat a traveller can create a trip, save a draft, regenerate a
suggestion, save a day's activities onto a trip, and add bookings. The
cover image is spec 13.

**The model never writes.** It only proposes cards. Every write is made
by the app, with the traveller's own token, after the traveller taps a
button. Row-level security stays the boundary, and nothing the
traveller did not accept can be saved.

The decisions below were taken by the assistant at the user's request on
2026-10-08, after the pre-review in `docs/spec12-pre-review.fa.md`.

## Requirements

### Drafts

- Add `status` to `trips`, text, not null, default `active`, limited to
  `active` and `draft`. Existing rows stay `active`
- `create_trip` gains a `p_status` argument that defaults to `active`,
  so a draft is not a second request after an active insert. Drop the
  spec 2 signature first, then create the new one: `create or replace`
  does not replace a function when the arguments change, and two
  overloads make the API call ambiguous. Dropping loses the grants, so
  revoke from `public` and `anon` and grant to `authenticated` again
- The Active and All Plans filters the boards show no longer exist, so a
  draft is told apart this way:
  - On My Trips, a draft's card shows a `Draft` badge in place of
    Upcoming, Ongoing, or Past
  - Home's "Continue planning" list does not show drafts
  - The trip's options menu has "Move to my trips" on a draft, which
    sets `status` to `active`
  - The chat's trip picker lists drafts, so one can be filled a day at
    a time

### Cards the model may propose

The cards block from spec 11 grows. The Edge Function still cuts it down
to what the app draws and strips URLs.

- `trip`: `title`, `destination`, `day_count`, `traveler_count`, and
  `description`. This is the summary card. It has no source and no
  dates, because the model does not know them
- `days`: each day gains `day`, a whole number from 1. Each item's
  `time` is `HH:MM` or null; the function turns anything else into
  null, because `create_trip` casts it to a time and one bad value
  would fail the whole create
- `bookings`: `hotel` (name, optional check-in and check-out), `car`
  (company, optional pickup location), and `extra` (title, optional
  detail). A `flight` (airline, flight number) is proposed only when
  the traveller typed both themselves. The prompt tells the model never
  to invent a flight number
- When a trip is selected, the prompt tells the model to use that
  trip's day numbers and to say so when a plan needs more days than the
  trip has
- Raise the reply's token limit so a seven-day plan with cards is not
  cut off inside its JSON

### Create Trip and Save Draft

- Both sit on the `trip` card. Tapping one opens a sheet that asks for
  "Leaving from" and a start date; the end date is worked out from the
  day count and shown. That sheet is the confirmation
- Then one `create_trip` call with the card's fields, the activities of
  every day card in the same reply, and `p_status` of `active` or
  `draft`. The trip's length is the larger of `day_count` and the
  highest `day`, so no activity points at a day the trip does not have.
  `traveler_count` is kept between 1 and 20
- After a create the trip opens, and back lands on Home, as after a
  copy. A trip made in the chat can be created first and filled one day
  card at a time
- `create_trip` is one transaction, so a failed create leaves no trip
  behind

### Add to Trip

- A day card's Add to Trip needs a selected trip. It opens one sheet
  that lists the trip's existing days, with the card's `day` chosen
  when that day exists, and a button that says how many activities it
  will add. The sheet is both the day picker and the confirmation
- The chat never inserts a row in `itinerary_days`. When the card's day
  is past the end of the trip, no day is chosen and a line says to
  change the dates on the trip screen, which goes through
  `reschedule_trip` from spec 5
- The activities are written with one insert, so a day is never left
  half written
- After a save the button reads "Added" and is disabled. That is
  remembered only while the screen is open

### Bookings

- Each booking card has Add to Bookings, which opens `ConfirmDialog`
  saying exactly what will be written, then saves through the spec 7
  tables. A hotel with no dates takes the trip's dates
- The chat only adds a booking. Changing or deleting one stays on the
  trip screen
- With no trip selected the button is disabled

### Regenerate

- Only on the newest reply. The Edge Function takes a `regenerate`
  flag: it deletes that reply, saves no new user message, and answers
  the same last question again. `chat_messages` gains a delete grant
  and a policy for messages in the caller's own threads
- It counts toward the daily cap of 30, because it is a real request to
  the model
- It does not touch a trip

### Plan with AI

- An explore plan from spec 6 gains a Plan with AI button. It opens the
  chat with no trip selected, as a new conversation, with a message
  already typed that names the plan's title and day count. Nothing is
  sent until the traveller sends it

### Additions asked for by the user on 2026-10-09

The user wants the chat to be the strongest part of the app, because it
is what the app is meant to earn from. These three were added after the
first build, and each was the user's choice from named options.

- **Real place photos, free for now, from Wikipedia** (user decision,
  2026-10-09: "a free model for now"). `lib/places.ts` searches
  Wikipedia for the place and takes the page's picture only when the
  page title matches the place's name, because a search always returns
  something and a wrong photo is worse than none. Requests go out one
  at a time with a pause, with one retry when Wikipedia says to slow
  down, and each place is looked up once per app run. Well-known places
  get a real photo; most restaurants, hotels, and small places keep the
  placeholder. The picture's address comes from that lookup and never
  from the model. The card credits "Wikipedia"
- **Google Places is built and switched off.** One constant in
  `lib/places.ts`, `PLACE_SOURCE`, switches to it. It gives a photo for
  nearly every place, plus the address and the place's own Maps page,
  through the `place-photo` Edge Function with `GOOGLE_PLACES_API_KEY`
  as a secret and a cap of 100 lookups per user per UTC day
  (`public.consume_place_lookup`). It needs a Google Cloud project with
  billing, which is why it waits. Gemini was also tried for pictures
  and ruled out: the image model allows nothing on the free tier, and
  it draws a picture instead of finding a photo
- Before release: a Wikipedia photo needs its author and licence shown,
  not only "Wikipedia"; switching to Google Places removes that duty
- Place cards are a row that scrolls sideways, each 210pt wide with the
  photo on top. When a plan comes with no place cards, the places its
  days stop at are shown instead, at most 6, so a plan always has
  something to look at. Photos are looked up for place cards only, not
  for every stop of every day, to keep the number of paid lookups down
- **A place opens in Google Maps.** Tapping a place card opens the
  place's own Maps page from the lookup, or a search for its name when
  there is none. The place on a day card's stop is a link too
- **Edit a card before saving.** A day card has Edit: remove a stop or
  change its time. Add to Trip and Create Trip save the traveller's
  version. Edits last while the screen is open
- **Replace a day.** When the chosen day already has activities, the
  day sheet offers "Keep the N already there" or "Replace those N".
  Replace goes through `public.replace_day_activities`, one transaction
  that removes the day's activities and writes the card's, so the day
  is never left empty in between. The sheet's button says which it will
  do. Adding is the default every time the sheet opens

- **A trip made in the chat gets a cover** (user request, 2026-10-09:
  a trip with the grey placeholder "makes the app ugly"). Before
  `create_trip`, the app looks up a wide Wikipedia photo of the
  destination's city, and it is uploaded as the trip's cover like any
  other, into `{user_id}/{trip_id}/`. With no photo found, or a failed
  upload, the trip is still created and shows the placeholder. Spec 13
  replaces this with a generated cover
- **Past conversations** (user request, 2026-10-09, "like the ChatGPT
  app"). The chat's header has a history button that opens
  `/chat-history`: every conversation, newest first, titled by its
  first message, with the trip it is about and the date. Tapping one
  opens it in the chat and selects its trip. Each has a delete, behind
  `ConfirmDialog`; deleting a conversation never touches a trip made
  from it. This replaces "A list of old conversations" under Out of
  scope

### Always

- The traveller confirms before a write that changes an existing trip.
  A new trip from Create Trip is itself the confirmation
- Failures stay in the chat as a readable sentence
- The secret key still never ships in the app

## Out of scope

- Hearts and the saved-places list
- Generating a cover image. A trip made in the chat shows the
  placeholder until spec 13
- Family share
- Buying what the booking rows describe
- Function calling, or any path where the model writes by itself
- Changing or deleting one existing activity or booking from the chat.
  Replacing a whole day's activities with a day card is allowed
- Ratings, opening hours, or reviews for a place

## Done when

- On a phone, create a trip from the chat, see it in My Trips, save
  another as a draft, and confirm the draft shows a Draft badge and is
  not under Continue planning on Home
- Move that draft to my trips from its menu. The badge changes
- Accept a day card and a hotel. The activities show on that day and
  the hotel shows under Bookings. Closing the sheet or the dialog
  writes nothing. The trip has the same number of days as before
- A day card for a day past the end of the trip cannot be added, and
  says why
- Regenerate replaces the last reply. The question appears once
- Plan with AI on an explore plan opens an empty chat with the message
  typed and not sent
- A second user cannot see the new trip
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- @context/features/spec6-explore.md
- @context/features/spec7-bookings.md
- @context/features/spec11-ai-chat.md
- The AI Agent Chat board and the Add New Trip board in @context/plan/
- `docs/spec12-pre-review.fa.md`, for why each rule is here
