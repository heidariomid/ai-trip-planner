# Spec 15 — Family Share

## Overview

Spec 15 of 17. Depends on spec 9, because a member should be able to open
a trip that already has its sections.

A traveller shares a trip with a code. Someone else joins from a screen
named for that. The role is owner, can edit, or can view. Table policies
already point reads at `private.can_access_trip` and writes at
`private.can_edit_trip`. This step replaces those two function bodies.
It does not add a second policy on every table.

## Requirements

- `trip_members`: the trip, the user, and a role of `editor` or `viewer`.
  The owner is `trips.user_id` and is not also a member row. Unique on
  trip plus user
- One join code per trip, shown on that trip's share sheet. Copy puts it
  on the clipboard. Regenerating invalidates the old one. Profile does
  not list codes. Several trips would become several codes, and Profile
  is the wrong place for that
- Profile gains one action, Join a trip. It opens a screen with a single
  code field and a join button. That is the only place a joiner types a
  code
- Joining is `public.join_trip(code text) returns uuid`, `security
  definer`, `search_path = ''`. The joiner cannot read the trip or the
  code row yet, so the client must not select them. The function checks
  `auth.uid()`, finds the code, and inserts a viewer membership. It
  returns the trip id. Unknown code, own trip, or already a member all
  come back as the same sentence: that code does not work. Revoke
  execute from `public` and `anon`. Grant it to `authenticated`
- The owner can switch a member between viewer and editor, or remove them
- Replace the body of `can_access_trip` so the owner, an editor, and a
  viewer pass. Replace the body of `can_edit_trip` so only the owner and
  an editor pass. Same signatures. A viewer then fails every insert,
  update, and delete that already uses `can_edit_trip`, including the
  trip header. The trigger from spec 2 still blocks a change to
  `user_id`. Deleting the trip stays the spec 2 policy,
  `user_id = auth.uid()`. An editor cannot delete the family trip
- Trip-file policies already compare the first folder to
  `trip_owner_id` and call `can_edit_trip` for writes. An editor can
  upload a photo or a new cover into the owner's folder. A viewer can
  read that folder and cannot write it. No new trip-file policy
- Names and avatars of other people on the trip come from
  `public.trip_people(trip_id)`. It is `security definer` with
  `search_path = ''`, like `join_trip`, because `private` is not on the
  Data API and the app could not call it there. The body checks
  `can_access_trip` before it returns anything. It returns id, full
  name, and avatar path for the owner and the members. It does not widen
  the `profiles` select policy. Revoke execute from `public` and `anon`.
  Grant it to `authenticated`
- A member can read another member's avatar object, the
  `{user_id}/avatar/` prefix, only when `trip_people` would include that
  user. That is one extra select policy on `storage.objects`. Signed
  URLs still go through the helper from spec 4. Do not make the bucket
  public
- The share sheet matches the board: member list with those names and
  avatars, the count, and the role on each row. Viewer and editor see
  the trip in My Trips
- Refetch when the screen gains focus. Do not add Supabase Realtime
- Removing a member hides the trip from them on the next fetch. Deleting
  the trip deletes members and the code

## Out of scope

- Realtime updates
- More than one owner
- A member inviting their own members. Only the owner shares
- A list of join codes on Profile

## Done when

- On two phones, the owner shares a code from the trip, and the other
  account types it on Join a trip. As a viewer they can read the
  itinerary, bookings, packing, photos, and notes, and they cannot
  change them or the header
- The share sheet shows the other person's name and avatar
- The owner switches that member to editor. The editor can add an
  activity, change the title, and add a photo. The editor cannot delete
  the trip. The owner removes them. The trip disappears from their list
- The editor sees that shared trip in the chat's trip selector. The
  selector is a select on `trips`, so this falls out of the new
  `can_access_trip` body. The app does not filter on `user_id` itself
- A wrong code and a code for your own trip show the same failure
- A third user who never joined still sees nothing, including other
  people's profile rows
- The old code stops working after it is regenerated
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec2-database-and-storage.md
- @context/features/spec4-create-trip.md
- The Family Share board in @context/plan/
