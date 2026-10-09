-- Spec 12: a trip can be a draft, and the chat can replace its newest reply.
-- create_trip learns about the status in 0014.

-- ---------------------------------------------------------------------------
-- A trip is active or a draft
-- ---------------------------------------------------------------------------

alter table public.trips
  add column status text not null default 'active',
  add constraint trips_status_check check (status in ('active', 'draft'));

-- ---------------------------------------------------------------------------
-- Regenerate removes the reply it replaces
-- ---------------------------------------------------------------------------

grant delete on public.chat_messages to authenticated;

create policy "Users can delete messages in their own threads"
  on public.chat_messages for delete to authenticated
  using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and chat_threads.user_id = (select auth.uid())
    )
  );
