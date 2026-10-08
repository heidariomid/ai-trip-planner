-- Spec 6: explore plans. Curated, seeded here, read-only in the app, and
-- copied into a traveller's own trip through create_trip.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Day count and place count are not columns: they are counted from the day
-- and activity rows, so a card can never disagree with what a copy creates.
create table public.explore_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text not null,
  description text,
  rough_cost text not null,
  tags text[] not null default '{}',
  category text not null,
  -- A key for a picture bundled in the app, not a Storage path.
  image_key text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  -- The same limit as trips.description, because a copy writes it there.
  constraint explore_plans_description_length_check
    check (description is null or char_length(description) <= 200)
);

create table public.explore_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.explore_plans (id) on delete cascade,
  day_number integer not null,
  title text,
  constraint explore_plan_days_day_number_check check (day_number > 0),
  -- Also serves lookups by plan_id, so there is no separate index for it.
  constraint explore_plan_days_plan_id_day_number_key unique (plan_id, day_number)
);

create table public.explore_plan_activities (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.explore_plan_days (id) on delete cascade,
  sort_order integer not null default 0,
  starts_at time,
  ends_at time,
  place text,
  activity text,
  notes text,
  -- The same rule as itinerary_activities, or create_trip rejects the copy.
  constraint explore_plan_activities_times_check
    check (starts_at is null or ends_at is null or ends_at >= starts_at)
);

create index explore_plan_activities_day_id_idx
  on public.explore_plan_activities (day_id);

-- ---------------------------------------------------------------------------
-- Access: any signed-in user reads, nobody writes from the app
-- ---------------------------------------------------------------------------

-- A new table in public is granted to anon and authenticated by default in
-- this project, so the grants are taken away and only select is given back.
revoke all
  on public.explore_plans, public.explore_plan_days, public.explore_plan_activities
  from public, anon, authenticated;

grant select
  on public.explore_plans, public.explore_plan_days, public.explore_plan_activities
  to authenticated;

alter table public.explore_plans enable row level security;
alter table public.explore_plan_days enable row level security;
alter table public.explore_plan_activities enable row level security;

create policy "Signed-in users can read explore plans"
  on public.explore_plans
  for select
  to authenticated
  using (true);

create policy "Signed-in users can read explore plan days"
  on public.explore_plan_days
  for select
  to authenticated
  using (true);

create policy "Signed-in users can read explore plan activities"
  on public.explore_plan_activities
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

do $do$
declare
  seed jsonb := $seed$
