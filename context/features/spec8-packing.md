# Spec 8 — Packing

## Overview

Spec 8 of 17. Depends on spec 5. The Packing tab on a trip.

A checklist grouped by category. Items can be added, renamed, deleted,
and toggled packed. The trip card also gains its planning progress bar
here, because this is the first step where both of its inputs exist.

## Requirements

- A migration for packing items: `trip_id`, category, label, and a packed
  flag defaulting to false. Select uses `private.can_access_trip`.
  Insert, update, and delete use `private.can_edit_trip`. Index
  `trip_id`. Delete with the trip
- The tab groups items by category. Categories are plain text the
  traveller types, not a fixed list
- Inline add, edit, and delete. Toggling packed saves immediately
- An empty category is not shown once its last item is gone
- The planning progress bar on the trip card, already there since
  spec 4, now counts packing too, and shows on Upcoming and Ongoing
  trips only. It is computed and never stored. One half is the share
  of activities ticked off (user decision, 2026-10-08, replacing the
  share of days with an activity). The other half is the share of
  packing items that are packed. A trip that has only one of the two
  uses that share alone, and a trip with neither reads 0%
- The counts behind the bar arrive with the trip list in one request.
  A card does not fetch its own. The read goes through the same
  policies as the rows, so it needs no new grant

## Out of scope

- Sharing the list. Members arrive in spec 15
- Suggested packing from the assistant

## Done when

- On a phone, add items under two categories, check one, uncheck it,
  rename one, delete one. Leave and come back. The list matches
- The bar on the trip card moves after an activity is ticked and after
  an item is checked, once the list is shown again
- A second user cannot see the items
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- The Trip Details board in @context/plan/
