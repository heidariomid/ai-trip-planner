# r/supabase

Lead with the access check. Say it is your project.

## Title

I checked row-level security as three users in one rolled-back transaction

## Body

I am building a trip planner on Supabase, and the rule I wanted was: the model proposes, the traveller's token writes.

A trip can be shared. The owner, an editor, and a viewer are three different answers from `can_edit_trip`. I did not want to trust a policy I had only read, so I opened one transaction as three users. A stranger's select returned no rows. A viewer could read the trip and could not update it, add a note, or rotate the join code. An editor could update and could not become the owner. Then I raised an exception so the whole check rolled back.

The chat and the cover generator have a second pattern. Their usage tables have no grant and no policy. A security-definer function increments the caller's own UTC day and returns whether they are still inside the cap. The client cannot read the count back, except through a function that only returns the number.

The same shape now counts visits and sign-ups per shared link, as totals, with no user id column.

https://plan-trip-ai.vercel.app/?ref=reddit-supabase

https://github.com/heidariomid/ai-trip-planner
