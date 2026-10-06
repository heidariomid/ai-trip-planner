# Spec 5 — Trip and Itinerary

## Overview

Spec 5 of 17. Depends on spec 4.

Opening a trip shows its banner and the itinerary tab. The traveller can
edit the trip's own fields and add, edit, and delete activities on a day.

## Requirements

- A trip card opens this screen. The banner uses the cover, the title,
  source and destination, the dates, the computed day count, and the
  description
- Edit the header and save it back to `trips`, including a replacement
  cover. Changing the dates does not rebuild days from the phone. That
  is several requests, and a failure in the middle leaves the trip
  half updated. Renumbering from the phone can also collide with
  `unique (trip_id, day_number)` while two days briefly share a number
- Dates go through `public.reschedule_trip(trip_id, start_date, end_date, confirm_drop)`.
  One transaction, `security invoker`, same grants as `create_trip`.
  It sets the trip's dates and rebuilds the days inside that transaction.
  Empty days that fall outside the new range are removed. Empty days are
  added for dates that are new. A day that has activities is kept when
  its date is still inside the range
- Before the call, the screen looks for days that have activities and
  would fall outside the new range. If there are any, it asks. Cancel
  sends nothing. Confirm calls the function with `confirm_drop` true,
  and those days and their activities are deleted in the same
  transaction. If the function is called with `confirm_drop` false while
  such a day exists, it raises and rolls back. The old dates and the old
  days stay
- The function must not assign the final `day_number` values in one
  pass. Move the days that stay onto temporary numbers that cannot match
  an existing `day_number`, then set the final sequence. A failure
  anywhere undoes the date change and the renumber together
- The other tabs (Bookings, Packing, Photos, Notes) are visible and
  empty. They are filled by later specs
- Itinerary lists the days already created in spec 4. A row of date
  chips picks the day, and the activities of that day show as a
  timeline ordered by start time. Inline add, edit, and delete of an
  activity: start time, an optional end time, place, activity, and a
  short note. `ends_at` already exists from spec 2. An end time before
  the start time fails on the form, and the database check rejects it
  too
- The row appears as soon as it is saved. A failure stays on the row as
  a readable sentence
- The banner menu includes Delete trip. Confirm first. Only the owner
  can do this. The delete policy is `user_id = auth.uid()`. Remove the
  objects under `{owner_id}/{trip_id}/`, where `owner_id` is
  `trips.user_id`, not whoever happens to be signed in. Then delete the
  row. The row
  cascades to days and activities. If the file removal fails, stop and
  say so, and leave the trip in place. If the row delete fails after
  the files are gone, say so and leave the trip in the list so it can
  be tried again
- The cover on the banner comes from the signed-URL helper in spec 4
- Back returns to the list the traveller came from

## Out of scope

- Bookings, packing, the photo gallery, notes
- Dragging activities into a new order. `sort_order` can follow insert
  order
- Explore plans
- AI writing into the itinerary

## Done when

- On a phone, open a trip, change the title, add an activity, edit it,
  and delete it. Leave and come back. The changes are still there
- Change the dates on a trip that has an activity. The activity is still
  on its day. Shorten the trip so that day would fall off, and cancel.
  The dates do not change. Confirm. That day and its activity are gone,
  and the remaining days are numbered without a gap. A failed call does
  not leave two days with the same `day_number`
- Delete the trip from the banner menu. It leaves My Trips, and its
  cover no longer loads
- A second user cannot open the trip
- An activity saves with a start and an end time, and one with the end
  before the start is rejected on the form. The time pickers are not
  hidden behind the card or the keyboard
- The keyboard does not cover the inline fields
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec4-create-trip.md
- The Trip Details board in @context/plan/
