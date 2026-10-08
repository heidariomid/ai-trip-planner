-- Spec 9: a trip's photo gallery and its notes.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- A gallery photo is a file in the private `images` bucket, under the same
-- `{owner_id}/{trip_id}/` folder as the cover. The cover is not a row here.
create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now(),
  constraint trip_photos_image_path_key unique (image_path),
  constraint trip_photos_image_path_check check (btrim(image_path) <> ''),
  constraint trip_photos_caption_length_check
    check (caption is null or char_length(caption) <= 120)
);

create index trip_photos_trip_id_idx on public.trip_photos (trip_id);

-- A list of short notes, not one long field.
create table public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint trip_notes_body_check
    check (btrim(body) <> '' and char_length(body) <= 500)
);

create index trip_notes_trip_id_idx on public.trip_notes (trip_id);

-- ---------------------------------------------------------------------------
-- Access: the same two functions as the itinerary
-- ---------------------------------------------------------------------------

-- A new table in public is granted to anon and authenticated by default in
-- this project, so the grants are taken away and only the four verbs come back.
revoke all on public.trip_photos, public.trip_notes from anon, authenticated;

grant select, insert, update, delete
  on public.trip_photos, public.trip_notes
  to authenticated;

alter table public.trip_photos enable row level security;
alter table public.trip_notes enable row level security;

create policy "Trip members can read photos"
  on public.trip_photos for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add photos"
  on public.trip_photos for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update photos"
  on public.trip_photos for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete photos"
  on public.trip_photos for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));

create policy "Trip members can read notes"
  on public.trip_notes for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add notes"
  on public.trip_notes for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update notes"
  on public.trip_notes for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete notes"
  on public.trip_notes for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));
