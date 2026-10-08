# Spec 10 — Profile

## Overview

Spec 10 of 17. Depends on spec 3 for the tab and on spec 4 for the
storage helper and the picker. The profile tab stays a summary and gains
an Edit profile screen the traveller can change.

Interest tags are stored because the assistant in spec 11 will read them.
Saved places, joining a trip, password reset, and account deletion are
not on this screen yet.

## Requirements

- The Profile tab is a summary, not a form: the avatar, the name, the
  email, the interest tags as chips, an Edit profile button, and Sign
  out where it is now. Specs 14, 15, and 16 add to this tab later
- Editing happens on its own route, `/edit-profile`, built with
  `FormScreen` like `/create-trip`, so the keyboard does not cover the
  fields or the save button
- Edit `full_name`. It is required, trimmed, and at most 60 characters.
  The form and a `check` on the column both enforce it
- Edit the avatar by uploading to `images` at
  `{user_id}/avatar/avatar-{time}.{ext}`. Spec 2 allows that path with
  the avatar policy: the second folder is `avatar`, and the first folder
  is `auth.uid()`. Trip files are a different rule. They use the trip
  owner's id and `can_edit_trip`
- Save the path in a new column, `profiles.avatar_path`, null allowed.
  **Do not write a path into `avatar_url`.** That column holds the
  public picture URL from Google and stays as it is. The avatar shows
  `avatar_path` through the signed-URL helper from spec 4, then
  `avatar_url`, then the first letter of the name. It never shows the
  grey placeholder
- The name is new on every upload so a replaced avatar does not come
  from a cache, and the old file is removed after the swap. The upload
  goes through `lib/storage.ts`, with the same type and 10 MB checks as
  a cover
- The picker opens straight onto the photos, with no crop step (user
  decision, 2026-10-08: the crop screen and the wait after it made
  adding a photo feel long). The avatar fills its circle from the centre
  of the picture, so a picture that is not square still shows correctly.
  The picture, a camera badge on it, and the label are one button
- If the name saved and the avatar upload failed, keep the name and show
  a notice, as the trip form does for a cover
- Add `interests text[]` to `profiles`, null allowed. The traveller
  picks from a fixed list with chips and does not type a tag, because
  spec 11 puts the tags into the system prompt. The list is Food,
  Nature, Architecture, History, Art, Beaches, Hiking, Nightlife,
  Shopping, Museums, Family, and Adventure. At most 6 can be picked. A
  `check` on the column enforces both the count and the list, so a new
  tag is a migration
- The signed-in user can update only `full_name`, `avatar_path`, and
  `interests` on their own row. Today `authenticated` can update every
  column, `email` included. Replace that with a column-level grant in
  the same migration, and add a trigger that sets `updated_at`
- `useProfile` reads again when a screen gains focus, like `useTrips`.
  Home and Profile each hold their own copy and both tabs stay mounted,
  so without this Home keeps the old name and avatar after a save
- Sign out stays where it is
- Do not show a saved-items list, a join-code field, or a list of codes.
  Saved places are spec 14. Joining a trip is spec 15. Password reset,
  account deletion, and the privacy policy are spec 16

## Out of scope

- Password reset, account deletion, and a privacy policy — spec 16
- Changing the email or the password
- Notification settings. Push is out of the product
- Saved places and family share
- Reading another person's avatar, or a public bucket — spec 15
- A username or a bio
- Typing a custom interest tag

## Done when

- On a phone, change the name and the avatar, pick two tags, kill the
  app, and reopen. Profile shows the new values, and the `profiles` row
  matches
- After a save, without closing the app, Home greets with the new name
  and shows the new avatar
- A traveller who signed in with Google and has not uploaded a picture
  still sees their Google picture
- The keyboard does not cover the name field or Save
- A second user cannot update the first user's row, and a signed-in user
  cannot change `email` on their own row
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- @context/features/spec3-app-shell.md
- @context/features/spec4-create-trip.md
- The Home board in @context/plan/, for what Profile is meant to hold
- `docs/spec10-pre-review.fa.md`, for why each rule is here
