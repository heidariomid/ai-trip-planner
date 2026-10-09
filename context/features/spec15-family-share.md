# Spec 15 — Family Share

## Overview

Spec 15 of 17. Depends on spec 9, because a member should be able to open
a trip that already has its sections, and on spec 14 being merged first:
both change the Profile tab, and this migration is `0020`.

A traveller shares a trip with a code. Someone else joins from a screen
named for that. The role is owner, can edit, or can view. Table policies
already point reads at `private.can_access_trip` and writes at
`private.can_edit_trip`. This step replaces those two function bodies.
It does not add a second policy on every table.

The pre-review is `docs/spec15-pre-review.fa.md`. On 2026-10-09 the user
said "you decide", so all eight of its recommendations are written in
below.

## Requirements

### Database

- `trip_members`: the trip, the user, and a role of `editor` or `viewer`.
  The owner is `trips.user_id` and is not also a member row. Unique on
  trip plus user. `user_id` references `profiles (id)` and both foreign
  keys cascade. An index on `user_id`
- Grants on `trip_members` for `authenticated`: `select`,
  `update (role)`, and `delete`. No insert: a row is only written by
  `join_trip`. Anyone who passes `can_access_trip` reads the trip's
  member rows. Only the owner (`private.trip_owner_id(trip_id)` is the
  caller) updates a role or deletes a row, and a member may also delete
  their own row, which is how they leave
- One join code per trip, in its own table `trip_join_codes`: `trip_id`
  as the primary key with cascade, and a unique `code`. Only the owner
  can read it. It is not a column on `trips`, because every viewer can
  read that row
- A code is 8 characters from letters and digits that are not confused
  with each other (no `0`, `O`, `1`, `I`), stored without a dash and
  shown as `XXXX-XXXX`
- `public.rotate_trip_code(p_trip_id uuid) returns text`, `security
  definer`, `search_path = ''`, owner only. It writes a new code for the
  trip and returns it, trying again if the code is taken. The share
  screen calls it the first time the owner opens it, and Regenerate
  calls it again, which invalidates the old code. Written as an insert
  with `on conflict … do update`, so the migration holds no `delete`
  statement and no `drop function` and can go through MCP
- Joining is `public.join_trip(p_code text) returns uuid`, `security
  definer`, `search_path = ''`. The joiner cannot read the trip or the
  code row yet, so the client must not select them. The function checks
  `auth.uid()`, ignores case, spaces, and dashes in the code, finds it,
  and inserts a viewer membership. It returns the trip id. Someone who
  is already a member gets the trip id back with their role untouched,
  so the trip simply opens. An unknown code and a code for your own trip
  come back as the same sentence: that code does not work. Revoke
  execute from `public` and `anon`. Grant it to `authenticated`
- Replace the body of `can_access_trip` so the owner, an editor, and a
  viewer pass. Replace the body of `can_edit_trip` so only the owner and
  an editor pass. Same signatures, with `create or replace`. A viewer
  then fails every insert, update, and delete that already uses
  `can_edit_trip`, including the trip header. The trigger from spec 2
  still blocks a change to `user_id`. Deleting the trip stays the spec 2
  policy, `user_id = auth.uid()`. An editor cannot delete the family
  trip
- Trip-file policies already compare the first folder to
  `trip_owner_id` and call `can_edit_trip` for writes. An editor can
  upload a photo or a new cover into the owner's folder. A viewer can
  read that folder and cannot write it. No new trip-file policy
- Names and avatars of other people on the trip come from
  `public.trip_people(trip_id)`. It is `security definer` with
  `search_path = ''`, like `join_trip`, because `private` is not on the
  Data API and the app could not call it there. The body checks
  `can_access_trip` before it returns anything. For the owner and each
  member it returns the id, `full_name`, `avatar_path`, `avatar_url`
  (a Google account has its picture only there), `role` (`owner`,
  `editor`, or `viewer`), and `is_you`. It never returns an email. It
  does not widen the `profiles` select policy. Revoke execute from
  `public` and `anon`. Grant it to `authenticated`
- A member can read another member's avatar object, the
  `{user_id}/avatar/` prefix, only when `trip_people` would include that
  user. That is one extra select policy on `storage.objects`, through a
  function in `private`. Signed URLs still go through the helper from
  spec 4. Do not make the bucket public
