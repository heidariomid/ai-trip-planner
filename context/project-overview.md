# Project Overview — AI Trip Planner

A mobile app that plans a trip for you. You say where you are going and
what you like; the app produces a day-by-day itinerary you can save, edit,
share with family, and take with you.

The picture source is the five boards in @context/plan/. This file is the
text those boards become. The boards decide layout and content; how a
screen looks is decided by @context/design-system.md. Field-level detail lives in the spec for the
step that builds it.

---

## The product

| | |
| --- | --- |
| Name | AI Trip Planner |
| Slug / package | `ai-trip-planner` |
| Platforms | iOS and Android, from one Expo codebase |
| Audience | A traveller planning their own trip, who can later invite family |
| Language | English, left-to-right |

There is no client and no admin panel. Every screen is something the
traveller sees.

Three tabs: **Home**, **My Trips**, **Profile**. A trip opens onto its
own screen with nested tabs. The AI assistant is its own screen, opened
from Home and from a trip.

---

## Current state

Specs 1 through 11 are done. Specs 12 through 17 are written and not built.

- Expo Router, email and Google sign-in, and a `profiles` row on first
  sign-up. Verified on Expo Go and web
- The signed-in app is three tabs: Home, My Trips, and Profile. Home is
  a greeting, the AI planning card (drawn, not wired), a row of popular
  destinations, and the trips still to continue
- A traveller can add a trip with a cover. The trip card shows on Home
  and My Trips, newest first, with a planning progress bar that counts
  the activities ticked off. Checked on web, not yet on a phone
- A trip opens onto its own screen: a banner, the itinerary as a
  timeline per day, Bookings, and empty Packing, Photos, and Notes
  sections. A trip can be edited, rescheduled, and deleted. The place
  on an activity opens Google Maps. Checked on web, not yet on a phone
- Explore plans are seeded in the database. One opens read-only and
  copies into a trip the traveller owns, with its days, its activities,
  and the plan's picture as the cover. Checked on web, not yet on a
  phone
- A trip records flights, car rentals, hotels, and extras, each added,
  edited, and deleted inline. One flight was checked on web; the rest
  and the phone are not checked yet
- A trip has a packing list grouped by categories the traveller types.
  Packed items count toward the planning progress bar. Not yet checked
  on web or on a phone
- A trip has a photo gallery, separate from its cover, and a list of
  notes. Not yet checked on web or on a phone
- The Profile tab shows the traveller's avatar, name, email, and
  interest tags, and an Edit profile screen changes the name, uploads an
  avatar, and picks up to 6 tags from a fixed list. Not yet checked on
  web or on a phone
- The assistant opens from the Home ask bar and from a trip. It streams
  replies from Google Gemini through a Supabase Edge Function, shows
  day cards, place cards, and suggestion chips, saves the conversation,
  and is capped at 30 requests a day. It cannot create or change a trip
  yet. The user saw it answer on a phone

No app build has been deployed: no EAS build, no store listing. The
`chat` Edge Function is deployed on the Supabase project.

---

## Approach — one spec at a time

The build order is @context/features/spec1-auth.md through
@context/features/spec17-release.md. A step does not start before the
one it depends on.

Auth and the data model come before AI, because changing where a trip is
stored after several screens read from it is expensive, and changing a
prompt is not. Nothing is built before its data has a home. An itinerary
screen with hardcoded days looks finished and teaches nothing about
whether the schema works.

Each step from spec 3 on should be something you can open on a phone.

---

## Why Supabase

One account gives this project Auth, Postgres, and Storage.

Postgres is the deciding factor over Firebase. A trip has days, a day has
activities, and bookings, packing, and members are further joins. That is
not a document tree. Row-level security keeps authorisation next to the
data.

**Supabase is not an AI provider.** The model is Google Gemini, chosen in
spec 11 and called from a Supabase Edge Function.

---

## What the boards show

**Home.** A greeting, a strip of destination art, an "Ask me here" bar,
and filters: My Plan, Explore, All Plans, Active. Explore cards show a title, a
day count, a rough cost, a place count, tags, and a small map picture.
The ask bar is the way into the assistant. The mic icon is drawn and does
not listen. The map picture is art, not a live map. A traveller's own trip card
is different: cover, title, source and destination, dates, day count,
an Upcoming, Ongoing, or Past badge, and from spec 8 a planning
progress bar computed from days planned and items packed. The tab bar
floats. Icons are Lucide and the font is Outfit.