[
{"title":"The Swiss Alps by train in 5 days","destination":"Lauterbrunnen, Switzerland","description":"Waterfalls, cable cars, and mountain villages in the Bernese Oberland, with every leg done by train.","rough_cost":"$2,400","tags":["Nature","Scenic"],"category":"nature","image_key":"alps","days":[{"title":"Arrive in the valley","activities":[{"starts_at":"14:00","ends_at":"15:00","place":"Lauterbrunnen Station","activity":"Arrive and drop your bags","notes":null},{"starts_at":"15:30","ends_at":"17:00","place":"Staubbach Falls","activity":"Walk to the waterfall","notes":null},{"starts_at":"19:00","ends_at":"20:30","place":"Hotel Oberland Restaurant","activity":"Dinner in the village","notes":null}]},{"title":"Mürren and the Schilthorn","activities":[{"starts_at":"09:00","ends_at":"09:45","place":"Grütschalp Cable Car","activity":"Ride up to the plateau","notes":null},{"starts_at":"10:00","ends_at":"12:00","place":"Mürren","activity":"Wander the car-free village","notes":null},{"starts_at":"13:00","ends_at":"15:30","place":"Schilthorn Piz Gloria","activity":"Take the cable car to the summit","notes":"Check the summit webcam before buying a ticket."}]},{"title":"Jungfraujoch","activities":[{"starts_at":"08:00","ends_at":"10:00","place":"Kleine Scheidegg","activity":"Train up to the pass","notes":null},{"starts_at":"10:30","ends_at":"13:30","place":"Jungfraujoch","activity":"Visit the Top of Europe","notes":"It is cold all year. Bring a warm layer."},{"starts_at":"15:00","ends_at":"16:30","place":"Wengen","activity":"Coffee on the way down","notes":null}]},{"title":"Trümmelbach and Grindelwald","activities":[{"starts_at":"09:30","ends_at":"11:00","place":"Trümmelbach Falls","activity":"See the falls inside the mountain","notes":null},{"starts_at":"12:30","ends_at":"14:00","place":"Grindelwald","activity":"Lunch with a view of the Eiger","notes":null},{"starts_at":"14:30","ends_at":"17:00","place":"Grindelwald First","activity":"Walk the cliff path to Bachalpsee","notes":null}]},{"title":"Interlaken and home","activities":[{"starts_at":"09:00","ends_at":"10:30","place":"Harder Kulm","activity":"Funicular to the viewpoint","notes":null},{"starts_at":"11:00","ends_at":"12:30","place":"Höhematte Park, Interlaken","activity":"Last walk between the lakes","notes":null},{"starts_at":"13:30","ends_at":"14:30","place":"Interlaken Ost Station","activity":"Train out","notes":null}]}]},
{"title":"Dubai sun and skyline in 4 days","destination":"Dubai, United Arab Emirates","description":"Pool mornings, old souks, a desert evening, and the view from the tallest building in the world.","rough_cost":"$1,800","tags":["Beach","Architecture"],"category":"beach","image_key":"dubai","days":[{"title":"The Marina","activities":[{"starts_at":"10:00","ends_at":"13:00","place":"Dubai Marina Walk","activity":"Walk the waterfront","notes":null},{"starts_at":"14:00","ends_at":"17:00","place":"JBR Beach","activity":"Afternoon at the beach","notes":null},{"starts_at":"19:30","ends_at":"21:00","place":"Pier 7","activity":"Dinner over the marina","notes":null}]},{"title":"Downtown","activities":[{"starts_at":"10:00","ends_at":"12:30","place":"The Dubai Mall","activity":"Aquarium and a slow morning indoors","notes":null},{"starts_at":"16:30","ends_at":"18:00","place":"Burj Khalifa","activity":"Go up for sunset","notes":"Book the time slot ahead. Sunset sells out."},{"starts_at":"18:30","ends_at":"19:30","place":"The Dubai Fountain","activity":"Watch the fountain show","notes":null}]},{"title":"Old Dubai","activities":[{"starts_at":"09:30","ends_at":"11:00","place":"Al Fahidi Historical Neighbourhood","activity":"Walk the wind-tower lanes","notes":null},{"starts_at":"11:15","ends_at":"11:45","place":"Dubai Creek","activity":"Cross by abra boat","notes":null},{"starts_at":"12:00","ends_at":"14:00","place":"Gold Souk","activity":"Browse the gold and spice souks","notes":null}]},{"title":"Desert and the Palm","activities":[{"starts_at":"09:00","ends_at":"12:00","place":"Palm Jumeirah","activity":"Morning at a beach club","notes":null},{"starts_at":"15:30","ends_at":"21:00","place":"Dubai Desert Conservation Reserve","activity":"Dune drive and dinner in the desert","notes":null},{"starts_at":"22:00","ends_at":"23:00","place":"Souk Madinat Jumeirah","activity":"A last walk by the canals","notes":null}]}]},
{"title":"Chicago architecture and food in 3 days","destination":"Chicago, United States","description":"The river by boat, the lakefront on foot, and the city's best-known plates in between.","rough_cost":"$900","tags":["Architecture","Food"],"category":"city","image_key":"chicago","days":[{"title":"The Loop","activities":[{"starts_at":"10:00","ends_at":"11:30","place":"Chicago Riverwalk","activity":"Architecture river cruise","notes":null},{"starts_at":"12:00","ends_at":"13:30","place":"Millennium Park","activity":"See Cloud Gate and the gardens","notes":null},{"starts_at":"14:00","ends_at":"16:30","place":"Art Institute of Chicago","activity":"An afternoon with the collection","notes":null},{"starts_at":"19:00","ends_at":"20:30","place":"Lou Malnati's Pizzeria","activity":"Deep-dish pizza","notes":"Order as you sit down. It takes 40 minutes to bake."}]},{"title":"The lakefront","activities":[{"starts_at":"09:30","ends_at":"11:30","place":"Lakefront Trail","activity":"Walk or cycle along the lake","notes":null},{"starts_at":"12:00","ends_at":"14:00","place":"Navy Pier","activity":"Lunch and the Ferris wheel","notes":null},{"starts_at":"17:30","ends_at":"19:00","place":"360 Chicago Observation Deck","activity":"The skyline at dusk","notes":null}]},{"title":"Neighbourhoods","activities":[{"starts_at":"10:00","ends_at":"12:00","place":"Lincoln Park Zoo","activity":"A free morning at the zoo","notes":null},{"starts_at":"12:30","ends_at":"13:30","place":"Portillo's","activity":"A Chicago-style hot dog","notes":null},{"starts_at":"15:00","ends_at":"17:00","place":"Wicker Park","activity":"Record shops and coffee","notes":null}]}]},
{"title":"Los Angeles highlights in 4 days","destination":"Los Angeles, United States","description":"Hollywood, the hills, a studio, and the ocean, planned around the traffic.","rough_cost":"$1,400","tags":["Culture","Beach"],"category":"city","image_key":"los-angeles","days":[{"title":"Hollywood","activities":[{"starts_at":"10:00","ends_at":"11:30","place":"Hollywood Walk of Fame","activity":"Walk the boulevard","notes":null},{"starts_at":"11:30","ends_at":"12:30","place":"TCL Chinese Theatre","activity":"Find the handprints","notes":null},{"starts_at":"17:00","ends_at":"19:30","place":"Griffith Observatory","activity":"Sunset and the Hollywood Sign","notes":"Parking fills early. Take the DASH bus up."}]},{"title":"Studios and museums","activities":[{"starts_at":"09:30","ends_at":"13:30","place":"Warner Bros. Studio Tour Hollywood","activity":"Go behind the scenes","notes":null},{"starts_at":"15:00","ends_at":"17:30","place":"The Getty Center","activity":"Art, gardens, and the view","notes":null}]},{"title":"The coast","activities":[{"starts_at":"10:00","ends_at":"12:30","place":"Santa Monica Pier","activity":"Morning on the pier","notes":null},{"starts_at":"13:00","ends_at":"15:00","place":"Venice Beach Boardwalk","activity":"Walk south along the sand","notes":null},{"starts_at":"15:30","ends_at":"17:00","place":"Venice Canals","activity":"A quiet loop through the canals","notes":null}]},{"title":"Downtown","activities":[{"starts_at":"10:00","ends_at":"11:30","place":"The Broad","activity":"Contemporary art downtown","notes":null},{"starts_at":"12:00","ends_at":"13:30","place":"Grand Central Market","activity":"Lunch from the stalls","notes":null},{"starts_at":"14:00","ends_at":"15:00","place":"Walt Disney Concert Hall","activity":"See the building and its garden","notes":null}]}]},
{"title":"Lake Tahoe outdoors in 3 days","destination":"South Lake Tahoe, United States","description":"Clear water, granite coves, and trails with a view, for a long weekend outside.","rough_cost":"$750","tags":["Hiking","Lakes"],"category":"adventure","image_key":"tahoe","days":[{"title":"Emerald Bay","activities":[{"starts_at":"09:00","ends_at":"11:30","place":"Emerald Bay State Park","activity":"Hike down to the bay","notes":"The lot is full by mid-morning. Go early."},{"starts_at":"11:30","ends_at":"12:30","place":"Vikingsholm","activity":"Tour the lakeside house","notes":null},{"starts_at":"15:00","ends_at":"17:00","place":"Eagle Falls Trail","activity":"Short climb to Eagle Lake","notes":null}]},{"title":"On the water","activities":[{"starts_at":"09:00","ends_at":"12:00","place":"Sand Harbor","activity":"Kayak the granite coves","notes":null},{"starts_at":"13:00","ends_at":"14:00","place":"Sand Harbor Beach","activity":"Picnic on the sand","notes":null},{"starts_at":"18:00","ends_at":"19:30","place":"Zephyr Cove","activity":"Sunset from the pier","notes":null}]},{"title":"Above the lake","activities":[{"starts_at":"09:00","ends_at":"12:00","place":"Heavenly Mountain Gondola","activity":"Ride up for the full view","notes":null},{"starts_at":"13:30","ends_at":"16:00","place":"Van Sickle Bi-State Park","activity":"Hike to the waterfall","notes":null},{"starts_at":"17:00","ends_at":"18:30","place":"Lakeview Commons","activity":"A last swim","notes":null}]}]}
]
$seed$;
  plan jsonb;
  day jsonb;
  new_plan_id uuid;
  new_day_id uuid;
  plan_position integer;
  day_position integer;
