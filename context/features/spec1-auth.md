# Spec 1 — Authentication

This step is complete.

## Overview

Spec 1 of 17. Connect the app to Supabase and ship the two screens that
let a traveller get an account: **Sign Up** and **Sign In**. Email and
password, plus Google. The first time someone signs up, their details are
saved to our own `profiles` table.

**Nothing exists yet.** `App.tsx` is still the template's "Hello World"
and there is no navigation. This phase therefore also has to decide how
the app gets from one screen to another — see *Navigation* below.

This phase is done when a traveller can create an account on a real
phone, close the app, reopen it, and still be signed in — with a matching
row in `profiles`.

## Requirements

### Supabase project

- Create a Supabase project. Note the **Project URL** and the
  **publishable key** (`sb_publishable_…`), from the Connect dialog or
  **Settings → API Keys**
- Use the publishable key, not the legacy `anon` JWT. Supabase is
  deprecating `anon` and `service_role` by the end of 2026, and both key
  systems work side by side until then. A long key starting with `eyJ` is
  the old one
- The publishable key is designed to ship in a client and is safe in the
  bundle. The **secret key (`sb_secret_…`) must never enter this repo**
- Keep every schema change as a `.sql` file under `supabase/`, so the
  database is reproducible and reviewable. Clicking SQL into the dashboard
  and not saving it leaves no record of how the schema got there

### Environment

Only `EXPO_PUBLIC_*` variables reach the app at runtime.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Commit `.env.example` with these names and placeholder values. `.env`
itself stays gitignored.

### Dependencies

