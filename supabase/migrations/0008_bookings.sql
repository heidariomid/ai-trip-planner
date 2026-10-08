-- Spec 7: bookings. Four kinds, each its own table, all hanging off a trip.
-- The app records what the traveller booked elsewhere; it books nothing.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Dates and times are wall-clock values with no time zone, like the trip's own
-- dates: a 9:30 departure reads 9:30 wherever the phone is. An arrival can be
-- on the next day, so the two times are not compared.
create table public.booking_flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  airline text not null,
  flight_number text not null,
  departs_on date,
  departs_at time,
  arrives_at time,
  created_at timestamptz not null default now(),
  constraint booking_flights_airline_check check (btrim(airline) <> ''),
  constraint booking_flights_flight_number_check check (btrim(flight_number) <> '')
);

create index booking_flights_trip_id_idx on public.booking_flights (trip_id);

create table public.booking_car_rentals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  company text not null,
  pickup_location text,
  pickup_on date,
  pickup_at time,
  created_at timestamptz not null default now(),
  constraint booking_car_rentals_company_check check (btrim(company) <> '')
);

create index booking_car_rentals_trip_id_idx on public.booking_car_rentals (trip_id);

create table public.booking_hotels (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  check_in date not null,
  check_out date not null,
  created_at timestamptz not null default now(),
  constraint booking_hotels_name_check check (btrim(name) <> ''),
  constraint booking_hotels_dates_check check (check_out >= check_in)
);

create index booking_hotels_trip_id_idx on public.booking_hotels (trip_id);

-- A rail pass, a bus, an event ticket: anything that is not one of the three above.
create table public.booking_extras (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  detail text,
  created_at timestamptz not null default now(),
  constraint booking_extras_title_check check (btrim(title) <> ''),
  constraint booking_extras_detail_length_check
    check (detail is null or char_length(detail) <= 200)
);

create index booking_extras_trip_id_idx on public.booking_extras (trip_id);

-- ---------------------------------------------------------------------------
-- Access: the same two functions as the itinerary
-- ---------------------------------------------------------------------------

-- A new table in public is granted to anon and authenticated by default in
-- this project, so the grants are taken away and only the four verbs come back.
revoke all
  on public.booking_flights, public.booking_car_rentals,
     public.booking_hotels, public.booking_extras
  from anon, authenticated;

grant select, insert, update, delete
  on public.booking_flights, public.booking_car_rentals,
     public.booking_hotels, public.booking_extras
  to authenticated;

alter table public.booking_flights enable row level security;
alter table public.booking_car_rentals enable row level security;
alter table public.booking_hotels enable row level security;
alter table public.booking_extras enable row level security;

create policy "Trip members can read flights"
  on public.booking_flights for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add flights"
  on public.booking_flights for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update flights"
  on public.booking_flights for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete flights"
  on public.booking_flights for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));

create policy "Trip members can read car rentals"
  on public.booking_car_rentals for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add car rentals"
  on public.booking_car_rentals for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update car rentals"
  on public.booking_car_rentals for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete car rentals"
  on public.booking_car_rentals for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));

create policy "Trip members can read hotels"
  on public.booking_hotels for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add hotels"
  on public.booking_hotels for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update hotels"
  on public.booking_hotels for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete hotels"
  on public.booking_hotels for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));

create policy "Trip members can read extras"
  on public.booking_extras for select to authenticated
  using ((select private.can_access_trip(trip_id)));

create policy "Trip editors can add extras"
  on public.booking_extras for insert to authenticated
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can update extras"
  on public.booking_extras for update to authenticated
  using ((select private.can_edit_trip(trip_id)))
  with check ((select private.can_edit_trip(trip_id)));

create policy "Trip editors can delete extras"
  on public.booking_extras for delete to authenticated
  using ((select private.can_edit_trip(trip_id)));
