-- Spec 19: how many visits and sign-ups each shared link brought, per UTC day.
-- A row is a total. It has no user, no address, and no browser, so it cannot
-- be traced back to a person. The list of sources is the same one in
-- lib/traffic.ts. Anything else is stored as direct.

-- ---------------------------------------------------------------------------
-- Daily totals per shared link
-- ---------------------------------------------------------------------------

create table public.traffic_daily (
  day date not null,
  source text not null,
  visits integer not null default 0,
  sign_ups integer not null default 0,
  primary key (day, source),
  constraint traffic_daily_source_check check (
    source in (
      'producthunt',
      'hackernews',
      'reddit-reactnative',
      'reddit-expo',
      'reddit-supabase',
      'reddit-sideproject',
      'discord-expo',
      'discord-supabase',
      'linkedin',
      'devto',
      'x',
      'peerlist',
      'indiehackers',
      'startupmap',
      'github',
      'resume',
      'direct'
    )
  ),
  constraint traffic_daily_counts_check check (visits >= 0 and sign_ups >= 0)
);

revoke all on public.traffic_daily from anon, authenticated;

-- No policy and no grant: nothing but the definer functions below reaches it.
alter table public.traffic_daily enable row level security;

-- Maps a tag from a shared link onto the fixed list. Unknown, blank, and null
-- all become direct, so a caller cannot fill the table with invented names.
create function private.traffic_source(p_source text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_source in (
      'producthunt',
      'hackernews',
      'reddit-reactnative',
      'reddit-expo',
      'reddit-supabase',
      'reddit-sideproject',
      'discord-expo',
      'discord-supabase',
      'linkedin',
      'devto',
      'x',
      'peerlist',
      'indiehackers',
      'startupmap',
      'github',
      'resume',
      'direct'
    ) then p_source
    else 'direct'
  end;
$$;

revoke all on function private.traffic_source(text) from public, anon, authenticated;

-- One visit for today. Open to a signed-out caller, because the landing page
-- counts before anyone has an account. A failure in the app is ignored.
create function public.record_visit(p_source text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text := private.traffic_source(p_source);
begin
  insert into public.traffic_daily as traffic (day, source, visits)
  values ((now() at time zone 'utc')::date, v_source, 1)
  on conflict (day, source) do update
    set visits = traffic.visits + 1;
end;
$$;

revoke all on function public.record_visit(text) from public;
grant execute on function public.record_visit(text) to anon, authenticated;

-- One sign-up for today. Open only to a signed-in caller, and it writes
-- nothing when there is no user, so a sign-in cannot be turned into a sign-up
-- by calling this with the anon key.
create function public.record_sign_up(p_source text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source text := private.traffic_source(p_source);
begin
  if (select auth.uid()) is null then
    return;
  end if;

  insert into public.traffic_daily as traffic (day, source, sign_ups)
  values ((now() at time zone 'utc')::date, v_source, 1)
  on conflict (day, source) do update
    set sign_ups = traffic.sign_ups + 1;
end;
$$;

revoke all on function public.record_sign_up(text) from public, anon;
grant execute on function public.record_sign_up(text) to authenticated;