Install with `npx expo install` so versions match SDK 57:

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npx expo install expo-auth-session expo-web-browser expo-linking expo-crypto
```

Navigation packages depend on the decision below.

> `react-native-url-polyfill` is not optional. React Native's `URL` is
> incomplete, and `supabase-js` builds request URLs with it.

### Supabase client

One client, created once in `lib/supabase.ts`, imported everywhere. Never
call `createClient` inside a component.

```ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(URL, PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

Two details that are wrong by default on mobile:

- `detectSessionInUrl: false` — that option is for web, where the token
  arrives in the browser URL. Leaving it on causes errors in React Native
- **`AppState` auto-refresh.** Register a listener once, next to the
  client, that calls `supabase.auth.startAutoRefresh()` when the app
  becomes active and `stopAutoRefresh()` when it backgrounds. Without it a
  token can expire while the app is backgrounded and the traveller is
  silently signed out on return

Why `AsyncStorage` and not `expo-secure-store`: SecureStore is the more
secure option, but it has a per-value size limit that a Supabase session
can exceed, and the failure mode is a session that will not persist. If we
move to SecureStore later it needs a chunking wrapper. Use AsyncStorage
now and revisit before release.

### Database — `profiles`

`auth.users` belongs to Supabase and must not be written to directly.
`profiles` is the table we own.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | references `auth.users(id)` on delete cascade |
| `email` | `text` | copied at sign-up for convenience |
| `full_name` | `text` | from the sign-up form, or Google |
| `avatar_url` | `text` | null for email sign-ups |
| `created_at` | `timestamptz` | defaults to `now()` |
| `updated_at` | `timestamptz` | defaults to `now()` |

**Create the row with a database trigger, not from the app.** A trigger on
`auth.users` (`after insert`, `security definer`) is the only approach
that is actually reliable here:

- It fires for Google sign-ups too, which never touch our sign-up form
- It cannot be skipped by the app being closed between account creation
  and the insert
- It runs even when email confirmation means the client has no session
  yet, and therefore no permission to insert its own row

Pull `full_name` and `avatar_url` out of `new.raw_user_meta_data`, which
is where both the Google profile fields and anything passed in the
`options.data` of an email sign-up arrive.

### Row-level security

Enable RLS on `profiles` in the same migration that creates it. Policies:

- **select** — a user can read their own row (`auth.uid() = id`)
- **update** — a user can update their own row
- **insert** — not needed by the app; the trigger runs as definer

A table with RLS enabled and no policy returns nothing, which is confusing
but safe. A table with RLS **off** is readable by anyone holding the
publishable key, which ships in the app. Never leave it off.

### Auth providers

**Email and password.** Enabled by default.

**Email confirmation is turned OFF for this phase** (decided). In Supabase
→ Authentication → Providers → Email, disable "Confirm email". Sign-up
then returns a session immediately and lands the traveller on home, which
keeps this phase to one path instead of two.

> This is a development setting and it must go back on before release —
> with it off, anyone can create an account against an email address they
> do not own. Add it to the phase 6 release checklist. When it is turned
> back on, sign-up returns a user with **no session**, and the app will
> need a "check your email" state that does not exist yet.

**Google.** Enable the Google provider in Supabase and create a Google
Cloud OAuth client.

Use the **browser-based flow**: `supabase.auth.signInWithOAuth` with
`skipBrowserRedirect`, opened through `WebBrowser.openAuthSessionAsync`,
with the redirect built by `makeRedirectUri()` from `expo-auth-session`.
Read the returned URL's tokens with `QueryParams.getQueryParams` and hand
them to `supabase.auth.setSession`.

> **Do not use `@react-native-google-signin/google-signin`.** It is what
> Supabase's docs reach for first and it gives the nicer native sheet, but
> it is a native module: it does not run in Expo Go, which is how this app
> is currently developed. Adopting it means committing to a development
> build. That is a real decision with real cost — raise it, don't make it
> silently by adding the package.

Add a `scheme` to `app.json` — Expo Router needs one anyway, and the OAuth
redirect cannot work without it:

```json
{ "expo": { "scheme": "aitripplanner" } }
```

Then allowlist the redirect URLs in **Supabase → Authentication → URL
Configuration**. Both are needed:

- `aitripplanner://**` — the built app and development builds
- `exp://**` — Expo Go, where `makeRedirectUri()` returns something like
  `exp://127.0.0.1:8081/--/`

> The Expo Go redirect contains the dev machine's **LAN IP and port**, so
> it changes between networks. Expect this to be the fiddliest part of the
> phase. If Google sign-in works at home and fails elsewhere, this is why.

### Navigation — Expo Router (decided)

There is no navigation at all today, and two screens need it. **Expo
Router** is the choice: it is the Expo-recommended default for SDK 57, it
gives file-based routing, and it needs the deep-link `scheme` that Google
OAuth already requires anyway.

Adopting it rewrites the entry point:

- `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`
- `package.json` `main` becomes `expo-router/entry`
- `App.tsx` and `index.ts` are replaced by `app/_layout.tsx` and routes
- add `scheme` and `experiments.typedRoutes` to `app.json`
- `npx expo start --clear` afterwards, or Metro serves a stale bundle

Do this migration **first and on its own**, and confirm the app still
boots on the phone before adding any auth code. If the entry-point change
and the Supabase wiring land together, a blank screen has two possible
causes instead of one.

### Screens

Routing shape, assuming Expo Router:

```
app/
├── _layout.tsx          root; holds the auth provider, redirects on session
├── (auth)/
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── (app)/
    └── index.tsx        placeholder home — proves the session works
```

**Sign Up** — full name, email, password, confirm password. A Google
button. A link to Sign In.

**Sign In** — email, password. A Google button. A link to Sign Up.
"Forgot password" is out of scope for this phase; do not add it.

Both screens:

- Disable the submit button and show a spinner while the request is in
  flight. A button that does nothing for three seconds reads as broken
- Show failures as plain readable sentences. Never print a raw Supabase
  error to the traveller
- Wrap the form so the **keyboard does not cover the inputs or the submit
  button**. This is the most common defect in a React Native form and it
  is invisible in code review — it has to be checked on a device
- Set `autoCapitalize="none"`, `keyboardType="email-address"` and
  `secureTextEntry` appropriately. An email field that capitalises the
  first letter will fail sign-in and look like a wrong password

### Session handling

- A single auth context or hook is the one source of truth for the
  session. Screens read from it; they do not each call `getSession`
- Subscribe to `supabase.auth.onAuthStateChange` and unsubscribe on unmount
- On cold start, restore the session **before** deciding which screen to
  show. Rendering sign-in first and then redirecting produces a visible
  flash of the wrong screen
- Hold a splash or loading state until that first check resolves
- Sign out clears the session; a cold start afterwards lands on Sign In

### Out of scope for this phase

Named so they do not get built by accident:

- `trips`, itinerary days and activities, and the `images` and `documents` buckets — spec 2
- Password reset, email change, account deletion
- Profile editing — spec 10
- Any AI — spec 11, spec 12, and spec 13
- Account deletion — spec 16. Password reset — spec 18

## Verification

Per @context/ai-interaction.md sections A and B. On a real phone:

- Sign up with a new email → account in **Authentication → Users**, and a
  matching row in **`profiles`** with the full name from the form
- Sign up again with the same email → readable error, no crash
- Sign in with the wrong password → readable error
- Sign in with Google → signed in, `profiles` row has the Google name and
  avatar, and there is **one** user, not a duplicate of the email account
- Kill the app and reopen → still signed in, lands on home, no flash of
  the sign-in screen
- Sign out → cold start lands on Sign In
- Keyboard does not cover any input or the submit button on either screen
- Airplane mode → readable error, not an endless spinner
- A second user cannot read the first user's `profiles` row
- `npx tsc --noEmit` and `npx expo-doctor` pass

## Notes

- Email confirmation is off for this phase, so sign-up returns a session
  straight away. If a sign-up ever succeeds but leaves the traveller on
  the sign-in screen, check that setting first — it is the usual cause
- Google sign-in cannot be verified in a simulator without a Google
  account signed in; use the physical phone
- Do not create `ios/` or `android/`. Everything native goes in `app.json`

## References

- @context/project-overview.md
- @context/coding-standards.md
- @AGENTS.md — SDK versions and the docs rule
- Supabase React Native quickstart: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Supabase deep linking (Expo): https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Expo SDK 57 AuthSession: https://docs.expo.dev/versions/v57.0.0/sdk/auth-session/
- Expo Router manual installation: https://docs.expo.dev/router/installation/
