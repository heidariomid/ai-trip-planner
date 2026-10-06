# Current Feature: Supabase Setup & Authentication

## Status

In Progress — the app shell is in place (Expo Router, NativeWind). Nothing
auth-related is built yet; the Supabase project itself does not exist.

## Goals

- Supabase project connected, with `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` read from `.env` and a committed
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

**Email confirmation — OFF** for this phase, so sign-up returns a session
immediately and there is only one path to build. It is a development
setting: with it off anyone can register an email address they do not
own, so it must go back on before release, and that will need a "check
your email" state this phase does not build.

**Constraint that shaped the spec:** the app runs in **Expo Go**, so
`@react-native-google-signin/google-signin` is not an option — it is a
native module and needs a development build. Google auth therefore uses
the browser-based OAuth flow. The native sheet is nicer and can be adopted
later, as a deliberate move to a dev build.

**Watch for:** the Expo Go OAuth redirect (`exp://127.0.0.1:8081/--/`)
contains the dev machine's LAN IP, so it changes between networks. Both
`aitripplanner://**` and `exp://**` need allowlisting in Supabase.

**Publishable key, not `anon`:** Supabase is deprecating the `anon` and
`service_role` JWTs by the end of 2026. A new project should use
`sb_publishable_…` from the start. `.env` and `.env.example` already carry
the new name.

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
- Expo Router migration — `main` is `expo-router/entry`, `App.tsx` and
  `index.ts` deleted, `app/_layout.tsx` + `app/index.tsx` added, `scheme`
  and `typedRoutes` in `app.json`. Verified on the iPhone 17 simulator:
  bundles clean and the route renders
- `.env` and `.env.example` created with empty values, using
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Adopted Tailwind via NativeWind 4.2.7 as the styling system for the
  whole project, replacing `StyleSheet.create`. The sign-in and sign-up
  screens in this phase are the first real test of it
