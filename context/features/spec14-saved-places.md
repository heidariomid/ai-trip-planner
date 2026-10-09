# Spec 14 — Saved Places

## Overview

Spec 14 of 17. Depends on spec 11 and spec 10.

A heart on a place card in the chat saves it. Profile opens the list of
saved places. This is the "saved items" line on the Home board.

The decisions below come from the pre-review in
`docs/spec14-pre-review.fa.md`. The user asked the assistant to decide
(2026-10-09), so all six recommendations are written in.

## Requirements

- A `saved_places` table: the user, a `name` (1 to 80 characters), a
  `label` (up to 160), a `city` (text, may be empty), and when it was
  saved. The limits match what the `chat` function allows on a place
  card. `user_id` defaults to the caller and cascades when the account
  is deleted
- Unique on the user, `lower(name)`, and `lower(city)`, so the same name
  in two cities is two places and a second heart removes the save
  instead of inserting a duplicate
- No image column. A place's photo is looked up at run time by name,
  and the saved list does not show one
- RLS so only that user can read, insert, and delete the row. No update
- The heart on a place card in the chat toggles the row. It does not
  create a trip. The city is the place card's own `city`, which the
  model gives as "City, Country" on every place card. A reply saved
  before that, or a card made from a day card's stops, falls back to
  the new trip's destination, or the selected trip's, or empty
- The heart is a small 30pt white circle (44pt tap target) on the top right corner of the
  card's photo. Saved is a filled red (`heart` token) heart; not saved is an outlined
  one. It is a sibling of the link that opens Google Maps, not inside
  it, so a tap on the heart never opens the map
- The heart changes at once and goes back if the save fails. No spinner
- Profile gains one row, "Saved places" with the count, that opens the
  list on its own screen, `/saved-places`. The Profile tab does not
  scroll and is not made to
- The list is text only: the name, then the label and the city under
  it. Tapping a row opens Google Maps with the name and the city
- Each row has a filled heart that removes it with one tap and no
  dialog. A failed removal puts the row back and shows a sentence
- Empty state when nothing is saved

## Out of scope

- Turning a saved place into an itinerary activity. That can be a later
  change if the list turns out to need it
- A live map or a place-search API
- Sharing the list with family
- A heart on a day card's stop or on a booking card
- A photo, or a photo column, on a saved row
- Giving the saved list to the model's prompt
- Search, sorting, or categories in the list

## Done when

- On a phone, heart a place in the chat, open Saved places from Profile
  and see it, heart it again, and see it leave both places
- Tapping a saved row opens Google Maps on that place
- A second user does not see the saved row and cannot delete it
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec10-profile.md
- @context/features/spec11-ai-chat.md
- `docs/spec14-pre-review.fa.md`
- The AI Agent Chat board and the Home board in @context/plan/
