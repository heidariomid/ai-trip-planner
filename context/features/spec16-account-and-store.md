# Spec 16 — Account and Store Compliance

## Overview

Spec 16 of 17. Depends on spec 1 and spec 10. It comes before spec 17.

The app lets someone create an account. It also has to let them reset a
password, delete that account, and read a privacy policy. Apple rejects
an app that creates accounts and cannot delete them. Google sign-in is
already offered, so iOS also needs Sign in with Apple.

## Requirements

- Password reset starts from Sign In. The traveller enters an email and
  gets a readable confirmation either way, so the screen does not reveal
  whether the address exists. The message carries a six-digit code, the
  `{{ .Token }}` in the recovery template, not a link. They type the
  code in the app, `verifyOtp` with type `recovery` accepts it, and they
  set a new password. A link in Mail cannot open Expo Go: `aitripplanner://`
  is not registered there, and Supabase rejects `exp://` with a LAN host.
  Failures are sentences
- The built-in Supabase sender is not enough. It allows only a few
  emails an hour and delivers only to the project team's addresses.
  This step configures a custom SMTP provider before reset is tested.
  Spec 17 turns email confirmation back on and uses that same provider.
  Do not add a second one
- Delete account sits on Profile, behind a confirmation that says the
  trips go with it. The client cannot delete `auth.users` with the
  publishable key. An Edge Function deletes the signed-in user only,
  after removing their Storage objects under their id prefix. The
  database cascade then removes the profile, the trips, and the rows
  that belong to those trips. Sign-out is not deletion
- A privacy policy URL is linked from Sign Up and from Profile. The same
  URL is the one spec 17 puts on the store listing. The spec does not
  invent the legal text. The link has to open a real page
- Sign in with Apple on iOS, because Google sign-in is offered. One
  flow, the browser OAuth path already used for Google, so it still runs
  in Expo Go. It needs a Services ID and a client secret. That secret
  expires and has to be regenerated at least every six months. It does
  not use the native Sign in with Apple entitlement. That entitlement
  belongs to the native sheet, which Expo Go cannot run
- A paid Apple Developer account is required before this step can be
  verified. The Services ID and the secret are created there. Without
  it, the button cannot be tested, and the spec is not done
- Email change stays out

## Out of scope

- Changing the email address on an existing account
- A native Apple sign-in sheet that needs a module Expo Go cannot run
- Writing the privacy policy's legal text inside the repo as a substitute
  for a page the store can link to

## Done when

- On a phone, request a reset. The code arrives at an address that is
  not a member of the Supabase project. Type it in the app, set a new
  password, and sign in with it. No mail link is involved
- Delete an account. The user is gone from Authentication, the profile
  and trips are gone, and a cold start lands on Sign In. Signing in with
  the old password fails
- Sign Up and Profile both open the privacy policy
- Sign in with Apple creates one user and one profile, the same way
  Google does
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- @context/features/spec10-profile.md
- Apple guideline 5.1.1(v) for account deletion, and guideline 4.8 for
  Sign in with Apple when another social login is offered
