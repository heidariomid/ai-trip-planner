-- Trips, their days and activities, and the two private Storage buckets.
-- Access is decided by two functions in `private`, so family sharing (spec 15)
-- replaces two function bodies instead of rewriting every policy.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  source text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  image_path text,
  description text,
  traveler_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_check check (end_date >= start_date),
  constraint trips_traveler_count_check check (traveler_count > 0),
  constraint trips_description_length_check
    check (description is null or char_length(description) <= 200)
);

create index trips_user_id_idx on public.trips (user_id);

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number integer not null,
  date date,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_days_day_number_check check (day_number > 0),
  -- Also serves lookups by trip_id, so there is no separate index for it.
  constraint itinerary_days_trip_id_day_number_key unique (trip_id, day_number)
);

create table public.itinerary_activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.itinerary_days (id) on delete cascade,
  sort_order integer not null default 0,
  starts_at time,
  place text,
  activity text,
  notes text,
  created_at timestamptz not null default now()
);

create index itinerary_activities_day_id_idx on public.itinerary_activities (day_id);

grant select, insert, update, delete
  on public.trips, public.itinerary_days, public.itinerary_activities
  to authenticated;

-- ---------------------------------------------------------------------------
-- Who can touch a trip
-- ---------------------------------------------------------------------------

-- Definer, so reading `trips` here does not re-enter the trips policies.
-- Both bodies are owner-only until spec 15; the signatures must not change.
create function private.can_access_trip(trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = can_access_trip.trip_id
      and trips.user_id = (select auth.uid())
  );
$$;

create function private.can_edit_trip(trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = can_edit_trip.trip_id
      and trips.user_id = (select auth.uid())
  );
$$;

-- Storage paths start with the owner's id, not the caller's. Stays as is in spec 15.
create function private.trip_owner_id(trip_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select trips.user_id
  from public.trips
  where trips.id = trip_owner_id.trip_id;
$$;

-- A blind `::uuid` cast on a folder name raises and fails the whole Storage
-- request. This returns null instead, so the policy simply does not match.
create function private.try_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  if value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return value::uuid;
  end if;
  return null;
end;
$$;

-- The update policy deliberately does not pin user_id, so that an editor can
-- save the trip in spec 15. This trigger is what keeps ownership fixed.
create function private.prevent_trip_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'The owner of a trip cannot be changed'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger trips_prevent_owner_change
  before update on public.trips
  for each row
  execute function private.prevent_trip_owner_change();

revoke execute on function
  private.can_access_trip(uuid),
  private.can_edit_trip(uuid),
  private.trip_owner_id(uuid),
  private.try_uuid(text),
  private.prevent_trip_owner_change()
  from public, anon;

grant usage on schema private to authenticated;

grant execute on function
  private.can_access_trip(uuid),
  private.can_edit_trip(uuid),
  private.trip_owner_id(uuid),
  private.try_uuid(text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.trips enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.itinerary_activities enable row level security;

-- The owner check is not redundant: can_access_trip is stable and cannot see
-- the row the same statement just inserted, so `insert … returning` needs it.
create policy "Trip members can read the trip"
  on public.trips
  for select
  to authenticated
  using ((select auth.uid()) = user_id or (select private.can_access_trip(id)));

create policy "Users can create their own trips"
  on public.trips
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Trip editors can update the trip"
  on public.trips
  for update
  to authenticated
  using ((select private.can_edit_trip(id)))
  with check ((select private.can_edit_trip(id)));

create policy "Only the owner can delete the trip"
  on public.trips
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Trip members can read days"
  on public.itinerary_days
  for select
  to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add days"
  on public.itinerary_days
  for insert
  to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update days"
  on public.itinerary_days
  for update
  to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete days"
  on public.itinerary_days
  for delete
  to authenticated
  using ((select private.can_edit_trip(trip_id)));

-- Activities have no trip_id; every policy reaches the trip through the day.
create policy "Trip members can read activities"
  on public.itinerary_activities
  for select
  to authenticated
  using (
    exists (
      select 1 from public.itinerary_days as days
      where days.id = itinerary_activities.day_id
        and (select private.can_access_trip(days.trip_id))
    )
  );

create policy "Trip editors can add activities"
  on public.itinerary_activities
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.itinerary_days as days
      where days.id = itinerary_activities.day_id
        and (select private.can_edit_trip(days.trip_id))
    )
  );

