# Current Feature: Supabase Setup & Authentication

## Status

Not Started

## Goals

- Expo Router replaces the template entry point, and the app still boots
  on the phone before any auth code is added
- Supabase project connected, with `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` read from `.env` and a committed
  `.env.example`
- A single Supabase client in `lib/supabase.ts`, using AsyncStorage for the
  session, `detectSessionInUrl: false`, and an `AppState` listener driving
  token auto-refresh
- **Sign Up** screen: full name, email, password, confirm password, plus a
  Google button
- **Sign In** screen: email, password, plus a Google button
- Email/password auth working, with readable errors for a duplicate email
  and a wrong password
- Google auth working through the browser flow (`signInWithOAuth` +
  `expo-web-browser`), so it still runs in Expo Go
- A `profiles` table with RLS on, and a row written automatically the first
  time anyone signs up — by either provider
- Session persists across a cold start, with no flash of the sign-in screen
- A placeholder home screen that proves the session works

## Notes

Spec: @context/features/phase-1-supabase-auth-spec.md

**Both open decisions are now settled:**

1. **Navigation — Expo Router.** This rewrites the entry point:
   `package.json` `main` becomes `expo-router/entry`, and `App.tsx` /
   `index.ts` are replaced by `app/_layout.tsx`. Do the migration first
   and on its own, and confirm the app boots before adding Supabase. If
   both land together, a blank screen has two possible causes.
2. **Email confirmation — OFF** for this phase, so sign-up returns a
   session immediately and there is only one path to build. It is a
   development setting: with it off anyone can register an email address
   they do not own, so it must go back on before release, and that will
   need a "check your email" state this phase does not build.

**Constraint that shaped the spec:** the app runs in **Expo Go**, so
`@react-native-google-signin/google-signin` is not an option — it is a
native module and needs a development build. Google auth therefore uses
the browser-based OAuth flow. The native sheet is nicer and can be adopted
later, as a deliberate move to a dev build.

**Watch for:** the Expo Go OAuth redirect (`exp://127.0.0.1:8081/--/`)
contains the dev machine's LAN IP, so it changes between networks. Both
`aitripplanner://**` and `exp://**` need allowlisting in Supabase.

**Written by trigger, not by the app:** the `profiles` row is created by an
`after insert` trigger on `auth.users`. A client-side insert would miss
Google sign-ups entirely and cannot run before a session exists.

Out of scope: `trips`, `itinerary`, storage buckets, password reset,
profile editing, anything AI.

## History

- Init — `blank-typescript` Expo app, single placeholder screen
- Adopted the bakery project's context workflow: `context/` docs, the
  `/feature` skill, and the cleanup rule, adapted from a Next.js/Payload
  web app to an Expo/React Native app with Supabase
