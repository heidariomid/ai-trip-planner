-- Spec 19. Visits, sign-ups, and the sign-up rate per shared link.
-- Change the two dates, then run this in the SQL editor.
-- traffic_daily has no grant for anon or authenticated, so this is read here,
-- as the database owner, and not from the app.

select
  source,
  sum(visits) as visits,
  sum(sign_ups) as sign_ups,
  case
    when sum(visits) = 0 then 0
    else round(100.0 * sum(sign_ups) / sum(visits), 1)
  end as sign_up_rate_percent
from public.traffic_daily
where day >= date '2026-10-24'
  and day < date '2026-11-24'
group by source
order by visits desc, sign_ups desc, source;