- Deleting the trip deletes its members and its code

### The app knows the role

- A trip carries the caller's `role`: `owner` when `user_id` is the
  caller, otherwise the role on their member row, read in the same
  request as the trip
- A viewer's trip is read-only. Every row is the read-only kind (as an
  explore plan's activity already is): no "+ Add", no pencil, no tick on
  an activity or a packing item, no photo upload, no caption or delete
  in the photo viewer. The options menu has "Ask the assistant" and
  "Leave trip" only. In the chat, a card that would write to that trip
  shows a `subtle` line, "Only editors can add to this trip", in place
  of its button
- An editor has everything the owner has except "Delete trip" and "Move
  to my trips", and has "Leave trip"
- `deleteTrip` refuses before it touches a file when the caller is not
  the owner. The file policies would let an editor remove the pictures
  while the row stayed
- A trip that is not the caller's shows a quiet `Shared` badge beside
  its status badge, on `TripCard` and `TripBanner`. Viewer and editor
  see the trip in My Trips and on Home

### Screens

- Sharing is its own screen, `/trip/[id]/share`, not a sheet: it changes
  a role and asks before removing someone, and a modal over a modal is
  unreliable on iOS. A third round button on the banner (Lucide `Users`,
  with the number of people when it is more than one) opens it for
  everyone on the trip
- The share screen lists the people from `trip_people` with avatar,
  name, and role ("Owner", "Can edit", "Can view"), and the count. A
  person with no name reads "Traveller". Every member sees the list
- Only the owner sees the code with Copy and Regenerate, and the control
  on a member's row that switches viewer and editor or removes them.
  Removing asks first with `ConfirmDialog`. Copy puts the code on the
  clipboard with `expo-clipboard` and says "Copied" only when the call
  returns true
- "Leave trip" asks first with `ConfirmDialog`, deletes the caller's own
  member row, and goes back to My Trips
- Profile gains one row, "Join a trip", like the "Saved places" row. It
  opens `/join-trip`, a `FormScreen` with a single code field
  (capitals, no autocorrect) and a join button. That is the only place
  a joiner types a code. After a join the form says "You joined the
  trip" and My Trips opens, where the trip is listed (user request,
  2026-10-09, replacing "the trip opens"). Profile does not
  list codes
- Refetch when the screen gains focus. Do not add Supabase Realtime
- Removing a member hides the trip from them on the next fetch. A chat
  thread they had on it stays theirs and opens with no trip selected,
  not with an error
- The share screen, the join screen, the banner button, and the
  `Shared` badge go into `context/design-system.md` in the same change

## Out of scope

- Realtime updates, and a notification when someone joins
- More than one owner
- A member inviting their own members. Only the owner shares
- A list of join codes on Profile
- The board's "Add Member" button. Joining is by code only
- Inviting by email or by link, and the system share sheet for the code
- Choosing a role at join time. Everyone joins as a viewer
- An expiry on a code, a cap on members, or a cap on join attempts
- Showing who added an activity

## Done when

- On a phone and on web as two accounts, the owner shares a code from
  the trip, and the other account types it on Join a trip. As a viewer
  they can read the itinerary, bookings, packing, photos, and notes,
  and they see no control that changes them or the header
- The share screen shows the other person's name and avatar, including
  a Google account's picture
- The owner switches that member to editor. The editor can add an
  activity, change the title, and add a photo. The editor has no Delete
  trip. The owner removes them. The trip disappears from their list
- A member leaves a trip on their own and it disappears from their list
- Typing the code again as a member opens the trip
- The editor sees that shared trip in the chat's trip selector. The
  selector is a select on `trips`, so this falls out of the new
  `can_access_trip` body. The app does not filter on `user_id` itself
- A wrong code and a code for your own trip show the same failure
- A member cannot read the code. A third user who never joined still
  sees nothing: no trip, member, code, or other people's profile rows
- The old code stops working after it is regenerated
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec2-database-and-storage.md
- @context/features/spec4-create-trip.md
- `docs/spec15-pre-review.fa.md`
- The Family Share board in @context/plan/
