# Spec 14 — Saved Places

## Overview

Spec 14 of 17. Depends on spec 11 and spec 10.

A heart on a place card in the chat saves it. Profile lists those saved
places. This is the "saved items" line on the Home board.

## Requirements

- A `saved_places` table: the user, a name, a short label, and when it
  was saved. No image path. Place cards are text and a placeholder, so
  there is no picture to store. RLS so only that user can read and
  write the row. Unique on user plus name, so a second heart removes the
  save instead of inserting a duplicate
- The heart on a place card in the chat toggles the row. It does not
  create a trip
- Profile grows a saved list. Tapping a row does not open a map. The
  traveller can remove one from the list
- Empty state when nothing is saved

## Out of scope

- Turning a saved place into an itinerary activity. That can be a later
  change if the list turns out to need it
- A live map or a place-search API
- Sharing the list with family

## Done when

- On a phone, heart a place in the chat, see it on Profile, heart it
  again, and see it leave both places
- A second user does not see the saved row
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec10-profile.md
- @context/features/spec11-ai-chat.md
- The AI Agent Chat board and the Home board in @context/plan/
