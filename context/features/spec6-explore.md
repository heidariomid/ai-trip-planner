# Spec 6 — Explore

## Overview

Spec 6 of 17. Depends on spec 5.

Home's Explore filter shows seeded plans instead of the static cards.
Opening one is read-only. Copying one creates a trip the traveller owns.

## Requirements

- A new migration for explore plans, with days and activities in the same
  shape as `itinerary_days` and `itinerary_activities`. Seed a handful of
  plans, including enough fields for the Home card: title, day count,
  a rough cost, place count, tags, and a picture
- Any signed-in user can read them. No signed-in user can update or
  delete them. `anon` cannot read them
- The rough cost is a field on the explore plan. It is not copied onto
  `trips`, because `trips` has no budget column
- Home's Explore filter lists these plans. My Plan, All Plans, and Active
  still list only the user's trips
- Opening a plan shows the banner and the itinerary, read-only, and a
  way to copy it
- An explore plan has a day count and activities. It has no calendar
  dates. Copy asks for a start date, defaulting to today. The end date
  is that start plus the day count, minus one. The call is `create_trip`,
  with those dates and the plan's activities, so the trip, the days, and
  the activities land in one transaction
- The explore picture is not copied. `image_path` on the new trip is
  null. The card uses the placeholder from the signed-URL helper. Do
  not point `image_path` at a file outside the traveller's folder
- The new trip shows up in My Trips. The explore row is unchanged
- Remove the static cards from spec 3 once the seeded plans render

## Out of scope

- Editing an explore plan in the app
- Copying bookings, packing, or photos. Explore plans do not have those
- AI generating the catalogue

## Done when

- On a phone, Explore lists the seeded plans, open one, copy it with a
  chosen start date, and find the copy under My Trips with that many
  days and the plan's activities. The copy has no cover
- The copy is invisible to a second user. The explore plan is visible to
  both
- A signed-in user cannot update an explore row
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- The Home board in @context/plan/
