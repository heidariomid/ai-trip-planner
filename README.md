<div align="center">

<img src="assets/icon.png" width="96" alt="AI Trip Planner icon" />

# AI Trip Planner

**Tell it where you're going. Get a day-by-day trip you can edit, share, and take with you.**

One Expo codebase that runs as an installable web app and in Expo Go,
backed by Supabase, with an AI assistant that proposes and a traveller who decides.

![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%C2%B7%20Auth%20%C2%B7%20Storage-3ECF8E?logo=supabase&logoColor=white)
![NativeWind](https://img.shields.io/badge/NativeWind-Tailwind-38BDF8?logo=tailwindcss&logoColor=white)

</div>

---

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Status and limits](#status-and-limits)

---

## What it does

| | |
| --- | --- |
| **Plan with AI** | Chat with an assistant that streams its reply and answers with cards: a trip, numbered days, places with photos, bookings, and a packing list. One tap turns a card into real data. |
| **Trips** | Create a trip with a cover, then build its itinerary as a timeline per day. Tick activities off as you go. |
| **Bookings** | Record flights, car rentals, hotels, and extras, with confirmation codes and notes. The app records a plan; it does not sell tickets. |
| **Packing, photos, notes** | A packing list grouped by your own categories, a photo gallery, and notes, all per trip. |
| **Explore** | Curated plans you can open read-only and copy into a trip of your own. |
| **AI covers** | Generate a cover picture for a trip from its title and destination. |
| **Saved places** | Put a heart on a place the assistant recommends and find it later, with a link to Google Maps. |
| **Family share** | Share a trip with a join code. People join as viewers, the owner can make them editors, and each role sees only the controls it may use. |
| **Account** | Email and Google sign-in, an editable profile with interest tags, a privacy policy, and real account deletion. |
| **Installable** | Add it to a phone's home screen and it opens full screen, like an app. |

Persian text is supported throughout: it is drawn in its own font and reads right to left, inside an otherwise left-to-right interface.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, React 19 |
| Language | TypeScript, strict mode |
| Navigation | Expo Router (file-based, typed routes) |
| Styling | Tailwind through NativeWind 4, with one theme file as the source for every colour |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions (Deno) |
| Auth | Email and password, and Google through the browser flow so it runs in Expo Go |
| Icons and type | Lucide icons, Outfit for Latin text |
| AI | Google Gemini for the chat, FLUX.2 klein on Cloudflare Workers AI for covers, Wikipedia for place photos |

Every model call goes through a Supabase Edge Function, so model keys never reach the app. The model only proposes; the app saves after a tap.

## Getting started

### Prerequisites

- Node.js 20.19 or newer
- A free [Supabase](https://supabase.com) project
- [Expo Go](https://expo.dev/go) on a phone, or a browser

### 1. Install

```bash
git clone https://github.com/heidariomid/ai-trip-planner.git
cd ai-trip-planner
npm install
```

### 2. Configure the app

```bash
cp .env.example .env
```

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your publishable key (`sb_publishable_…`) |
| `EXPO_PUBLIC_SITE_URL` | Optional. The public address of the web app, once it has one |

Only `EXPO_PUBLIC_*` values reach the bundle. Never put a secret key in this file.

### 3. Set up the database

Run the files in [`supabase/migrations/`](supabase/migrations/) in order, from `0001` to `0020`, in the Supabase SQL editor or with the Supabase CLI. They create every table, policy, function, and Storage bucket.

### 4. Deploy the Edge Functions

Deploy the four functions in [`supabase/functions/`](supabase/functions/) and set their secrets:

| Function | Secrets | Used for |
| --- | --- | --- |
| `chat` | `GEMINI_API_KEY` | The assistant |
| `trip-cover` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Generated covers |
| `delete-account` | none (uses the project's own service key) | Account deletion |
| `place-photo` | `GOOGLE_PLACES_API_KEY` | Optional. Built and switched off; place photos come from Wikipedia by default |

The app works without the AI secrets: the assistant and the cover tile answer with a plain "not set up yet" sentence.

### 5. Enable sign-in

Email and password works as soon as the project exists. For Google, enable the Google provider in Supabase Auth with a **Web application** OAuth client, and add your address to the redirect allow list.

### 6. Run

```bash
npm start          # dev server, scan the QR code with Expo Go
npm run web        # open in the browser
npx tsc --noEmit   # typecheck
```

To open the web app on a phone, type the dev server's address with `http://` into the phone's browser instead of scanning the QR code.

## Project structure

```
app/               Routes (Expo Router)
  (auth)/          Sign in, sign up
  (app)/           The signed-in app: tabs, trip, chat, explore, profile
components/        Hand-rolled UI. No component library
hooks/             State and data for screens
lib/               Supabase client, data helpers, theme
supabase/
  migrations/      The schema, as ordered SQL files
  functions/       Edge Functions (Deno)
types/             Generated database types
public/            Web app manifest, icons, privacy policy
context/           Product overview, design system, and one spec per feature
docs/              Design reviews written before and after each feature
```

## Status and limits

- Specs 1 to 16 are built. The public web release is in progress, and password reset by email comes after it.
- Email confirmation is off, so an account can be made with an unverified address and a forgotten password cannot be recovered yet.
- The AI runs on free tiers. The allowance is shared by everyone, and on the free Gemini tier Google may use prompts to improve its products.
- There is no offline mode, no push notifications, and no App Store or Google Play build.
