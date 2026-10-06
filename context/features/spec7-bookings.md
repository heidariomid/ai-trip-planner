# Spec 7 — Bookings

## Overview

Spec 7 of 17. Depends on spec 5. The Bookings tab on a trip.

Four kinds, each its own table: flights, car rentals, hotels, and extras.
The traveller adds, edits, and deletes them inline. The app stores the
plan. It does not book anything.

## Requirements

- A migration. Each table has `trip_id` referencing `trips` on delete
  cascade. Select uses `private.can_access_trip`. Insert, update, and
  delete use `private.can_edit_trip`. Index `trip_id`
- Flights: airline, flight number, departure time, arrival time
- Car rentals: company, pickup location, pickup time
- Hotels: name, check-in date, check-out date. Check-out is on or after
  check-in
- Extras: a title and a short detail, for a rail pass, a bus, or an event
- The Bookings tab has those four sections. Inline add, edit, and delete
  in each. The row shows as soon as it is saved
- Required fields match the board: a flight needs an airline and a flight
  number, a car needs a company, a hotel needs a name, an extra needs a
  title
- No file picker. Ticket PDFs stay out of this step

## Out of scope

- Paying for a booking, or talking to an airline or hotel API
- Uploading into the `documents` bucket
- AI filling these rows. That is spec 12

## Done when

- On a phone, add one of each kind, edit it, delete it, leave, and come
  back. The rows remain
- A hotel with check-out before check-in is rejected on the form
- A second user cannot see the rows
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec2-database-and-storage.md
- @context/features/spec5-trip-itinerary.md
- The Trip Details board in @context/plan/
