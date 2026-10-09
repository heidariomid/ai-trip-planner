-- Spec 12: create_trip writes the status with the trip, so a draft is one
-- request and not an update after an active insert.

-- ---------------------------------------------------------------------------
-- create_trip takes the status
-- ---------------------------------------------------------------------------

-- A new argument is a new signature: create or replace would leave the old
-- function beside the new one, and a call that names no status would match
-- both. So the old one goes first. Dropping it drops its grants too.
drop function public.create_trip(text, text, text, date, date, text, integer, text, jsonb);

-- p_activities is a JSON array of { day_number, starts_at, ends_at, place, activity, notes }.
create function public.create_trip(
  p_title text,
  p_source text,
  p_destination text,
  p_start_date date,
  p_end_date date,
  p_description text default null,
  p_traveler_count integer default 1,
  p_image_path text default null,
  p_activities jsonb default '[]'::jsonb,
  p_status text default 'active'
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
    description, traveler_count, image_path, status
  )
  values (
    (select auth.uid()), p_title, p_source, p_destination, p_start_date, p_end_date,
    p_description, p_traveler_count, p_image_path, coalesce(p_status, 'active')
  )
  returning id into new_trip_id;

  insert into public.itinerary_days (trip_id, day_number, date)
  select new_trip_id, day_offset + 1, p_start_date + day_offset
  from generate_series(0, p_end_date - p_start_date) as day_offset;

  insert into public.itinerary_activities (
    day_id, sort_order, starts_at, ends_at, place, activity, notes
  )
  select
    days.id,
    (item.position - 1)::integer,
    (item.value ->> 'starts_at')::time,
    (item.value ->> 'ends_at')::time,
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
  public.create_trip(text, text, text, date, date, text, integer, text, jsonb, text)
  from public, anon;

grant execute on function
  public.create_trip(text, text, text, date, date, text, integer, text, jsonb, text)
  to authenticated;
