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
- fix: revoke execute on handle_new_user from anon and authenticated
- feat: adopt minimal design system with a single-source theme
- feat: add the three-tab app shell with Outfit and a floating tab bar
  (spec 3)
- feat: add the create-trip form, the trip card, and the signed-URL
  storage helper (spec 4)
- feat: add the trip screen, the itinerary timeline, trip editing with
  reschedule_trip, and trip deletion (spec 5)
- feat: add explore plans with copy to a trip, the new Home layout, and
  ticked planning progress (spec 6)
- fix: give the AI planning card a soft wash and put the greeting on
  one line that follows the clock
- feat: add bookings for flights, car rentals, hotels, and extras
  (spec 7)
- feat: add the packing list and count packed items in planning
  progress (spec 8)
- feat: add the trip photo gallery and notes, with one shared image
  upload (spec 9)
- feat: add the editable profile with an avatar upload and interest
  tags (spec 10)
- feat: add the AI chat with a streaming Gemini Edge Function, saved
  threads, and a daily cap (spec 11)
- feat: let the chat create trips, save drafts, add days and bookings,
  show place photos, and keep past conversations (spec 12)
- feat: add booking details, a Persian font with right-to-left text,
  and chat packing and booking options
- feat: generate trip covers with AI through Cloudflare Workers AI, with
  a daily cap (spec 13)
- feat: add saved places with a heart on chat place cards, a list from
  Profile, and a city on every place card (spec 14)
- feat: add family share with join codes, member roles, and a
  read-only trip for viewers (spec 15)
