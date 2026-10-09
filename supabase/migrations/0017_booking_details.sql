-- More of what a flight and a car rental confirmation carries. Every new
-- column is optional, so the rows already saved stay valid.

alter table public.booking_flights
  add column route text,
  add column seat text,
  add column confirmation_code text,
  add column notes text,
  add constraint booking_flights_route_length_check
    check (route is null or char_length(route) <= 80),
  add constraint booking_flights_seat_length_check
    check (seat is null or char_length(seat) <= 12),
  add constraint booking_flights_confirmation_code_length_check
    check (confirmation_code is null or char_length(confirmation_code) <= 40),
  add constraint booking_flights_notes_length_check
    check (notes is null or char_length(notes) <= 200);

alter table public.booking_car_rentals
  add column dropoff_location text,
  add column vehicle text,
  add column dropoff_on date,
  add column dropoff_at time,
  add column confirmation_code text,
  add column notes text,
  add constraint booking_car_rentals_dropoff_location_length_check
    check (dropoff_location is null or char_length(dropoff_location) <= 80),
  add constraint booking_car_rentals_vehicle_length_check
    check (vehicle is null or char_length(vehicle) <= 60),
  add constraint booking_car_rentals_confirmation_code_length_check
    check (confirmation_code is null or char_length(confirmation_code) <= 40),
  add constraint booking_car_rentals_notes_length_check
    check (notes is null or char_length(notes) <= 200),
  add constraint booking_car_rentals_dates_check
    check (pickup_on is null or dropoff_on is null or dropoff_on >= pickup_on);
