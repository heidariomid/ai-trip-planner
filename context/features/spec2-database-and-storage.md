# Spec 2 — Database and Storage

## Overview

Spec 2 of 17. Depends on spec 1, which is done.

This step gives the trip data a home. It adds `trips`, `itinerary_days`,
and `itinerary_activities`, and two private Storage buckets, `images` and
`documents`.

`profiles` already exists. `supabase/migrations/0001_profiles.sql` is
applied, and the sign-up trigger writes the row. This step does not
recreate that table and does not add columns to it. Interest tags are
spec 10.

No screens. The placeholder home stays as it is.

This step is done when a signed-in user can create, read, update, and
delete their own trip, its days, and its activities, a second user cannot
see any of those rows, and each user can store a file only inside their
own folder.

## Requirements

### Migrations

One new file, `supabase/migrations/0002_trips_itinerary_storage.sql`,
following `0001_profiles.sql`. Apply that same SQL to the remote project
so the migration history matches the file.

A second file, `supabase/migrations/0003_activity_ends_at.sql`, adds
`ends_at` to `itinerary_activities` and replaces the body of
`create_trip` so the activity list accepts it. It is its own file
because `0002` was already applied when the column was decided.

Do not edit `0001_profiles.sql`.

### `profiles` — already applied

Left as it is. One row per user, created by `on_auth_user_created`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | references `auth.users(id)` on delete cascade |
| `email` | `text` | copied at sign-up |
| `full_name` | `text` | from the form, or Google |
| `avatar_url` | `text` | null for email sign-ups |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

RLS is already on: a user can select and update their own row. There is
no insert policy; the trigger inserts.

### `trips`

