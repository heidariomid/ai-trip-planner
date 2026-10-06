# Current Feature: Spec 2 — Database and Storage

## Status

Not Started

## Goals

- One new migration, `supabase/migrations/0002_trips_itinerary_storage.sql`,
  applied to the remote project so the history matches the file.
  `0001_profiles.sql` is not edited
- `trips`, `itinerary_days`, and `itinerary_activities` exist with the
  columns, checks, indexes, and cascades in the spec
- `private.can_access_trip`, `private.can_edit_trip`, and
  `private.trip_owner_id` exist, are `security definer`, and are not
  callable by `anon`
- `public.create_trip` writes the trip, one day per date (both ends
  included), and any activities passed in, in one transaction, and
  returns the trip id
- A `before update` trigger on `trips` rejects a change to `user_id`
- RLS is on for all three tables, with a separate policy per command,
  `to authenticated`, and nothing for `anon`
- Two private buckets, `images` (10 MB) and `documents` (20 MB), with
  `storage.objects` policies for trip files and for avatars
- A signed-in user can create, read, update, and delete their own trip,
  its days, and its activities
- A second user sees none of those rows and cannot update or delete them
- Each user can store a file only under `{user_id}/{trip_id}/…`
- Database types are generated, not hand-written
- No screen changes. The existing app still opens

## Notes

Spec: @context/features/spec2-database-and-storage.md. Depends on spec 1,
which is done.

- **No screens.** Section A of @context/ai-interaction.md reduces to "the
  existing app still opens". Section B is the real verification
- **`can_access_trip` and `can_edit_trip` have the same body here**: a
  row in `trips` with that id and `user_id = (select auth.uid())`. Spec
  15 replaces the bodies and keeps the signatures
- **The `trips` select policy needs the owner check as well as the
  function.** `can_access_trip` is `stable` and cannot see the row the
  same statement just inserted, so without
  `(select auth.uid()) = user_id` every `insert … returning` fails as a
  row-level security violation
- **The `trips` update policy must not repeat `user_id = auth.uid()`.**
  The trigger is what stops `user_id` changing. Repeating the check
  would break an editor's save in spec 15
- **Delete on `trips` is owner-only**, `user_id = (select auth.uid())`,
  not `can_edit_trip`
- `itinerary_activities` has no `trip_id`. Its policies go through the
  day with an `exists` subquery
- `create_trip` is `security invoker`, so its inserts pass through RLS.
  No `status` argument. Spec 12 drops this signature before adding one
- Storage paths are `{user_id}/{trip_id}/{filename}`. The second folder
  must go through a helper that returns null for a non-uuid. A blind
  cast fails the whole request
- Avatars are a separate policy: first folder `auth.uid()`, second
  folder `avatar`
- Storage needs both select and update policies, or a later upsert
  fails silently
- `updated_at` is an insert default only. No bump trigger
- Use `(select auth.uid())` in policies. No `user_metadata` and no
  `auth.jwt()`
- Deleting a trip does not delete its Storage objects. That is spec 5
- If the Data API does not expose the new tables, grant
  `select, insert, update, delete` to `authenticated` in this migration.
  Never to `anon`
- Verification needs two real users, plus a pass with the publishable
  key and no session. Finish with the Supabase security and performance
  advisors

Decided before `start`:

- Types are regenerated into the existing `types/database.types.ts`, so
  there is one types file. The spec originally said `types/database.ts`

Out of scope: any screen or upload button, `jsonb` for a day's stops,
bookings, packing, photo rows, notes, explore plans, chat, saved places,
members, `trips.status`, interest tags, profile editing, AI, a trigger
that deletes storage objects, and making either bucket public.

## History

- Init — `blank-typescript` Expo app, single placeholder screen
- Adopted the bakery project's context workflow: `context/` docs, the
  `/feature` skill, and the cleanup rule, adapted from a Next.js/Payload
  web app to an Expo/React Native app with Supabase
- Expo Router migration — `main` is `expo-router/entry`, `App.tsx` and
  `index.ts` deleted, `app/_layout.tsx` + `app/index.tsx` added, `scheme`
  and `typedRoutes` in `app.json`. Verified on the iPhone 17 simulator:
  bundles clean and the route renders
- `.env` and `.env.example` created with empty values, using
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Adopted Tailwind via NativeWind 4.2.7 as the styling system for the
  whole project, replacing `StyleSheet.create`. The sign-in and sign-up
  screens in this phase are the first real test of it
- chore: add context workflow and phase 1 auth spec
- feat: migrate to Expo Router and adopt Tailwind via NativeWind
- feat: add Supabase email and Google auth
