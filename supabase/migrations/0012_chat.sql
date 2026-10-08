-- Spec 11: the assistant's conversations. A thread belongs to one user and,
-- when a trip was selected, to that trip. A message is a transcript: a card
-- inside it is not a row of the itinerary.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Null for a conversation started from Home with no trip selected.
  trip_id uuid references public.trips (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_threads_user_trip_idx
  on public.chat_threads (user_id, trip_id, updated_at desc);
create index chat_threads_trip_id_idx on public.chat_threads (trip_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  role text not null,
  content text not null,
  -- Suggestion chips, place cards, and day cards the assistant attached.
  cards jsonb,
  created_at timestamptz not null default now(),
  constraint chat_messages_role_check check (role in ('user', 'assistant')),
  constraint chat_messages_content_check check (char_length(content) <= 12000)
);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- How many requests a user has made on one UTC day. Only the function below
-- writes it, so the app can neither read it nor wind it back.
create table public.chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  request_count integer not null default 0,
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

revoke all on public.chat_threads from anon, authenticated;
revoke all on public.chat_messages from anon, authenticated;
revoke all on public.chat_usage from anon, authenticated;

grant select, insert, delete on public.chat_threads to authenticated;
grant select, insert on public.chat_messages to authenticated;

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
-- No policy and no grant: nothing but the definer function reaches it.
alter table public.chat_usage enable row level security;

create policy "Users can read their own threads"
  on public.chat_threads for select to authenticated
  using ((select auth.uid()) = user_id);

-- A thread can only hang off a trip its owner may read.
create policy "Users can start their own threads"
  on public.chat_threads for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (trip_id is null or (select private.can_access_trip(trip_id)))
  );

create policy "Users can delete their own threads"
  on public.chat_threads for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read messages in their own threads"
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and chat_threads.user_id = (select auth.uid())
    )
  );

create policy "Users can add messages to their own threads"
  on public.chat_messages for insert to authenticated
  with check (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and chat_threads.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- The newest thread is the one with the newest message
-- ---------------------------------------------------------------------------

-- Definer, because authenticated has no update on chat_threads.
create function private.touch_chat_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

revoke execute on function private.touch_chat_thread() from public, anon, authenticated;

create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row
  execute function private.touch_chat_thread();

-- ---------------------------------------------------------------------------
-- The daily cap
-- ---------------------------------------------------------------------------

-- Counts one request for the caller on today's UTC date and says whether it
-- is still inside p_limit. The Edge Function passes its own constant; a
-- client that calls this directly can only spend its own allowance.
create function public.consume_chat_request(p_limit integer)
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

  insert into public.chat_usage as usage (user_id, day, request_count)
  values (v_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set request_count = usage.request_count + 1
    where usage.request_count < p_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.consume_chat_request(integer) from public, anon;
grant execute on function public.consume_chat_request(integer) to authenticated;
