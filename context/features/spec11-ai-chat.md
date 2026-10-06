# Spec 11 — AI Chat

## Overview

Spec 11 of 17. Depends on spec 5 and spec 10.

The assistant can talk about the selected trip. It streams, it can show
chips and cards, and it saves the conversation. It cannot create or
change a trip, a booking, or an image. Writing a trip is spec 12.
Generating a cover is spec 13.

The provider is chosen at the start of this step, written into this spec,
and not guessed from an older note.

## Requirements

- A chat screen opened from the Home ask bar and from a trip. The trip
  selector is a select on `trips`, so it shows whatever
  `can_access_trip` allows. Until spec 15 that is the trips they own.
  After spec 15 it includes trips shared with them. The app does not
  filter the list on `user_id`. Home opens it with no trip selected
  until they pick one
- Messages stream. A stopped or failed reply shows a readable error and
  does not leave an empty bubble that never resolves
- The assistant can answer, ask a follow-up, and render suggestion chips,
  a day card, and a place card. Those cards are part of the message
  transcript. They are not rows in `itinerary_activities`
- A place card is the place name and a short line, with the same
  placeholder image the signed-URL helper uses. There is no place-photo
  API, and the model must not supply an image URL. Do not render a URL
  that came back in the reply
- The Edge Function that calls the model caps requests per user per
  UTC day. The cap is a constant in the function, starting at 30. The
  client does not send the cap and cannot raise it. Over the cap, the
  reply is a readable sentence that says to try again tomorrow, not a
  raw provider error
- Persist threads and messages. A thread belongs to the user and, when
  one is selected, to a trip. RLS so a second user cannot read the thread
- The system prompt may include the trip's title, dates, destination, and
  the user's interest tags. It must not include the service key
- When a trip is selected, the prompt also carries that trip's days and
  activities: day number, date, times, place, and activity. The
  assistant is told not to suggest a place that is already on the trip.
  The function reads those rows with the caller's own token, so
  row-level security decides what it can see. It does not read them
  with the secret key. Cap how many activities are sent, so a long trip
  cannot grow the prompt without limit
- Reply text is rendered as formatted markdown: headings, bold, and
  lists. Raw `**` and `#` never show. The renderer is chosen at the
  start of this step and has to run in Expo Go. Links and images inside
  the markdown are not rendered
- The model is called from a place the secret key can live. The secret
  does not ship in the app. If that means a Supabase Edge Function, the
  function is part of this step
- Buttons that would write data — Create Trip, Save Draft, Regenerate,
  Add to Trip — are visible and disabled, with nothing that pretends the
  save worked
- A short line on the screen: the assistant can be wrong, and the
  traveller should check anything that matters

## Out of scope

- Writing to `trips`, itinerary, bookings, or Storage
- Hearts and saved places
- Voice input
- Picking the provider inside the app. One provider for the whole step

## Done when

- On a phone, ask about the open trip, see a streamed reply, tap a chip,
  leave, and come back to the same thread
- Ask for places on a trip that already has an activity. The reply does
  not offer that same place again
- A reply with a list and bold text shows formatted, with no raw
  markdown symbols
- Create Trip and Save Draft do nothing
- A 31st request on the same UTC day is refused with that sentence, and
  it does not call the model
- A place card shows the placeholder, not a photograph
- A second user cannot read the thread
- The app bundle contains no model secret
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec5-trip-itinerary.md
- @context/features/spec10-profile.md
- The AI Agent Chat board in @context/plan/
