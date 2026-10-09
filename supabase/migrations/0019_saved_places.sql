-- Spec 14: saved places. A heart on a place card in the chat keeps the place,
-- and Profile opens the list.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

-- A place is words, not a location: its name, the one line the assistant gave
-- it, and the city it was recommended for. There is no picture column; a photo
-- is looked up by name when a card needs one. The limits on name and label are
-- the ones the chat function puts on a place card.
create table public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  label text not null default '',
  city text not null default '',
  created_at timestamptz not null default now(),
  constraint saved_places_name_check
    check (btrim(name) <> '' and char_length(name) <= 80),
  constraint saved_places_label_check check (char_length(label) <= 160),
  constraint saved_places_city_check check (char_length(city) <= 120)
);

-- The same name in two cities is two places. A second heart on the same one
-- finds this row instead of adding another. It also serves the list by user.
create unique index saved_places_user_place_key
  on public.saved_places (user_id, lower(name), lower(city));

-- ---------------------------------------------------------------------------
-- Access: a traveller's own rows only
-- ---------------------------------------------------------------------------

revoke all on public.saved_places from anon, authenticated;

-- No update: a saved place is added or removed, never edited.
grant select, insert, delete on public.saved_places to authenticated;

alter table public.saved_places enable row level security;

create policy "Travellers can read their saved places"
  on public.saved_places for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Travellers can save a place"
  on public.saved_places for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Travellers can remove a saved place"
  on public.saved_places for delete to authenticated
  using ((select auth.uid()) = user_id);
