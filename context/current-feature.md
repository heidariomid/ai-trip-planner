# Current Feature

## Status

<!-- Not Started | In Progress | Complete -->

## Goals

<!-- Bullet points of what success looks like -->

## Notes

<!-- Additional context, constraints, or details from the spec -->

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
- chore: add context workflow and phase 1 auth spec
- feat: migrate to Expo Router and adopt Tailwind via NativeWind
- feat: add Supabase email and Google auth
- feat: add trips, itinerary, and storage schema (spec 2)
