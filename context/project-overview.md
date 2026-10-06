# Project Overview — AI Trip Planner

✈️ A mobile app that plans a trip for you. You say where you are going and
what you like; the app produces a day-by-day itinerary you can save, edit
and take with you.

---

## The product

| | |
| --- | --- |
| Name | AI Trip Planner |
| Slug / package | `ai-trip-planner` |
| Platforms | iOS and Android, from one Expo codebase |
| Audience | An individual traveller planning their own trip |
| Language | English, left-to-right |

There is no client and no admin panel. The traveller is the only user, and
every screen is something they see.

---

## Current state

Honest baseline, so no phase assumes work that does not exist:

- `App.tsx` renders a single centered placeholder screen
- No navigation, no auth, no database, no AI, no storage
- Built from the `blank-typescript` template; entry is `index.ts`
- Nothing has been deployed. No EAS build, no store listing

Everything below the setup phase is still to build.

---

## Approach — a thin vertical slice at a time

Each phase ships something you can open on a phone and use. The order is
chosen so the risky, hard-to-change decisions land first: auth and the
data model before AI, because changing where a trip is stored after three
screens read from it is expensive, and changing a prompt is not.

The matching rule is that **nothing is built before its data has a home**.
An itinerary screen with hardcoded days looks finished and teaches nothing
about whether the schema works.

---

## Why Supabase

One account gives this project the three things it needs, which otherwise
mean three vendors and three integrations:

- **Auth** — email/password and Google, with session refresh handled for us
- **Postgres** — real relational tables for trips and itineraries, with
  row-level security so a traveller can only ever read their own rows
- **Storage** — buckets for trip images and documents

The alternative was Firebase. Postgres is the deciding factor: a trip has
days, a day has activities, and that is a join, not a document tree.
Row-level security also means authorisation lives next to the data instead
of being re-implemented in every screen.

**Supabase is not an AI provider.** The model that writes itineraries is a
separate decision, deliberately deferred.

---

## Data model

Full field definitions live in the phase specs. The shape:

- **profiles** — one row per user, keyed to `auth.users.id`. Display name,
  avatar, preferences. Created automatically the first time someone signs up
- **trips** — one row per trip: destination, dates, budget, owner
- **itinerary** — the day-by-day plan belonging to a trip
- **Storage buckets** — `images` for trip photos, `documents` for tickets
  and bookings

`auth.users` is owned by Supabase and must not be written to directly.
`profiles` is the table we own and extend.

---

## Screens

| Route | Purpose | Phase |
| --- | --- | --- |
| Sign in | Email/password and Google | 1 |
| Sign up | Create an account | 1 |
| Home | Trips the traveller has saved | later |
| New trip | Destination, dates, preferences | later |
| Itinerary | The day-by-day plan | later |
| Profile | Account and preferences | later |

Only phase 1 is specified. The rest are named so the navigation built in
phase 1 has somewhere to go, not because they are designed.

---

## Tech stack

| Category | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86 |
| Language | TypeScript, strict |
| UI | React Native core components and `StyleSheet` — no component library |
| Navigation | Expo Router (file-based), adopted in phase 1 |
| Backend | Supabase — Postgres, Auth, Storage |
| AI | Not chosen yet, deliberately |
| Package manager | npm, via `npx expo install` |
| Tests | None — manual verification on device |

Versions are authoritative in @AGENTS.md, not here. One place to update.

---

## Out of scope

Deliberately excluded for now. Possible later:

- Payments or booking — the app plans a trip, it does not sell one
- Offline-first sync
- Collaborative trips with more than one editor
- Push notifications
- Web as a supported target. `react-native-web` is installed from the
  template and is not maintained as a real platform
- Multi-language and RTL

---

## Success criteria

1. A traveller can sign up, close the app, reopen it, and still be signed in
2. Their trips are visible to them and provably invisible to anyone else
3. Describing a trip produces a usable day-by-day itinerary
4. The app runs on a real iPhone, not only in a bundler
5. No secret ever ships inside the app bundle

---

## Build phases

See @context/features/:

1. @context/features/phase-1-supabase-auth-spec.md — Supabase setup, sign-in
   and sign-up with email/password and Google, a `profiles` row written on
   first sign-up, and session persistence
2. Trips — create and list a trip; the `trips` table and its RLS policies
3. Itinerary — the day-by-day plan and the `itinerary` table
4. AI generation — choose a provider, generate an itinerary from a prompt
5. Storage — trip images and documents
6. Polish and release — EAS build, icons, store listing

Phases 2 onward are titles, not specs. Write the spec when the phase
starts, with what was learned from the phase before it.
