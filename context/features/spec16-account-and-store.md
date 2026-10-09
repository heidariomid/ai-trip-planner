# Spec 16 — Account and Web App

## Overview

Spec 16 of 18. Depends on spec 1, spec 10, and spec 15. It comes before
spec 17.

The first release is a website a traveller adds to their home screen,
not an App Store app (user decision, 2026-10-09: the Apple Developer
Program is $99 a year and the web route is free). This step makes the
web build behave like an app once it is on the home screen, tells a
traveller how to put it there, and gives them what an account needs:
a way to delete it and a privacy policy to read.

It is still a website in an app-like shell, not a native app. Expo Go on
the iPhone stays the development runtime.

Password reset and every other email are spec 18. Sign in with Apple is
not built: it is an App Store rule and belongs to a native release.

## Requirements

- **Read the SDK 57 guide first**:
  `https://docs.expo.dev/guides/progressive-web-apps/` and the `web` keys
  in `https://docs.expo.dev/versions/v57.0.0/config/app/`. Do not write
  the shell from memory
- A web app manifest at `public/manifest.json`: the name, a short name of
  at most 12 characters, `display: standalone`, `start_url` at the root,
  and the `canvas` colour as theme and background. Icons at 192 and 512
  pixels, plus a 180 pixel `apple-touch-icon`
- **The app gets its real icon here.** `assets/icon.png` and
  `assets/favicon.png` are still the Expo template's. Show the user
  three named options and build the one they pick; the manifest icons,
  the favicon, and `app.json` all come from it
- The manifest and the iOS tags are linked from the page's HTML head, in
  the way the guide gives for this project's web output. Opened from the
  home screen icon on an iPhone, the app fills the screen with no Safari
  address bar or toolbar, and nothing sits under the status bar or the
  home indicator
- No service worker. The app does not work offline and this step does
  not change that
- **An install hint on Sign In and Sign Up, before the traveller signs
  in.** An iPhone gives a home screen app its own storage, separate from
  Safari, so someone who signs in in Safari and then installs has to
  sign in a second time. Showing the hint first avoids that
  - iPhone and iPad: a small card with two steps, "Tap Share" with the
    share icon and "Add to Home Screen". Safari has no install button a
    page can trigger, so the card only explains
  - Android Chrome: the same card with an "Install app" button that
    opens the browser's own prompt (`beforeinstallprompt`). No button
    when the browser never offers the prompt
  - The card is a static picture of the steps, not a video. It can be
    closed, stays closed on that device, and never blocks the form
  - It does not show when the app was opened from the home screen, on a
    desktop browser, or in the native app
- Delete account sits on Profile, behind a confirmation. The client
  cannot delete `auth.users` with the publishable key. An Edge Function,
  `delete-account`, deletes the signed-in user only: it reads the user
  id from the verified token and never from the request body, removes
  their Storage objects under their id prefix, then deletes the user.
  The database cascade removes the profile, the trips, and every row
  that belongs to them. Sign-out is not deletion
- The confirmation says the trips, photos, and conversations go with the
  account, that a trip shared with other people disappears for them
  too, and that it cannot be undone. One confirm, with `ConfirmDialog`.
  No typed word and no emailed code
- Photos a traveller added to someone else's trip as an editor stay with
  that trip. Only their membership goes
- After the function succeeds the app signs out locally and lands on
  Sign In
- A privacy policy is a real page, `public/privacy.html` in this
  project, so it goes online with the site and needs no second host.
  It is linked from Sign Up and from Profile and opened in the browser.
  Its public address only exists after spec 17, which checks the link
  there. Its text names what the
  app stores and who receives data: Supabase, Google sign-in, Google
  Gemini for the chat, Cloudflare for covers, and Wikipedia for place
  photos. The user approves the text before it is published
- The Profile tab scrolls. "Privacy policy" is a third row like "Saved
  places", and "Delete account" is quiet red text under "Sign out", not
  a filled button
- Two checks cannot be made before the site has a public HTTPS address
  and belong to spec 17: Google sign-in from the home screen icon, and
  the "Install app" prompt on Android. A phone reaches the dev server
  by its network IP, Supabase refuses a redirect to an IP, and Chrome
  only offers its prompt over HTTPS. Email and password must work from
  the home screen icon here

## Out of scope

- Password reset, custom SMTP, and email confirmation: spec 18
- Sign in with Apple, an EAS build, and a store listing
- Offline use and a service worker
- Push notifications
- Changing the email address or the password from Profile
- A grace period or a soft delete, and exporting an account's data
- The privacy policy's text inside the app instead of a page

## Done when

- On an iPhone in Safari, the hint shows on Sign In. After Add to Home
  Screen, the icon opens the app full screen with no Safari bar, the
  hint is gone, and a traveller who signs in there stays signed in
  after closing and reopening it
- Email and password sign-in works from the home screen icon
- The home screen icon is the icon the user picked
- Delete a throwaway account, never the test account. The user is gone
  from Authentication, the profile, trips, and files are gone, a trip it
  shared is gone for the other member, and a reload lands on Sign In.
  Signing in with the old password fails
- An editor who added a photo to someone else's trip deletes their
  account, and the photo is still on that trip
- Sign Up and Profile both open the privacy policy page on the dev
  server
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- @context/features/spec10-profile.md
- @context/features/spec15-family-share.md
- `docs/spec16-pre-review.fa.md`