begin
  for plan, plan_position in
    select value, ordinality from jsonb_array_elements(seed) with ordinality
  loop
    insert into public.explore_plans (
      title, destination, description, rough_cost, tags, category, image_key, sort_order
    )
    values (
      plan ->> 'title',
      plan ->> 'destination',
      plan ->> 'description',
      plan ->> 'rough_cost',
      array(select jsonb_array_elements_text(plan -> 'tags')),
      plan ->> 'category',
      plan ->> 'image_key',
      plan_position
    )
    returning id into new_plan_id;

    for day, day_position in
      select value, ordinality from jsonb_array_elements(plan -> 'days') with ordinality
    loop
      insert into public.explore_plan_days (plan_id, day_number, title)
      values (new_plan_id, day_position, day ->> 'title')
      returning id into new_day_id;

      insert into public.explore_plan_activities (
        day_id, sort_order, starts_at, ends_at, place, activity, notes
      )
      select
        new_day_id,
        (item.position - 1)::integer,
        (item.value ->> 'starts_at')::time,
        (item.value ->> 'ends_at')::time,
        item.value ->> 'place',
        item.value ->> 'activity',
        item.value ->> 'notes'
      from jsonb_array_elements(day -> 'activities')
        with ordinality as item (value, position);
    end loop;
  end loop;
end;
$do$;
