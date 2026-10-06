# Spec 17 — Release

## Overview

Spec 17 of 17. Depends on spec 16, and on the traveller-facing steps you
intend to ship. Do not start this because the number is next.

An EAS build, the store listing, and the auth setting that must not stay
off. Account deletion, the privacy policy, and Sign in with Apple are
already required by spec 16. This step checks they are still there.

## Requirements

- Email confirmation goes back on. `mailer_autoconfirm` returns to false.
  Sign-up with no session shows a "check your email" state. That state
  does not exist yet. Spec 1 left the path in `signUpWithEmail` on
  purpose. The message uses the custom SMTP provider from spec 16. The
  built-in sender is not turned back on
- Icons, splash, and the display name match the app the traveller has
  been using. No cool-grey placeholder icon
- An EAS build for iOS. Android when a device or a tester is available.
  Do not commit `ios/` or `android/`
- The Google consent screen is still in Testing until Branding is filled
  in. Shipping to people outside the test-user list requires publishing
  that screen. Call that out in the release notes for this step. Do not
  pretend the test-user cap went away
- The store listing uses the privacy policy URL from spec 16
- Sign in with Apple stays the browser flow from spec 16. Do not add the
  native Sign in with Apple entitlement. Before the build ships, the
  Apple client secret has more than a month left before it must be
  regenerated
- The bundle contains the publishable key only. No secret key, no service
  role, no model key
- Remove any draft or debug entry points that a store build should not
  have

## Out of scope

- A new feature. If the store build wants a feature that has no spec, write
  the spec first
- Web as a store target

## Done when

- A release build installs on a phone, a new account must confirm email
  before a session exists, and an already signed-in account still opens
  onto Home
- The build still offers account deletion, the privacy policy link, and
  Sign in with Apple
- `npx tsc --noEmit` and `npx expo-doctor` pass, with the known exception
  for the Expo config schema check recorded in @AGENTS.md
- Someone other than the author can tell, from the listing, what the app
  does

## References

- @context/project-overview.md
- @context/features/spec16-account-and-store.md
- @context/features/spec1-auth.md — email confirmation was turned off there
- @AGENTS.md — the Google test-user gate, and the expo-doctor exception
