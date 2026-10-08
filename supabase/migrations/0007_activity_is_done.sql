-- An activity can be ticked off. A trip's progress is the share of its
-- activities that are ticked, so a trip copied from an explore plan starts at
-- 0% instead of looking finished because every day already has activities.

alter table public.itinerary_activities
  add column is_done boolean not null default false;