create policy "Trip editors can update activities"
  on public.itinerary_activities
  for update
  to authenticated
  using (
    exists (
      select 1 from public.itinerary_days as days
      where days.id = itinerary_activities.day_id
        and (select private.can_edit_trip(days.trip_id))
    )
  )
  with check (
    exists (
      select 1 from public.itinerary_days as days
      where days.id = itinerary_activities.day_id
        and (select private.can_edit_trip(days.trip_id))
    )
  );

create policy "Trip editors can delete activities"
  on public.itinerary_activities
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.itinerary_days as days
      where days.id = itinerary_activities.day_id
        and (select private.can_edit_trip(days.trip_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Creating a trip
-- ---------------------------------------------------------------------------

-- Invoker, so every insert below still passes through the policies above.
-- p_activities is a JSON array of { day_number, starts_at, place, activity, notes }.
create function public.create_trip(
  p_title text,
  p_source text,
  p_destination text,
  p_start_date date,
  p_end_date date,
  p_description text default null,
  p_traveler_count integer default 1,
  p_image_path text default null,
  p_activities jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_trip_id uuid;
  expected_activities integer := jsonb_array_length(coalesce(p_activities, '[]'::jsonb));
  written_activities integer;
begin
  insert into public.trips (
    user_id, title, source, destination, start_date, end_date,
    description, traveler_count, image_path
  )
  values (
    (select auth.uid()), p_title, p_source, p_destination, p_start_date, p_end_date,
    p_description, p_traveler_count, p_image_path
  )
  returning id into new_trip_id;

  insert into public.itinerary_days (trip_id, day_number, date)
  select new_trip_id, day_offset + 1, p_start_date + day_offset
  from generate_series(0, p_end_date - p_start_date) as day_offset;

  insert into public.itinerary_activities (day_id, sort_order, starts_at, place, activity, notes)
  select
    days.id,
    (item.position - 1)::integer,
    (item.value ->> 'starts_at')::time,
    item.value ->> 'place',
    item.value ->> 'activity',
    item.value ->> 'notes'
  from jsonb_array_elements(coalesce(p_activities, '[]'::jsonb))
    with ordinality as item (value, position)
  join public.itinerary_days as days
    on days.trip_id = new_trip_id
   and days.day_number = (item.value ->> 'day_number')::integer;

  get diagnostics written_activities = row_count;

  -- An activity pointing at a day outside the trip would otherwise vanish in the join.
  if written_activities <> expected_activities then
    raise exception 'An activity refers to a day that is not part of the trip'
      using errcode = '22023';
  end if;

  return new_trip_id;
end;
$$;

revoke execute on function
  public.create_trip(text, text, text, date, date, text, integer, text, jsonb)
  from public, anon;

grant execute on function
  public.create_trip(text, text, text, date, date, text, integer, text, jsonb)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('documents', 'documents', false, 20971520,
    array['application/pdf', 'image/jpeg', 'image/png']);

-- Trip files live at {owner id}/{trip id}/{filename}. Select and update are
-- both needed, or an upsert of an existing file fails without an error.
create policy "Trip members can read trip files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('images', 'documents')
    and (storage.foldername(name))[1]
      = private.trip_owner_id(private.try_uuid((storage.foldername(name))[2]))::text
    and private.can_access_trip(private.try_uuid((storage.foldername(name))[2]))
  );

create policy "Trip editors can upload trip files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('images', 'documents')
    and (storage.foldername(name))[1]
      = private.trip_owner_id(private.try_uuid((storage.foldername(name))[2]))::text
    and private.can_edit_trip(private.try_uuid((storage.foldername(name))[2]))
  );

create policy "Trip editors can replace trip files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('images', 'documents')
    and (storage.foldername(name))[1]
      = private.trip_owner_id(private.try_uuid((storage.foldername(name))[2]))::text
    and private.can_edit_trip(private.try_uuid((storage.foldername(name))[2]))
  )
  with check (
    bucket_id in ('images', 'documents')
    and (storage.foldername(name))[1]
      = private.trip_owner_id(private.try_uuid((storage.foldername(name))[2]))::text
    and private.can_edit_trip(private.try_uuid((storage.foldername(name))[2]))
  );

create policy "Trip editors can delete trip files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('images', 'documents')
    and (storage.foldername(name))[1]
      = private.trip_owner_id(private.try_uuid((storage.foldername(name))[2]))::text
    and private.can_edit_trip(private.try_uuid((storage.foldername(name))[2]))
  );

-- Avatars live at {user id}/avatar/{filename}. Reading someone else's is spec 15.
create policy "Users can read their own avatar"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'avatar'
  );

create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'avatar'
  );

create policy "Users can replace their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'avatar'
  )
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'avatar'
  );

create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'avatar'
  );
