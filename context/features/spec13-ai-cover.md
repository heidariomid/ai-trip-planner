# Spec 13 — AI Cover Image

## Overview

Spec 13 of 17. Depends on spec 4 and spec 12.

Generating a cover is a second model, a second secret, and its own
failures. The model is Google Gemini image generation, called through
the Gemini API (user decision, 2026-10-08). It is not part of writing
trip rows. The control spec 4 left
disabled on Add New Trip starts working here. A trip created from the
chat also gets a cover, without the traveller asking. The chat does not
gain an image button.

## Requirements

- The image provider is Google Gemini. The function calls the Gemini
  API's image generation with a text prompt built from the trip's title
  and destination, and asks for one landscape image. The model is
  `gemini-3.1-flash-lite-image` (user decision, 2026-10-08), sent as
  `models/gemini-3.1-flash-lite-image` and kept as one constant in the
  function
- The call is the Gemini Interactions API (`interactions.create`), with
  `response_modalities` of `image` and `text`, `image_config.image_size`
  of `1K`, `thinking_level` of `minimal`, `temperature` 1, and `top_p`
  0.95. These come from the Python sample Google AI Studio gave the
  user. The Edge Function is TypeScript on Deno, so the sample fixes
  the request shape and is not copied; check the JavaScript form of the
  call in Google's docs when this spec is built
- The image is the `data` of the part whose `type` is `image`, inside a
  step whose `type` is `model_output`. A `text` part is ignored and
  never shown to the traveller
- Its own Edge Function, or its own route on the function from spec 11,
  with its own secret, `GEMINI_API_KEY`, set as a Supabase Edge
  Function secret. The chat secret is reused only if spec 11 also
  chose Gemini on the same Google account. Either way the secret stays
  off the device, and it is never an `EXPO_PUBLIC_*` variable
- That `data` is base64, not a URL. The function passes those bytes
  back for the preview. A response with no image part, including one
  blocked by Gemini's safety filter, counts as a failed generation
- Its own daily cap, a constant in the function, starting at 5 per user
  per UTC day. It does not draw from the chat cap of 30, and the client
  cannot raise it. Over the cap, the form says to try again tomorrow
- The traveller describes the trip, or the form sends the title and
  destination already typed. The function returns image bytes for a
  preview on the form. It does not write Storage and it does not call
  `create_trip`
- Save is what persists it. Save calls `create_trip`, uploads the
  preview into `{owner_id}/{trip_id}/`, and sets `image_path`, the same
  order as a gallery photo. Leaving the form before Save drops the
  preview. My Trips does not gain a trip
- A trip created from the chat in spec 12, active or draft, gets a
  cover automatically. After `create_trip` returns, the app asks this
  function for an image from the title and destination, uploads it to
  `{owner_id}/{trip_id}/`, and sets `image_path`. The app does this,
  not the chat model. It happens once per created trip, and not for a
  copy of an explore plan
- The automatic cover draws from the same cap of 5. A failed
  generation, or a cap already reached, leaves the trip with the
  placeholder and one readable line in the chat. It never fails or
  undoes the create. The traveller can add a cover later from the trip
  header
- A failed generation does not block Save. The traveller can still pick
  a photo from the gallery. A failed or empty image is a readable
  sentence on the form, not a broken image and not a URL the model
  printed

## Out of scope

- Generating photos for place cards or the gallery
- Changing itinerary rows, bookings, or draft status
- Letting the chat model call this by itself. The automatic cover is
  the app calling the function after a create, with fields the
  traveller already accepted

## Done when

- On a phone, generate a cover, see the preview, and go back. My Trips
  has no new trip. Generate again, save, and the card shows that cover.
  A failed generation still lets them save with a gallery photo or none
- Create a trip from the chat. Its card shows a generated cover without
  another tap. With the cap already used up, the trip is still created
  and shows the placeholder
- A sixth generation on the same UTC day is refused and does not call
  the image model
- The app bundle contains no Gemini key
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec4-create-trip.md
- @context/features/spec12-ai-trip-actions.md
- The Add New Trip board in @context/plan/
- https://ai.google.dev/gemini-api/docs/image-generation
