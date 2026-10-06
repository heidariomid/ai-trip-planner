# Spec 8 — Packing

## Overview

Spec 8 of 17. Depends on spec 5. The Packing tab on a trip.

A checklist grouped by category. Items can be added, renamed, deleted,
and toggled packed.

## Requirements

- A migration for packing items: `trip_id`, category, label, and a packed
  flag defaulting to false. Select uses `private.can_access_trip`.
  Insert, update, and delete use `private.can_edit_trip`. Index
  `trip_id`. Delete with the trip
- The tab groups items by category. Categories are plain text the
  traveller types, not a fixed list
- Inline add, edit, and delete. Toggling packed saves immediately
- An empty category is not shown once its last item is gone

## Out of scope

- Sharing the list. Members arrive in spec 15
- Suggested packing from the assistant

## Done when

- On a phone, add items under two categories, check one, uncheck it,
  rename one, delete one. Leave and come back. The list matches
- A second user cannot see the items
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- The Trip Details board in @context/plan/