**My Trips.** The traveller's own trips as cards. Active means today
falls inside the trip's dates. Drafts, once they exist, are a status
added in spec 12, not a column on the first migration.

**Add a trip.** Title, source, destination, start and end date, a cover
image, a description of at most 200 characters, and an optional traveler
count. Dates default to today and today plus 3. Day count is computed
from the two dates and is not stored. Save calls one database function
that writes the trip and its days together, uploads the image, and shows
the card. Source and destination are text. There is no place-search API
in this app yet. The cover is a private Storage path, shown with a signed
URL. Generating the cover with AI is its own step, spec 13.

**Trip details.** A banner, then Itinerary, Bookings, Packing, Photos,
and Notes. The banner menu can delete the trip and its files. Notes is
on the share board and not on the first trip board; it is still part of
the product. Each section adds, edits, and deletes inline. Bookings
splits into flights, car rental, hotels, and extra. The app records
those. It does not sell tickets.

**Explore.** Curated plans, separate from the traveller's trips. Opening
one is read-only. Copying one asks for a start date and creates a trip
they own, with its days and activities, and no cover of its own.
Category chips filter the list. From spec 12 a plan can also open the
chat with a message already typed.

**Profile.** Name, avatar, sign out, and interest tags the assistant can
read. Saved places come later. Joining a family trip is one code field,
not a list of the owner's codes. Password reset, account deletion, and a
privacy policy come before release.

**AI chat.** A streaming conversation about the selected trip. Chips,
day cards, and place cards. Place cards are text and a placeholder,
because there is no photo API. Spec 11 only talks, and it caps how many
requests one account can make in a day. Spec 12 is allowed to create a
trip, save a draft, regenerate, save a day card's activities onto an
existing day, and update bookings. It never inserts a day. Days come
from the trip's dates. The assistant reads the selected trip's
itinerary so it does not repeat a place. Spec 13
generates the cover, on the form and automatically for a trip created
in the chat. Hearts on a place card are spec 14.

**Family share.** From the trip, a member list and a join code. The
joiner types the code on a Join a trip screen opened from Profile.
Roles are owner, can edit, and can view. An editor can change the trip
and add photos. Only the owner can delete it. The member rows on the board win where they disagree
with the looser permission grid. Sharing does not use Supabase Realtime.
The screen refetches when it gains focus.

---

## Data model

Full columns live in the spec that creates the table.

| What | Created in | Shape |
| --- | --- | --- |
| `profiles` | spec 1, extended in spec 10 | one row per user, keyed to `auth.users.id`. `avatar_url` is the provider's public picture; `avatar_path` is an uploaded one |
| `trips` | spec 2 | title, source, destination, dates, cover path, description, traveler count, owner |
| `itinerary_days` | spec 2 | one row per day of a trip |
| `itinerary_activities` | spec 2 | start time, end time, place, activity, note, belonging to a day |
| `images`, `documents` | spec 2 | private buckets. Documents have no screen until a later ticket file needs one |
| explore plans | spec 6 | seeded, with a category, readable by any signed-in user, copied into `trips` |
| bookings | spec 7 | four tables: flights, car rentals, hotels, extras |
| packing items | spec 8 | category, label, packed |
| trip photos, notes | spec 9 | gallery separate from the cover; a list of notes |
| interest tags | spec 10 | `interests` on `profiles`, at most 6 from a fixed list |
| chat | spec 11 | threads and messages. A card in a message is a transcript, not the itinerary |
| `trips.status` | spec 12 | `active` or `draft` |
| cover generation | spec 13 | a second model, Google Gemini `gemini-3.1-flash-lite-image`, writing only the cover file |
| saved places | spec 14 | a heart on a place, listed on Profile |
| members, join code | spec 15 | owner stays on `trips`. Other people are members. Join is a function |
| account | spec 16 | password reset, deletion, privacy policy, Sign in with Apple |

`auth.users` is owned by Supabase and must not be written to directly.

