-- Spec 8: the packing list. One row per thing to pack, hanging off a trip.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

-- A category is whatever the traveller typed, not a row in a second table: a
-- category with no items left simply stops existing.
create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category text not null,
  label text not null,
  is_packed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint packing_items_category_check
    check (btrim(category) <> '' and char_length(category) <= 40),
  constraint packing_items_label_check
    check (btrim(label) <> '' and char_length(label) <= 80)
);

create index packing_items_trip_id_idx on public.packing_items (trip_id);

-- ---------------------------------------------------------------------------
-- Access: the same two functions as the itinerary
-- ---------------------------------------------------------------------------

-- A new table in public is granted to anon and authenticated by default in
-- this project, so the grants are taken away and only the four verbs come back.
revoke all on public.packing_items from anon, authenticated;

grant select, insert, update, delete on public.packing_items to authenticated;

alter table public.packing_items enable row level security;

create policy "Trip members can read packing items"
  on public.packing_items for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add packing items"
  on public.packing_items for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update packing items"
  on public.packing_items for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete packing items"
  on public.packing_items for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));
