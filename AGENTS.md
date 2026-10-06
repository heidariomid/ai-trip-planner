# AI Trip Planner

Read this file at the start of every session. Treat **Memory** as the source of truth. Do not re-scan the repo, `node_modules`, or lockfile for facts already written here. After any change to product, stack, files, or decisions, update Memory in place. Replace stale lines. Do not append a changelog.

## Context Files

Read these for the full context of the project:

- @context/project-overview.md — what the product is and why Supabase
- @context/coding-standards.md — TypeScript, React Native, Expo, Supabase rules
- @context/ai-interaction.md — the feature workflow and the verification checklists
- @context/current-feature.md — what is being built right now

## Feature workflow

Every feature follows `load → start → complete`, driven by the `/feature`
skill in `.claude/skills/feature/`. `pre-review` and `after-review` are
optional extras, not gates. Specs live in `context/features/`; the working
file is @context/current-feature.md. Full description in
@context/ai-interaction.md.

**Verification is on a device, never in a compiler.** TypeScript cannot
see a keyboard covering a submit button, a native module missing from Expo
Go, or a query blocked by row-level security. All three compile cleanly.

## Stack rules

Expo breaks APIs every SDK. Before code that touches Expo, EAS, or React Native:

1. Use the SDK major in Memory (`expo` in `package.json`).
2. Read `https://docs.expo.dev/versions/v<major>.0.0/` for that API.
3. For anything else, open https://docs.expo.dev/llms.txt and follow the page link. Do not answer from memory.

```bash
npx expo install <package>   # SDK-compatible versions. Never npm/yarn add for Expo packages.
npx expo start               # dev server
npx tsc --noEmit             # typecheck before finishing a code change
npx expo-doctor              # dependency and config diagnosis
npx expo install --fix       # repair incompatible versions
```

Lint is not configured. Do not run `npx expo lint` until a lint script exists.

- `ios/` and `android/` are generated. Do not create or edit them. Native config goes in `app.json` and config plugins.
- Prefer Expo modules. Check installed skills before adding a dependency.
- Add navigation, AI, storage, or auth only when asked.

## Memory

- **Product:** AI Trip Planner. Mobile app. No features beyond the blank screen.
- **Package / slug:** `ai-trip-planner`. Display name in `app.json`: `AI Trip Planner`.
- **Path:** `/Users/omid/Desktop/expo` (folder name `expo` cannot be the npm name).
- **Template:** started from `blank-typescript`, now on Expo Router. Entry is `expo-router/entry`; `App.tsx` and `index.ts` are deleted. Routes live in `app/` (`_layout.tsx` renders a headerless `<Stack>`, `index.tsx` is the placeholder home). `app.json` carries `scheme: aitripplanner`, `experiments.typedRoutes`, `web.bundler: metro`, and the `expo-router` plugin. `tsconfig.json` includes `.expo/types`.
- **SDK:** Expo `~57.0.26` (docs: https://docs.expo.dev/versions/v57.0.0/). React `19.2.3`. React Native `0.86.3`. TypeScript `~6.0.3` with `strict: true`. Web: `react-dom@19.2.3`, `react-native-web@^0.21.2`. Package manager is npm (`package-lock.json`).
- **Scripts:** `npm start`, `npm run ios`, `npm run android`, `npm run web`.
- **UI:** `app/index.tsx` is a single centered placeholder screen. Portrait, light UI, tablet supported. Icons live in `assets/`.
- **Styling:** Tailwind through **NativeWind 4.2.7** (the version that added SDK 57 support; v5 is still an RC). Style with `className`, not `StyleSheet.create`. Config lives in `tailwind.config.js` (Tailwind 3, `nativewind/preset`), directives in `global.css`, imported once at the top of `app/_layout.tsx`. `babel.config.js` uses `babel-preset-expo` with `jsxImportSource: "nativewind"` plus `nativewind/babel`; `metro.config.js` wraps the config in `withNativeWind`. Types come from `nativewind-env.d.ts`. **`darkMode: "class"` is required, not a preference:** with the default `media`, the web runtime of `react-native-css-interop` waits on a `MutationObserver` for the stylesheet, then unconditionally calls `colorScheme.set()` — which throws in `media` mode. Result is `Cannot manually set color scheme, as dark mode is type 'media'` on web only; native is unaffected, so an iOS-only check misses it. Peer deps pulled in: `react-native-reanimated@4.5.1` and `react-native-worklets@0.10.1`, both bundled in Expo Go. **Changing Babel or Metro config means `npx expo start --clear`**, or the old bundle is served and `className` silently does nothing.
- **Process:** `context/` + the `/feature` skill, ported from the bakery repo (`/Users/omid/Developer/Github/bakery`) and adapted from Next.js/Payload to Expo/Supabase. `.cursor/rules/cleanup-after-finish.mdc` kills stray Metro servers and QA artifacts.
- **Backend:** Supabase — Auth, Postgres, Storage. Chosen over Firebase because trips/itineraries are relational and RLS keeps authorization next to the data. Not yet provisioned.
- **Phase 1 (specced and loaded, not started):** Supabase setup, Sign In / Sign Up, email+password and Google auth, `profiles` row written by a DB trigger on first sign-up. Spec: `context/features/phase-1-supabase-auth-spec.md`.
- **Supabase keys:** use the publishable key (`sb_publishable_…`), not the legacy `anon` JWT — Supabase deprecates `anon`/`service_role` by end of 2026. Env names are `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env` and `.env.example` exist with empty values; the Supabase project is not created yet.
- **Persian docs:** `context/current-feature.fa.md` is a plain-language Persian mirror of `current-feature.md`. Keep it in sync when the English one changes.
- **Navigation:** Expo Router, migrated and verified on the simulator (bundles clean, route renders). Phase 1 now continues with Supabase.
- **expo-doctor:** the "Check Expo config schema" check fails on this machine with `Unexpected token '<'` — it fetches the schema over the network and gets an HTML page back. The other 17 checks pass and `npx expo config --type public` resolves fine. Not a project defect; don't chase it.
- **Email confirmation:** turned OFF in Supabase for development, so sign-up returns a session immediately. Must go back on before release — it needs a "check your email" state that phase 1 does not build.
- **Expo Go constraint:** `@react-native-google-signin/google-signin` is a native module and does **not** run in Expo Go. Google auth uses the browser flow (`signInWithOAuth` + `expo-web-browser` + `expo-auth-session`) until someone decides to move to a development build.
- **Not built:** screens, navigation, trip data, AI, auth, backend, storage.
- **Node:** this machine is Node `v23.11.0`. React Native 0.86 wants `^20.19.4`, `^22.13.0`, `^24.3.0`, or `>=25`. Installs warn. Do not change the user’s Node unless asked.
- **iOS Expo Go:** CLI account is `omidev88`. A physical iPhone loads this dev server only when Expo Go is signed in as that same account.
- **Simulator:** iOS 27.0 runtime (24A434) is installed. Booted device is iPhone 17 (`591EACF0-C82B-41E0-ABFE-7F16504CDD0E`). Expo Go 57.0.9 is installed on it. The first `openurl` after a fresh boot can time out (code 60); retry once SpringBoard is up. Metro must listen on all interfaces (`*:8081`). `--localhost` makes the simulator report “Could not connect to the server.” `~/Library/Developer/Xcode/iOS DeviceSupport/15.5 (19F77)` is physical-phone support, not a simulator.
- **Git:** repo initialized by create-expo-app on `main`. Do not commit unless asked.