Reads go through `private.can_access_trip`. The select policy on `trips`
also allows `(select auth.uid()) = user_id`, so an insert can return the
new row in the same statement. Inserts and updates go through
`private.can_edit_trip`. Deleting a trip is owner-only. Spec 2 creates
both functions with the same body: the signed-in user owns the trip.
Spec 15 replaces the two bodies so a viewer can read and an editor can
write. It does not add a second policy on every table, and it does not
let an editor delete the trip. Creating a trip is `public.create_trip`,
which writes the trip and its days in one transaction. Spec 4, spec 6,
and spec 12 all call it. Changing those dates later is
`public.reschedule_trip` in spec 5, also one transaction. Spec 12 drops
the old function before adding the `status` argument.

Budget is not a column on `trips`. A rough cost appears on Explore cards
and inside the chat.

---

## Screens

| Screen | Spec |
| --- | --- |
| Sign in, sign up | 1, done |
| Home, My Trips, Profile shell | 3, done |
| Add a trip, and the trip card | 4, done |
| Trip banner and itinerary | 5, done |
| Explore, and copy into My Trips | 6, done |
| Bookings | 7, done |
| Packing | 8, done |
| Photos and notes | 9, done |
| Edit profile and interest tags | 10, done |
| AI chat | 11, done |
| AI creates and updates a trip | 12 |
| AI cover image | 13 |
| Saved places | 14 |
| Family share | 15 |
| Account, privacy policy, Sign in with Apple | 16 |

---

## Tech stack

| Category | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86 |
| Language | TypeScript, strict |
| UI | NativeWind. No component library. Look in @context/design-system.md |
| Navigation | Expo Router, adopted in spec 1 |
| Backend | Supabase — Postgres, Auth, Storage |
| AI | Google Gemini `gemini-3.5-flash-lite`, called from a Supabase Edge Function |
| Package manager | npm, via `npx expo install` |
| Tests | None — manual verification on device |

Versions are authoritative in @AGENTS.md, not here.

---

## Out of scope

- Buying flights, rooms, or tickets. The app records a plan
- Offline-first sync
- Push notifications
- Supabase Realtime. Family share refetches on focus
- Voice input. The mic icon is not a feature
- A live map. The pin and the mini map are static art
- A place-search or geocoding API
- A travelers table. Traveler count is a number on the trip
- A document-upload screen. The `documents` bucket exists for a later file
- Web as a supported target. `react-native-web` is installed and is not
  maintained as a real platform
- Multi-language and RTL

---

## Success criteria

1. A traveller can sign up, close the app, reopen it, and still be signed in
2. Their trips are visible to them and invisible to anyone else, until they
   share a trip on purpose
3. A trip has real days and activities, bookings, a packing list, and photos
4. Describing a trip in the chat can create or update that trip
5. A family member can join with a code and see only what their role allows
6. A traveller can delete the account the app let them create
7. The app runs on a real iPhone, not only in a bundler
8. No secret ever ships inside the app bundle

---

## Build specs

Do them in this order. Each file says what it ships, what it depends on,
and when it is done.

1. @context/features/spec1-auth.md — sign up, sign in, `profiles`. Done
2. @context/features/spec2-database-and-storage.md — `trips`, itinerary
   days and activities, private buckets. No screens. Done
3. @context/features/spec3-app-shell.md — the three tabs. Done
4. @context/features/spec4-create-trip.md — the add-trip form and the card.
   Done
5. @context/features/spec5-trip-itinerary.md — the trip screen and its days.
   Done
6. @context/features/spec6-explore.md — curated plans, copied into My Trips.
   Done
7. @context/features/spec7-bookings.md — flights, cars, hotels, extras.
   Done
8. @context/features/spec8-packing.md — the checklist. Done
9. @context/features/spec9-photos-and-notes.md — gallery and notes. Done
10. @context/features/spec10-profile.md — name, avatar, interest tags.
    Done
11. @context/features/spec11-ai-chat.md — the assistant talks, and does not
    write a trip. Done
12. @context/features/spec12-ai-trip-actions.md — create, draft, and update
13. @context/features/spec13-ai-cover.md — generate a cover, separate from
    writing trip rows
14. @context/features/spec14-saved-places.md — hearts, listed on Profile
15. @context/features/spec15-family-share.md — members and a join code
16. @context/features/spec16-account-and-store.md — password reset, account
    deletion, privacy policy, Sign in with Apple
17. @context/features/spec17-release.md — EAS, icons, email confirmation on
