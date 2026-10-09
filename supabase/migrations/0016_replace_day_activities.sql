-- Spec 12 addition (user request, 2026-10-09): a day card from the chat can
-- replace what is already on a day instead of only adding to it.

-- ---------------------------------------------------------------------------
-- Replace a day's activities in one transaction
-- ---------------------------------------------------------------------------

-- Invoker, so row-level security decides: someone who may not edit the trip
-- removes nothing, and their insert is refused, which undoes the whole call.
-- p_activities is a JSON array of { starts_at, place, activity }.
create function public.replace_day_activities(p_day_id uuid, p_activities jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected integer := jsonb_array_length(coalesce(p_activities, '[]'::jsonb));
  written integer;
begin
  -- An empty list would only wipe the day. That is not what this is for.
  if expected = 0 then
    raise exception 'There is nothing to put on this day' using errcode = '22023';
  end if;

  delete from public.itinerary_activities where day_id = p_day_id;

  insert into public.itinerary_activities (day_id, sort_order, starts_at, place, activity)
  select
    p_day_id,
    (item.position - 1)::integer,
    (item.value ->> 'starts_at')::time,
    item.value ->> 'place',
    item.value ->> 'activity'
  from jsonb_array_elements(p_activities) with ordinality as item (value, position);

  get diagnostics written = row_count;
  return written;
end;
$$;

revoke execute on function public.replace_day_activities(uuid, jsonb) from public, anon;
grant execute on function public.replace_day_activities(uuid, jsonb) to authenticated;