One row per trip, owned by one profile. Columns follow the Add New Trip
board. Day count is computed from the two dates in the app, so it is not
a column. The cover is a Storage path, not a public URL. Budget is not a
column. Draft status is added in spec 12, not here.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` not null | references `public.profiles(id)` on delete cascade |
| `title` | `text` not null | |
| `source` | `text` not null | where the trip starts, as typed text |
| `destination` | `text` not null | |
| `start_date` | `date` not null | |
| `end_date` | `date` not null | on or after `start_date` |
| `image_path` | `text` | null until a cover is uploaded |
| `description` | `text` | null allowed, at most 200 characters |
| `traveler_count` | `integer` not null | default `1`, must be greater than 0 |
| `created_at` | `timestamptz` not null | default `now()` |
| `updated_at` | `timestamptz` not null | default `now()` |

`uuid` primary keys match `profiles`. These tables stay small.

Checks: `end_date >= start_date`, `traveler_count > 0`, and
`description` is null or `char_length(description) <= 200`.

Index `user_id`. Postgres does not index a foreign key on its own.

`updated_at` is a default on insert only, same as `profiles`. No trigger
that bumps it.

### `itinerary_days`

One row per day of a trip.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `trip_id` | `uuid` not null | references `public.trips(id)` on delete cascade |
| `day_number` | `integer` not null | starts at 1 |
| `date` | `date` | the calendar day |
| `title` | `text` | null until someone names the day |
| `created_at` | `timestamptz` not null | default `now()` |
| `updated_at` | `timestamptz` not null | default `now()` |

Check: `day_number > 0`. Unique `(trip_id, day_number)`. That unique
index also serves lookups by `trip_id`.

### `itinerary_activities`

One row per stop on a day. This is the join. Do not store the day's
stops as `jsonb` on the day.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `day_id` | `uuid` not null | references `public.itinerary_days(id)` on delete cascade |
| `sort_order` | `integer` not null | default `0` |
| `starts_at` | `time` | null allowed |
| `ends_at` | `time` | null allowed. Not before `starts_at` when both are set |
| `place` | `text` | |
| `activity` | `text` | |
| `notes` | `text` | a short note |
| `created_at` | `timestamptz` not null | default `now()` |

Index `day_id`.

Deleting a trip deletes its days, then its activities. Deleting a user
deletes the profile, then the trips. That cascade does not remove
Storage objects. Spec 5 deletes the files when the traveller deletes
the trip.

### Who can touch a trip

Two functions, both `returns boolean`, both taking `trip_id uuid`:

- `private.can_access_trip` — may read
- `private.can_edit_trip` — may insert or update a trip, and may change
  its days and activities. Deleting the trip itself is not this function.
  That policy is `user_id = (select auth.uid())`, so only the owner can
  delete it. Spec 15 does not hand that to an editor

In this step the bodies are the same: a row in `public.trips` exists
with that id and `user_id = (select auth.uid())`. Spec 15 replaces the
bodies so a viewer passes only the read check and an editor passes both.
The signatures stay. Later tables do not grow a second policy when
sharing arrives.

Schema `private` is not exposed through the Data API. Both functions are
`security definer`, `stable`, with `search_path = ''`, so they can read
`trips` without the trips policy calling them again. Revoke execute from
`public` and from `anon`. Grant execute to `authenticated`, and grant
that role usage on schema `private`.

A third helper, `private.trip_owner_id(trip_id uuid) returns uuid`, is
`security definer` with the same grants. Storage policies use it to
check that the first folder is the trip's owner. It does not change in
spec 15.

Do not use `user_metadata` or `auth.jwt()` for any of these checks.

A `before update` trigger on `trips` rejects a change to `user_id`. An
editor must be able to update the header later without being able to
hand the trip to someone else. The update policy must not repeat
`user_id = auth.uid()`, or that editor's save fails.

### Creating a trip

`public.create_trip` inserts the trip and one `itinerary_days` row per
date, from `start_date` through `end_date` inclusive, in one
transaction. It returns the new trip id.

Arguments: title, source, destination, start date, end date, description,
traveler count, image path, and an optional list of activities (day
number, start time, end time, place, activity, note). The list defaults to empty. The
function writes those as `itinerary_activities` rows before it returns.
The list is an argument, not a column. Days are still rows.

`security invoker`, so the inserts pass through RLS. `user_id` is
`auth.uid()`. Revoke execute from `public` and `anon`. Grant it to
`authenticated`.

Spec 4 calls it with no activities. Spec 6 and spec 12 call it with
activities. None of them insert the trip and the days as separate
requests from the phone. Spec 12 adds a `status` argument when that
column exists. Do not add `status` here. Adding that argument is a new
function unless the old one is dropped first. Spec 12 drops this
signature before creating the replacement, so PostgREST never sees two.

### Row-level security

Enable RLS on `trips`, `itinerary_days`, and `itinerary_activities` in
the same migration. Policies are `to authenticated`. Separate policies
per command. An update has both `using` and `with check`.

`trips`:

- **select** — `(select auth.uid()) = user_id or (select private.can_access_trip(id))`.
  The `or` is what makes `insert … returning` work. `can_access_trip`
  is `stable` and looks the row up in `trips`, so it cannot see the row
  this statement just inserted. The owner check can. A member still
  passes through the function once the row is committed. Without the
  owner check, `create_trip` and any `.insert().select()` fail as a
  row-level security violation
- **update** — `(select private.can_edit_trip(id))`, including `with check`
- **delete** — `user_id = (select auth.uid())`. Owner only. An editor
  who can update the header still cannot delete the trip
- **insert** — `with check ((select auth.uid()) = user_id)`. The row
  does not exist yet, so `can_edit_trip` cannot be the insert check.
  The trigger, not this check, is what stops `user_id` changing later

`itinerary_days`:

- **select** — `(select private.can_access_trip(trip_id))`
- **insert, update, delete** — `(select private.can_edit_trip(trip_id))`.
  Update's `with check` uses the same expression, so a day cannot be
  moved onto a trip the user cannot edit

`itinerary_activities` has no `trip_id`. The policy looks up the day's
trip and then calls the read function or the edit function:

```sql
exists (
  select 1 from public.itinerary_days as days
  where days.id = itinerary_activities.day_id
    and (select private.can_access_trip(days.trip_id))
)
```

Use `can_access_trip` for select. Use `can_edit_trip` in that same
shape for insert (`with check`), update (`using` and `with check`),
and delete.

No policy for `anon`. A table with RLS on and no matching policy returns
nothing.

`profiles` already works without an extra `grant`. New tables in
`public` should behave the same way. If the Data API does not expose
them, grant `select, insert, update, delete` to `authenticated` in this
migration. Do not grant those privileges to `anon`.

### Storage buckets

Two **private** buckets, created in the same migration:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('documents', 'documents', false, 20971520,
    array['application/pdf', 'image/jpeg', 'image/png']);
```

