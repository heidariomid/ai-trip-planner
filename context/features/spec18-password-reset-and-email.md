# Spec 18 — Password Reset and Email

## Overview

Spec 18 of 19. Depends on spec 1 and spec 16. Not scheduled: the user
left email out of the first release on 2026-10-09. Build it when
travellers outside the team need to recover an account.

Everything the app sends by email lives here: the password reset code,
and turning email confirmation back on at sign-up.

## Requirements

- The provider is Resend on its free tier (user decision, 2026-10-09),
  set as the project's custom SMTP. It needs a domain the user owns,
  verified with Resend; a free hosting subdomain cannot be used. The
  built-in Supabase sender is not enough: it allows 2 emails an hour
  and delivers only to the project team's addresses. Check Resend's
  current limits and price before starting. Do not add a second
  provider
- SMTP, the recovery template, and the code length are set through the
  Management API, the way spec 1 set the auth config. After custom SMTP
  the project is limited to 30 emails an hour until that is raised
- Password reset starts from Sign In. The traveller enters an email and
  gets the same readable confirmation either way, so the screen does
  not reveal whether the address exists. The message carries a
  six-digit code, the `{{ .Token }}` in the recovery template, not a
  link
- One screen in `(auth)`, `reset-password`: the email first, then the
  code and the new password together. `verifyOtp` with type `recovery`
  accepts the code and then `updateUser` saves the password
- **`verifyOtp` creates a session at once.** The route guard in
  `app/_layout.tsx` only looks at the session, so without a change the
  traveller lands on Home before a new password is saved. `useAuth`
  holds a recovery state that keeps the guard closed until `updateUser`
  finishes. After that the same session opens Home; there is no second
  sign-in
- Failures are sentences: an expired or wrong code, a password that is
  too weak or the same as the old one, and too many requests
- Email confirmation goes back on. `mailer_autoconfirm` returns to
  false. Sign-up with no session shows a "check your email" state.
  Spec 1 left that path in `signUpWithEmail` on purpose

## Out of scope

- Changing the email address on an existing account
- Sign-in by magic link or by code
- A link in the reset email. On a phone a link opens the browser, not
  the home screen app, which has its own storage

## Done when

- Request a reset. The code arrives at an address that is not a member
  of the Supabase project. Type it in the app, set a new password, and
  sign in with it. Home never shows before the password is saved
- An address with no account gets the same message and no email
- A new account must confirm its email before a session exists, and an
  account that is already signed in still opens onto Home
- `npx tsc --noEmit` passes

## References

- @context/features/spec1-auth.md — email confirmation was turned off there
- @context/features/spec16-account-and-store.md
- `docs/spec16-pre-review.fa.md` — where the session finding came from
