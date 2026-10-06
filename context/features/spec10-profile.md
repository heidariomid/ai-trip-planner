# Spec 10 — Profile

## Overview

Spec 10 of 17. Depends on spec 3. The profile tab grows from a header
and a sign-out button into a form the traveller can edit.

Interest tags are stored because the assistant in spec 11 will read them.
Saved places, joining a trip, password reset, and account deletion are
not on this screen yet.

## Requirements

- Edit `full_name`. Edit the avatar by uploading to `images` at
  `{user_id}/avatar/{filename}` and saving the path on `profiles`. Spec 2
  allows that path with the avatar policy: the second folder is
  `avatar`, and the first folder is `auth.uid()`. Trip files are a
  different rule. They use the trip owner's id and `can_edit_trip`
- Add `interests text[]` to `profiles`, null allowed. The traveller can
  add and remove short tags such as food, nature, or architecture. Cap
  the list at a small number so the form stays short
- Sign out stays where it is
- The keyboard does not cover the fields or the save button
- Do not show a saved-items list, a join-code field, or a list of codes.
  Saved places are spec 14. Joining a trip is spec 15. Password reset,
  account deletion, and the privacy policy are spec 16

## Out of scope

- Password reset, account deletion, and a privacy policy — spec 16
- Notification settings. Push is out of the product
- Saved places and family share

## Done when

- On a phone, change the name and the avatar, add two tags, kill the app,
  and reopen. Profile shows the new values, and the `profiles` row matches
- A second user cannot update the first user's row
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- @context/features/spec3-app-shell.md
- The Home board in @context/plan/, for what Profile is meant to hold