`images` is the cover and, later, the gallery. 10 MB. `documents` is for
a ticket file that no screen uploads yet. 20 MB. Both limits sit under
the 50 MB Free-plan global cap.

Private means a URL is not enough to download the file. Do not insert
object rows by SQL. `storage.objects` already has RLS. Add policies. Do
not turn RLS off.

Every object path starts with the owner's id, then the trip id:

```text
{user_id}/{trip_id}/{filename}
```

Policies on `storage.objects`, `to authenticated`, for select, insert,
update, and delete. Insert and update need `with check`. Select and
update are both required or a later upsert silently fails.

Trip files use the two functions, so spec 15 does not rewrite these
policies. The first folder is the owner's id, from
`private.trip_owner_id`. The second folder is the trip id. Select calls
`can_access_trip`. Insert, update, and delete call `can_edit_trip`. A
path whose second folder is not a trip id does not match this policy.
Do not cast it blindly. A helper that returns null for a non-uuid is
the way to avoid an error that fails the whole request.

Avatars are a separate policy: first folder is `auth.uid()`, second
folder is `avatar`. That is what spec 10 uploads. Reading someone
else's avatar is spec 15, as its own select policy.

There is no foreign key from storage to `trips`. Spec 5 removes the
objects when a trip is deleted.

### Generated types

After the migration is applied, regenerate Database types into the
existing `types/database.types.ts`. Do not hand-write interfaces that copy these tables.

### Out of scope

- Any screen, navigation change, or upload button
- `jsonb` for a day's stops
- Bookings, packing, photo rows, notes, explore plans, chat, saved
  places, members, and `trips.status`
- Interest tags on `profiles`
- Profile editing, password reset, account deletion
- AI
- A trigger that deletes storage objects when a trip is deleted. The
  app does that in spec 5
- Making either bucket public

## Verification

Per @context/ai-interaction.md section B. There is no new screen, so
section A does not apply beyond "the existing app still opens."

As user A, signed in:

- `create_trip` from the start date through the end date returns one
  trip and one day per date, including both ends. The activities
  argument writes those rows in the same call
- Insert a trip and read it back in the same call. `insert … returning`
  and `.insert().select()` both return the new row. They must not come
  back as a row-level security error
- A second user cannot delete the owner's trip. The owner can
- A `create_trip` that fails a check leaves no trip and no days
- Updating a trip cannot change `user_id`
- `can_access_trip` and `can_edit_trip` agree for the owner, and both
  are false for everyone else
- Insert a trip, a day, and an activity. The foreign keys are right
- Update and delete the activity, then the day, then the trip. Deleting
  the trip removes its days and activities
- `end_date` before `start_date` is rejected
- A description longer than 200 characters is rejected
- `traveler_count` of 0 is rejected
- Two days with the same `day_number` on one trip are rejected
- Upload one image and one PDF to `{user A}/{trip id}/…`. Download works
- Upload into `{user B}/…`, or into any other bucket, is rejected
- Replace (upsert) a file the user owns

As user B:

- Selects on `trips`, `itinerary_days`, and `itinerary_activities` return
  nothing of user A's
- User B cannot update or delete user A's trip

With the publishable key and no session:

- Selects return no rows
- Uploads are rejected
- The image URL does not serve the file

Also:

- A new email sign-up still creates exactly one `profiles` row
- `private.can_access_trip` is not callable by `anon`
- `npx tsc --noEmit` passes if `types/database.types.ts` changed
- Supabase security and performance advisors report nothing new on these
  tables

## Notes

- Bucket ids are lowercase `images` and `documents`
- `(select auth.uid())` is the policy form. A bare `auth.uid()` runs
  once per row
- The function lives in `private` because a `security definer` function
  in `public` is callable by every role unless someone remembers to
  revoke it

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- @context/ai-interaction.md — section B
- `supabase/migrations/0001_profiles.sql`
- Storage buckets: https://supabase.com/docs/guides/storage/buckets/creating-buckets
- Storage access control: https://supabase.com/docs/guides/storage/security/access-control
