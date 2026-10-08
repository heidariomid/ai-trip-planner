# Spec 6 — Explore

## Overview

Spec 6 of 17. Depends on spec 5.

Home's Explore filter shows seeded plans instead of the static cards.
Opening one is read-only. Copying one creates a trip the traveller owns.

## Requirements

- A new migration for explore plans, with days and activities in the same
  shape as `itinerary_days` and `itinerary_activities`. Seed a handful of
  plans. A plan stores a title, a destination, a description of at most
  200 characters, a rough cost, tags, a category, and a picture key
- Day count and place count are not stored. They are counted from the
  plan's day rows and activity rows in the query, so a card can never
  disagree with what a copy creates
- The picture is bundled in the app under `assets/explore/`, and the row
  holds only a key such as `tokyo`. Storage is not touched: its policies
  only allow `{owner_id}/{trip_id}/…` and avatars, and a migration
  cannot upload a file. A plan with an unknown key shows the placeholder
- Any signed-in user can read them. No signed-in user can update or
  delete them. `anon` cannot read them
- The rough cost is a field on the explore plan. It is not copied onto
  `trips`, because `trips` has no budget column
- Each plan has one category, plain text, such as beach, city,
  adventure, or food. Explore shows a row of category chips above the
  cards, with All selected first. Picking a chip filters the list that
  is already loaded. It is not a new request
- Home's Explore filter lists these plans. My Plan, All Plans, and Active
  still list only the user's trips
- The category chips are tinted when selected (`accent-soft` with
  `accent` text), like the day chips on a trip, so they do not compete
  with the filled Explore chip above them
- Opening a plan shows the banner and the itinerary, read-only, and a
  way to copy it. The banner shows no dates and no status badge, because
  a plan has neither
- An explore plan has activities and no calendar dates. Copy is its own
  screen, not a dialog, because the date picker is already a modal. It
  asks where the traveller is leaving from, which is required because
  `trips.source` is `not null` and a plan cannot know it, and for a
  start date, defaulting to today. It shows the end date: that start
  plus the day count, minus one. The call is `create_trip`, with the
  plan's title, destination, and description, those dates, and the
  plan's activities, so the trip, the days, and the activities land in
  one transaction
- After a copy the new trip opens, and back returns to Home. Copying the
  same plan again makes a second trip, and that is fine
- A copy starts with the plan's picture as its cover (user decision,
  2026-10-08, replacing "the copy has no cover"). The bundled picture is
  uploaded into the traveller's own folder, `{user_id}/{trip_id}/…`,
  like any other cover, so it can be replaced or deleted with the trip.
  Do not point `image_path` at a file outside the traveller's folder. If
  the upload fails, the trip stays and shows the placeholder
- The new trip shows up in My Trips. The explore row is unchanged
- Remove the static cards from spec 3 once the seeded plans render

## Out of scope

- Editing an explore plan in the app
- Copying bookings, packing, or photos. Explore plans do not have those
- AI generating the catalogue
- A heart or a save on a plan (spec 14), search, and a mark for a plan
  that was already copied
- A Plan with AI button on a plan. That is spec 12, because the chat
  does not exist yet

## Done when

- On a phone, Explore lists the seeded plans, open one, copy it with a
  chosen start date, and find the copy under My Trips with that many
  days and the plan's activities. The copy has the plan's picture as its
  cover
- The copy is invisible to a second user. The explore plan is visible to
  both
- A category chip narrows the list, and All brings every plan back
- A signed-in user cannot update an explore row
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- The Home board in @context/plan/
