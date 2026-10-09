-- Spec 17: a free Supabase project that sees no requests for a week can be
-- paused, and then sign-in answers nothing. The public site calls this once a
-- day. It reads the clock from the database and touches no table, so it is
-- safe to leave open to a signed-out caller.

create function public.ping()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
