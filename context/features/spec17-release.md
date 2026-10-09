# Spec 17 — Release

## Overview

Spec 17 of 18. Depends on spec 16, and on the traveller-facing steps you
intend to ship. Do not start this because the number is next.

The first release is the web app from spec 16 on a public address (user
decision, 2026-10-09). No EAS build and no store listing. This step
puts the site online and checks that what spec 16 built is still there.

The link is meant for the user's resume. Someone who has never seen the
app opens it cold, so everything a stranger touches first has to work.
Nothing here costs money.

## Requirements

- A production web export (`npx expo export -p web`), served from
  Vercel on its free plan, with the `vercel.json` the Expo publishing
  guide gives. Every path falls back to the app's page, so a reload on
  `/trip/…` does not 404, while real files such as `privacy.html` and
  `manifest.json` are still served as themselves
- **The address is chosen once.** A different address is a different
  site to a browser: every home screen icon stops working and everyone
  is signed out. No custom domain
- Supabase `site_url` becomes the public address, and that address is
  added to `uri_allow_list` and to the Google client's JavaScript
  origins. `localhost` stays in the allow list for development
- **A first screen that says what the app is.** Sign In and Sign Up get
  one line above the form, and the page gets a title, a description,
  and a preview picture for when the link is shared. No landing page
- **The free Supabase project must not pause.** A free project with a
  quiet week can be paused, and then sign-in answers nothing. One free
  scheduled request a day reads from the database. Where it runs is
  chosen when this step is built
- Icons, the home screen icon, and the display name match the app the
  traveller has been using. No cool-grey placeholder icon
- **The Google consent screen is published** (assistant's decision at
  the user's request, 2026-10-09). In Testing only the user's own
  address can sign in with Google and everyone else gets
  `access_denied`. The user fills in Branding (app name, support email,
  the site's address, the privacy policy link) and presses Publish app
  in Google Cloud by hand; there is no API for it. Google's
  documentation says an app asking only for name, email, and profile
  needs no verification. If publishing is refused, the Google button is
  hidden on the public site instead of left broken
- **The AI stays on its free allowances.** Gemini's limit is for the
  whole project and Cloudflare's is about 96 covers a day, shared by
  every traveller, and the free Gemini tier lets Google use prompts.
  The privacy policy and the release notes say so. When an allowance
  runs out the chat and the cover tile show a sentence, not a raw
  error. No CAPTCHA
- Release notes are a file in `docs/`
- Email confirmation stays off until spec 18. Say so in the release
  notes: an account can be made with an address nobody checked, and a
  forgotten password cannot be recovered yet
- The bundle contains the publishable key only. No secret key, no
  service role, no model key
- Remove any draft or debug entry points a public site should not have
- The public site and development share one database, and the test
  account's password is written in `AGENTS.md`. Before the repository
  is ever made public, that password is changed and taken out of the
  file. The repository has no remote today

## Out of scope

- A new feature. If the release wants a feature that has no spec, write
  the spec first
- An App Store or Google Play release. It needs its own spec: an EAS
  build, the paid Apple Developer Program, Sign in with Apple with its
  token revoked on account deletion, and permission before personal
  data goes to a third-party AI (App Review guideline 5.1.2(i))
- Password reset and email confirmation: spec 18
- A custom domain, a demo account, analytics, and a paid plan anywhere

## Done when

- The public address opens the app on an iPhone and on Android, it can
  be added to the home screen, and an account that signed in there
  still opens onto Home after a reopen
- A reload on a trip's address opens that trip
- Google sign-in works on the public address for a Google account that
  was never a test user, in the browser and from the home screen icon
  on an iPhone
- On Android Chrome, "Install app" opens the browser's prompt. If no
  Android phone is at hand, say so; an emulated screen does not prove
  it
- The privacy policy link opens the page on the public address
- A shared link shows the app's name, description, and picture
- The scheduled request has run at least once on its own
- The exported files hold no model key and no secret key
- The site still offers account deletion and the privacy policy link
- `npx tsc --noEmit` and `npx expo-doctor` pass, with the known exception
  for the Expo config schema check recorded in @AGENTS.md
- Someone other than the author can tell, from the first screen, what
  the app does

## References

- @context/project-overview.md
- @context/features/spec16-account-and-store.md
- @context/features/spec18-password-reset-and-email.md
- @AGENTS.md — the Google test-user gate, and the expo-doctor exception
