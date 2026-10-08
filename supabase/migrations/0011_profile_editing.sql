-- Spec 10: the traveller edits their own profile. A name, an avatar of their
-- own, and interest tags the assistant will read in spec 11.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

-- avatar_url keeps the public picture a Google sign-in brought with it.
-- avatar_path is a private Storage path and is shown first when it is set.
alter table public.profiles
  add column avatar_path text,
  add column interests text[];

-- A name can still be null, for a sign-up that brought none. It cannot be
-- blank, and it cannot be longer than the form allows.
alter table public.profiles
  add constraint profiles_full_name_check
    check (full_name is null or (btrim(full_name) <> '' and char_length(full_name) <= 60)),
  -- Spec 2's avatar policy only lets a user write under their own avatar
  -- folder. This keeps the row from pointing anywhere else.
  add constraint profiles_avatar_path_check
    check (avatar_path is null or avatar_path like id::text || '/avatar/%'),
  -- A fixed list, because spec 11 puts these words into the system prompt.
  -- Adding a tag means a new migration.
  add constraint profiles_interests_check
    check (
      interests is null
      or (
        cardinality(interests) <= 6
        and interests <@ array[
          'food', 'nature', 'architecture', 'history', 'art', 'beaches',
          'hiking', 'nightlife', 'shopping', 'museums', 'family', 'adventure'
        ]::text[]
      )
    );

-- ---------------------------------------------------------------------------
-- Access: three columns, not the whole row
-- ---------------------------------------------------------------------------

-- Until now authenticated could update every column of its own row, email
-- included, and both roles held insert and delete that no policy allowed.
revoke all on public.profiles from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_path, interests) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at follows every change
-- ---------------------------------------------------------------------------

create function private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.touch_profile_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function private.touch_profile_updated_at();

-- ---------------------------------------------------------------------------
-- Sign-up must not trip the new name rule
-- ---------------------------------------------------------------------------

-- A provider can send a blank name or a very long one. Either would fail the
-- check above and the sign-up with it, so the trigger trims the name to fit.
-- create or replace keeps the revoked execute from 0004.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(
      btrim(
        left(
          btrim(
            coalesce(
              new.raw_user_meta_data ->> 'full_name',
              new.raw_user_meta_data ->> 'name'
            )
          ),
          60
        )
      ),
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;
