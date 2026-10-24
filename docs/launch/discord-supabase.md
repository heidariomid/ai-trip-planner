# Supabase Discord

Post in `#showcase`. Do not drop the link in a support channel.

## Message

Showcase: a trip planner on Postgres where the model is not allowed to write.

The assistant returns cards. The app inserts the trip, the day, or the booking with the traveller's own token, after a tap. Row-level security is the real boundary. I checked it as three users in one transaction: a stranger reads nothing, a viewer can read and cannot write, an editor can update and cannot take ownership. Then the transaction rolls back.

Shared trips use a join code and a role. Storage objects follow the same rule, so a member can see a cover and someone else cannot.

Daily caps for the chat and the cover generator are security-definer functions over tables no client role can read. The new traffic totals are the same shape, with no user id in them.

https://plan-trip-ai.vercel.app/?ref=discord-supabase

https://github.com/heidariomid/ai-trip-planner
