-- Spec 12 addition (user request, 2026-10-09): real place photos in the chat,
-- looked up through Google Places from an Edge Function.

-- ---------------------------------------------------------------------------
-- A daily cap on place lookups
-- ---------------------------------------------------------------------------

-- Every lookup is a paid request to Google. Like chat_usage, only the function
-- below writes this, so the app can neither read it nor wind it back.
create table public.place_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  request_count integer not null default 0,
  primary key (user_id, day)
);

revoke all on public.place_usage from anon, authenticated;

-- No policy and no grant: nothing but the definer function reaches it.
alter table public.place_usage enable row level security;

-- Counts one lookup for the caller on today's UTC date and says whether it is
-- still inside p_limit. The Edge Function passes its own constant.
create function public.consume_place_lookup(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_allowed boolean;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_limit is null or p_limit < 1 then
    return false;
  end if;

  insert into public.place_usage as usage (user_id, day, request_count)
  values (v_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set request_count = usage.request_count + 1
    where usage.request_count < p_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.consume_place_lookup(integer) from public, anon;
grant execute on function public.consume_place_lookup(integer) to authenticated;
