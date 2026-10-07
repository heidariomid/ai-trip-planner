-- Spec 5: changing a trip's dates. One transaction sets the dates and rebuilds
-- the days, so a failure anywhere leaves the old dates and the old days.

-- Invoker, like create_trip: every statement below still passes through the
-- row-level security policies on trips, days, and activities.
create function public.reschedule_trip(
  p_trip_id uuid,
  p_start_date date,
  p_end_date date,
  p_confirm_drop boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_length integer := p_end_date - p_start_date + 1;
  days_to_drop integer;
  highest_number integer;
begin
  if p_end_date < p_start_date then
    raise exception 'The end date cannot be before the start date'
      using errcode = '22023';
  end if;

  -- Locks the trip, so two reschedules of the same trip cannot interleave.
  perform 1 from public.trips where trips.id = p_trip_id for update;
  if not found then
    raise exception 'Trip not found' using errcode = 'P0002';
  end if;

  select count(*)
  into days_to_drop
  from public.itinerary_days as days
  where days.trip_id = p_trip_id
    and (days.date is null or days.date < p_start_date or days.date > p_end_date)
    and exists (
      select 1 from public.itinerary_activities as activities
      where activities.day_id = days.id
    );

  if days_to_drop > 0 and not coalesce(p_confirm_drop, false) then
    raise exception 'Days with activities fall outside the new dates'
      using errcode = 'P0001', hint = 'confirm_drop';
  end if;

  update public.trips
  set start_date = p_start_date, end_date = p_end_date, updated_at = now()
  where trips.id = p_trip_id;
  if not found then
    raise exception 'You cannot edit this trip' using errcode = '42501';
  end if;

  -- Activities go with their day through the foreign key cascade.
  delete from public.itinerary_days as days
  where days.trip_id = p_trip_id
    and (days.date is null or days.date < p_start_date or days.date > p_end_date);

  select coalesce(max(days.day_number), 0)
  into highest_number
  from public.itinerary_days as days
  where days.trip_id = p_trip_id;

  -- unique (trip_id, day_number) is checked row by row, so the days that stay
  -- are first moved above every number in use, old or new, and only then given
  -- their final numbers. No two days share a number at any point.
  update public.itinerary_days as days
  set day_number = days.day_number + greatest(highest_number, new_length)
  where days.trip_id = p_trip_id;

  update public.itinerary_days as days
  set day_number = (days.date - p_start_date) + 1, updated_at = now()
  where days.trip_id = p_trip_id;

  insert into public.itinerary_days (trip_id, day_number, date)
  select p_trip_id, day_offset + 1, p_start_date + day_offset
  from generate_series(0, new_length - 1) as day_offset
  where not exists (
    select 1 from public.itinerary_days as days
    where days.trip_id = p_trip_id
      and days.date = p_start_date + day_offset
  );
end;
$$;

revoke execute on function
  public.reschedule_trip(uuid, date, date, boolean)
  from public, anon;

grant execute on function
  public.reschedule_trip(uuid, date, date, boolean)
  to authenticated;
