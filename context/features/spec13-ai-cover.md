# Spec 13 — AI Cover Image

## Overview

Spec 13 of 17. Depends on spec 4 and spec 12.

Generating a cover is a second model, a second secret, and its own
failures. It is not part of writing trip rows. The control spec 4 left
disabled on Add New Trip starts working here. The chat does not gain an
image button.

**The provider is Cloudflare Workers AI, on its free daily allowance
(user decision, 2026-10-09: "best free option and good quality").** It
replaced Google Gemini `gemini-3.1-flash-lite-image`, which has no free
tier (about $0.034 an image). The pre-review is
`docs/spec13-pre-review.fa.md`.

## Requirements

### The model

- The model is `@cf/black-forest-labs/flux-2-klein-4b`, kept as one
  constant in the function. It is open under Apache 2.0, so its
  pictures can be used in a commercial app. If it turns out not to work
  on the free allowance, the fallback is
  `@cf/black-forest-labs/flux-1-schnell`, also Apache 2.0
- The call is Cloudflare's REST API:
  `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}`
  with `Authorization: Bearer {token}`. **Confirmed with real requests
  on 2026-10-09:** the body is a multipart form (`FormData`) with
  `prompt`, `width`, and `height`; the answer is JSON whose
  `result.image` is a base64 JPEG. No `Content-Type` header is set by
  hand, so the form's own boundary is sent
- Ask for `width` 1024 and `height` 576. That returned a 1024 by 576
  JPEG of about 0.5 MB in 12 to 15 seconds. With no size the model
  draws 1024 by 1024, about 1 MB
- The free allowance is 10,000 neurons a day for the whole Cloudflare
  account, which is roughly 96 pictures at 1024 by 1024 with this model.
  Past it the request fails with an error and nothing is charged. **The
  account stays on the free Workers plan.** Moving to Workers Paid is a
  separate decision for the user
- Two Supabase Edge Function secrets, `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN`. Neither is an `EXPO_PUBLIC_*` variable and
  neither reaches the device. With either one missing the function
  answers 503 with "Cover generation is not set up yet."

### The function

- Its own Edge Function, `supabase/functions/trip-cover/index.ts`, in
  the shape of `place-photo`: `verify_jwt: false`, the caller checked
  with `auth.getUser`, queries made with the caller's token
- The app sends the trip's `title`, `destination`, and `description`.
  The function trims and shortens them and builds the prompt itself: a
  travel photograph of the destination, landscape, no text, no people.
  **There is no free prompt field on the form**
- Its own daily cap, a constant in the function, starting at 5 per user
  per UTC day, through `public.consume_cover_generation(p_limit)` on a
  `cover_usage` table, the same pattern as `consume_place_lookup`. It
  does not draw from the chat cap of 30, and the client cannot raise it
- The cap is counted before the model is called, so a generation that
  fails still uses one. The function returns `remaining` with every
  answer, and the form shows it ("3 left today"). Over the cap, the
  form says to try again tomorrow
- The function returns the image as base64 with its mime type. It does
  not write Storage and it does not call `create_trip`. An answer with
  no image, a blocked prompt, or a spent Cloudflare allowance is a
  failed generation and a readable sentence, never a broken image

### The form

- **This finishes what spec 4 left open.** Spec 4 drew a "Generate with
  AI" tile on the manual Add New Trip form (`components/CoverPicker.tsx`),
  disabled and captioned "Coming soon". Here that tile is enabled, its
  caption becomes the count left today, and it calls the `trip-cover`
  function, so a traveller making a trip by hand can get a cover from
  Cloudflare without picking a photo
- Generate with AI works on Add New Trip and on Edit trip. With no
  cover it is the second tile. With a cover showing, "Generate" sits
  beside "Change", so a trip that already has a cover can get a new one
- Generate is disabled until a destination is typed. While it works the
  control reads "Generating…" and a second tap is dropped, so one tap
  never uses two of the five
- The preview is drawn from a `data:` URI. **The upload does not fetch
  that URI**, which is not reliable on a phone: `LocalImage` gains an
  optional `base64`, and `uploadImage` turns it into an `ArrayBuffer`
  directly. No new package
- Save is what persists it. Save calls `create_trip`, uploads the
  preview into `{owner_id}/{trip_id}/` as `cover-{time}`, and sets
  `image_path`, the same path as a picked cover. Leaving the form
  before Save drops the preview. My Trips does not gain a trip
- A failed generation does not block Save. The traveller can still pick
  a photo from the gallery, or save with none

### A trip created from the chat

- It keeps the automatic cover it has today: a real photo of the
  destination from Wikipedia (`findDestinationPicture`), which is free
  and does not use the cap
- Only when Wikipedia has no photo does the app ask this function for
  one, from the title and destination, and upload it the same way. That
  uses one of the five
- A failed generation, or a cap already reached, leaves the trip with
  the placeholder. It never fails or undoes the create, and it says
  nothing: the chat screen has already closed. The traveller can
  generate a cover later from Edit trip
- Not for a copy of an explore plan, which carries the plan's picture

## Out of scope

- Generating photos for place cards or the gallery
- Changing itinerary rows, bookings, or draft status
- Letting the chat model call this by itself
- A paid plan, or a second image provider
- Keeping previews that were never saved

## Done when

- On the manual Add New Trip form the "Generate with AI" tile no
  longer reads "Coming soon" and can be tapped
- On a phone, generate a cover, see the preview, and go back. My Trips
  has no new trip. Generate again, save, and the card shows that cover.
  A failed generation still lets them save with a gallery photo or none
- On Edit trip, a trip that has a cover gets a generated one
- A sixth generation on the same UTC day is refused and does not call
  the image model
- The app bundle contains no Cloudflare token and no account id
- The Cloudflare account is still on the free plan
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec4-create-trip.md
- @context/features/spec12-ai-trip-actions.md
- The Add New Trip board in @context/plan/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
