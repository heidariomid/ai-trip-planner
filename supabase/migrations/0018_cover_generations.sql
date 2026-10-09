-- Spec 13: a daily cap on AI cover generations. The picture itself comes from
-- Cloudflare Workers AI through the trip-cover Edge Function.

-- ---------------------------------------------------------------------------
-- A daily cap on cover generations
-- ---------------------------------------------------------------------------

-- The model's free allowance is shared by every user of the app. Like
-- chat_usage and place_usage, only the functions below touch this, so the app
-- can neither read it nor wind it back.
create table public.cover_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  request_count integer not null default 0,
  primary key (user_id, day)
);

revoke all on public.cover_usage from anon, authenticated;

-- No policy and no grant: nothing but the definer functions reach it.
alter table public.cover_usage enable row level security;

-- Counts one generation for the caller on today's UTC date. Returns how many
-- are left inside p_limit after this one, or -1 when the cap was already
-- reached and nothing was counted. The Edge Function passes its own constant.
create function public.consume_cover_generation(p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if p_limit is null or p_limit < 1 then
    return -1;
  end if;

  insert into public.cover_usage as usage (user_id, day, request_count)
  values (v_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set request_count = usage.request_count + 1
    where usage.request_count < p_limit
  returning usage.request_count into v_count;

  if v_count is null then
    return -1;
  end if;
  return p_limit - v_count;
end;
$$;

revoke execute on function public.consume_cover_generation(integer) from public, anon;
grant execute on function public.consume_cover_generation(integer) to authenticated;

-- How many generations the caller has used today, so the form can say how many
-- are left before the traveller spends one.
create function public.cover_generations_used()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select usage.request_count into v_count
  from public.cover_usage as usage
  where usage.user_id = v_user_id
    and usage.day = (now() at time zone 'utc')::date;

  return coalesce(v_count, 0);
end;
$$;

revoke execute on function public.cover_generations_used() from public, anon;
grant execute on function public.cover_generations_used() to authenticated;
