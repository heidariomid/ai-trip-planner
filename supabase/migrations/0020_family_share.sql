-- Spec 15: a trip is shared with a code. The owner stays `trips.user_id`;
-- everyone else is a row in `trip_members`. The table policies from spec 2
-- already ask `private.can_access_trip` and `private.can_edit_trip`, so this
-- replaces those two bodies and adds no second policy to any trip table.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  constraint trip_members_role_check check (role in ('editor', 'viewer')),
  -- Also serves lookups by trip_id, so there is no separate index for it.
  constraint trip_members_trip_id_user_id_key unique (trip_id, user_id)
);

create index trip_members_user_id_idx on public.trip_members (user_id);

-- Its own table and not a column on `trips`: every viewer can read the trip
-- row, and only the owner may read the code.
create table public.trip_join_codes (
  trip_id uuid primary key references public.trips (id) on delete cascade,
  code text not null,
  updated_at timestamptz not null default now(),
  constraint trip_join_codes_code_key unique (code),
  -- Eight characters, none of which is mistaken for another: no 0, O, 1, or I.
  constraint trip_join_codes_code_check check (code ~ '^[A-HJ-NP-Z2-9]{8}$')
);

revoke all on public.trip_members, public.trip_join_codes from anon, authenticated;

-- No insert: a member row is only ever written by join_trip.
grant select, delete on public.trip_members to authenticated;
grant update (role) on public.trip_members to authenticated;
-- No write: a code is only ever written by rotate_trip_code.
grant select on public.trip_join_codes to authenticated;

-- ---------------------------------------------------------------------------
-- Who can touch a trip
-- ---------------------------------------------------------------------------

-- Same signatures as spec 2, so every policy that calls them keeps working.
create or replace function private.can_access_trip(trip_id uuid)
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
  )
  or exists (
    select 1
    from public.trip_members as members
    where members.trip_id = can_access_trip.trip_id
      and members.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_trip(trip_id uuid)
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
  )
  or exists (
    select 1
    from public.trip_members as members
    where members.trip_id = can_edit_trip.trip_id
      and members.user_id = (select auth.uid())
      and members.role = 'editor'
  );
$$;

-- True when the caller and the other user are on at least one trip together,
-- either of them as its owner or as a member. Used to show a member's avatar.
create function private.shares_trip_with(other_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.trips
    where (
        trips.user_id = (select auth.uid())
        or exists (
          select 1 from public.trip_members as mine
          where mine.trip_id = trips.id and mine.user_id = (select auth.uid())
        )
      )
      and (
        trips.user_id = shares_trip_with.other_id
        or exists (
          select 1 from public.trip_members as theirs
          where theirs.trip_id = trips.id and theirs.user_id = shares_trip_with.other_id
        )
      )
  );
$$;

revoke execute on function private.shares_trip_with(uuid) from public, anon;
grant execute on function private.shares_trip_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.trip_members enable row level security;
alter table public.trip_join_codes enable row level security;

create policy "Trip members can read the member list"
  on public.trip_members
  for select
  to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Only the owner can change a member's role"
  on public.trip_members
  for update
  to authenticated
  using ((select private.trip_owner_id(trip_id)) = (select auth.uid()))
  with check ((select private.trip_owner_id(trip_id)) = (select auth.uid()));

-- The owner removes anyone; a member removes only themselves, which is leaving.
create policy "The owner can remove a member and a member can leave"
  on public.trip_members
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.trip_owner_id(trip_id)) = (select auth.uid())
  );

create policy "Only the owner can read the join code"
  on public.trip_join_codes
  for select
  to authenticated
  using ((select private.trip_owner_id(trip_id)) = (select auth.uid()));

-- Avatars live at {user id}/avatar/{filename}. Spec 2 lets a user read their
-- own; this lets them read the avatar of someone they share a trip with.
create policy "Trip members can read each other's avatars"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[2] = 'avatar'
    and private.shares_trip_with(private.try_uuid((storage.foldername(name))[1]))
  );

-- ---------------------------------------------------------------------------
-- The join code
-- ---------------------------------------------------------------------------

-- 32 characters, so one random byte maps onto them with no bias.
create function private.new_join_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(bytes.value, position) % 32) + 1, 1),
    ''
  )
  from (select extensions.gen_random_bytes(8) as value) as bytes,
    generate_series(0, 7) as position;
$$;

revoke execute on function private.new_join_code() from public, anon, authenticated;

-- Makes the trip's code, or replaces it, which is what stops the old one
-- working. Definer, because no client role may write the table.
create function public.rotate_trip_code(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
begin
  if not exists (
    select 1 from public.trips
    where trips.id = p_trip_id and trips.user_id = (select auth.uid())
  ) then
    raise exception 'Only the owner can share this trip' using errcode = '42501';
  end if;

  loop
    new_code := private.new_join_code();
    begin
      insert into public.trip_join_codes (trip_id, code)
      values (p_trip_id, new_code)
      on conflict (trip_id) do update
        set code = excluded.code, updated_at = now();
      return new_code;
    exception when unique_violation then
      -- Another trip already has this code. Make another.
      null;
    end;
  end loop;
end;
$$;

revoke execute on function public.rotate_trip_code(uuid) from public, anon;
grant execute on function public.rotate_trip_code(uuid) to authenticated;

-- Definer, because the joiner cannot read the trip or the code yet. An unknown
-- code and a code for the caller's own trip fail the same way, so a guess
-- learns nothing. Someone already on the trip gets its id back, role untouched.
create function public.join_trip(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  clean_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  found_trip_id uuid;
begin
  if caller_id is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select codes.trip_id into found_trip_id
  from public.trip_join_codes as codes
  join public.trips on trips.id = codes.trip_id
  where codes.code = clean_code
    and trips.user_id <> caller_id;

  if found_trip_id is null then
    raise exception 'That code does not work' using errcode = 'P0001';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (found_trip_id, caller_id, 'viewer')
  on conflict (trip_id, user_id) do nothing;

  return found_trip_id;
end;
$$;

revoke execute on function public.join_trip(text) from public, anon;
grant execute on function public.join_trip(text) to authenticated;

-- ---------------------------------------------------------------------------
-- The people on a trip
-- ---------------------------------------------------------------------------

-- Definer, so `profiles` keeps its own-row policy. Nothing comes back unless
-- the caller is on the trip, and an email never does.
create function public.trip_people(p_trip_id uuid)
returns table (
  id uuid,
  full_name text,
  avatar_path text,
  avatar_url text,
  role text,
  is_you boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select people.id, people.full_name, people.avatar_path, people.avatar_url,
    people.role, people.id = (select auth.uid())
  from (
    select profiles.id, profiles.full_name, profiles.avatar_path, profiles.avatar_url,
      'owner'::text as role, 0 as rank, trips.created_at as joined_at
    from public.trips
    join public.profiles on profiles.id = trips.user_id
    where trips.id = p_trip_id

    union all

    select profiles.id, profiles.full_name, profiles.avatar_path, profiles.avatar_url,
      members.role, 1 as rank, members.created_at as joined_at
    from public.trip_members as members
    join public.profiles on profiles.id = members.user_id
    where members.trip_id = p_trip_id
  ) as people
  where (select private.can_access_trip(p_trip_id))
  order by people.rank, people.joined_at;
$$;

revoke execute on function public.trip_people(uuid) from public, anon;
grant execute on function public.trip_people(uuid) to authenticated;
