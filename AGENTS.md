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

- **Product:** AI Trip Planner. Mobile app. Sign in / sign up (email and Google) and a placeholder home are built. No trip data or AI yet.
- **Package / slug:** `ai-trip-planner`. Display name in `app.json`: `AI Trip Planner`.
- **Path:** `/Users/omid/Desktop/expo` (folder name `expo` cannot be the npm name).
- **Template:** started from `blank-typescript`, now on Expo Router. Entry is `expo-router/entry`; `App.tsx` and `index.ts` are deleted. Routes live in `app/` (`_layout.tsx` renders a headerless `<Stack>`, `index.tsx` is the placeholder home). `app.json` carries `scheme: aitripplanner`, `experiments.typedRoutes`, `web.bundler: metro`, and the `expo-router` plugin. `tsconfig.json` includes `.expo/types`.
- **SDK:** Expo `~57.0.26` (docs: https://docs.expo.dev/versions/v57.0.0/). React `19.2.3`. React Native `0.86.3`. TypeScript `~6.0.3` with `strict: true`. Web: `react-dom@19.2.3`, `react-native-web@^0.21.2`. Package manager is npm (`package-lock.json`).
- **Scripts:** `npm start`, `npm run ios`, `npm run android`, `npm run web`.
- **UI:** portrait, light UI, tablet supported. Icons live in `assets/`. The look is **warm luxury glassmorphism** — this is a travel app, so the palette is sunset terracotta and gold over warm sand, never cool grey or blue. A soft `expo-linear-gradient` (`#FDF7EF → #FBECDC → #F8E3D6`) sits under three blurred amber/orange/rose circles, with a frosted `components/GlassCard.tsx` on top (`expo-blur` `BlurView`, intensity 60, `tint="light"`, panel `bg-[#FFFAF3]/65`). **The circles are load-bearing** — remove them and the blur has nothing to pick up, so the card reads as flat grey. Content is capped at `max-w-[380px]` and centred. Buttons are capsules (`rounded-full h-12`), **centred rather than full width** by default; `Button` takes `fullWidth` to opt in. Tokens `accent` (#C2410C), `accent-deep`, `gold`, `ink`, `subtle`, `sand`, `rounded-card` live in `tailwind.config.js` under `theme.extend` — never hardcode those hex values in a component. Shadows are `style` objects (NativeWind has no clean cross-platform shadow utility) and are tinted warm (`#5C3A24`), not black. The cold-start loading view in `app/_layout.tsx` uses `bg-sand` so it does not flash a cool grey.
- **Styling:** Tailwind through **NativeWind 4.2.7** (the version that added SDK 57 support; v5 is still an RC). Style with `className`, not `StyleSheet.create`. Config lives in `tailwind.config.js` (Tailwind 3, `nativewind/preset`), directives in `global.css`, imported once at the top of `app/_layout.tsx`. `babel.config.js` uses `babel-preset-expo` with `jsxImportSource: "nativewind"` plus `nativewind/babel`; `metro.config.js` wraps the config in `withNativeWind`. Types come from `nativewind-env.d.ts`. **`darkMode: "class"` is required, not a preference:** with the default `media`, the web runtime of `react-native-css-interop` waits on a `MutationObserver` for the stylesheet, then unconditionally calls `colorScheme.set()` — which throws in `media` mode. Result is `Cannot manually set color scheme, as dark mode is type 'media'` on web only; native is unaffected, so an iOS-only check misses it. Peer deps pulled in: `react-native-reanimated@4.5.1` and `react-native-worklets@0.10.1`, both bundled in Expo Go. **Changing Babel or Metro config means `npx expo start --clear`**, or the old bundle is served and `className` silently does nothing.
- **Browser QA:** use the **Cursor IDE browser** (`cursor-ide-browser`) for web checks such as the Metro web bundle or the Supabase dashboard. Do not reach for Playwright — it spawns a second browser the user has to clean up. Navigate, then `browser_lock` before a longer sequence and unlock when done.
- **Process:** `context/` + the `/feature` skill, ported from the bakery repo (`/Users/omid/Developer/Github/bakery`) and adapted from Next.js/Payload to Expo/Supabase. `.cursor/rules/cleanup-after-finish.mdc` kills stray Metro servers and QA artifacts.
- **Backend:** Supabase — Auth, Postgres, Storage. Chosen over Firebase because trips/itineraries are relational and RLS keeps authorization next to the data. Project is provisioned (ref `<project-ref>`, URL `https://<project-ref>.supabase.co`). Schema lives in `supabase/migrations/`; `0001_profiles.sql` is applied — `profiles` with RLS select/update policies and the `on_auth_user_created` trigger that fills the row from `raw_user_meta_data`.
- **Phase 1 (complete):** Supabase setup, Sign In / Sign Up, email+password and Google auth, `profiles` row written by a DB trigger on first sign-up. Verified by the user on Expo Go and web — both providers sign in and out, and the row appears in the database. Spec: `context/features/phase-1-supabase-auth-spec.md`.
- **Supabase keys:** use the publishable key (`sb_publishable_…`), not the legacy `anon` JWT — Supabase deprecates `anon`/`service_role` by end of 2026. Env names are `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `.env` holds the real values and is gitignored; `.env.example` stays empty as the template.
- **Supabase MCP:** configured globally in `~/.cursor/mcp.json` (not in the repo) and authenticated, scoped to `project_ref=<project-ref>`. Use the MCP tools for schema and queries instead of guessing. Supabase agent skills live in `.agents/skills/` (`supabase`, `supabase-postgres-best-practices`) with `skills-lock.json` pinning them.
- **Persian docs:** `context/current-feature.fa.md` is a plain-language Persian mirror of `current-feature.md`. Keep it in sync when the English one changes.
- **Navigation:** Expo Router. `Stack.Protected` in `app/_layout.tsx` switches `(auth)` / `(app)` on the session. Phase 1 auth is complete.
- **expo-doctor:** the "Check Expo config schema" check fails on this machine with `Unexpected token '<'` — it fetches the schema over the network and gets an HTML page back. The other 17 checks pass and `npx expo config --type public` resolves fine. Not a project defect; don't chase it.
- **Auth config is set through the Management API, not the dashboard.** `PATCH https://api.supabase.com/v1/projects/<project-ref>/config/auth` with a `Bearer sbp_…` personal access token; field names are in the live spec at `https://api.supabase.com/api/v1-json` under `UpdateAuthConfigBody`. Applied: `mailer_autoconfirm: true` (email confirmation OFF, so sign-up returns a session — must go back to `false` before release), `site_url: http://localhost:8081` (was the `localhost:3000` default, which is where failed OAuth callbacks were landing), `uri_allow_list: aitripplanner://**,exp://**,http://localhost:8081/**`. `signUpWithEmail` still handles the no-session case; that path is dormant, not dead — release will need it again.
- **Google provider is on and verified** (web and Expo Go: button → consent → session → `profiles` row, then sign-out). Credentials went in via the Management API (`external_google_enabled` + client id + secret). The client lives in Google Cloud project `my-project-66567-1685040125454` (account `<owner-email>`), named `AI Trip Planner (Supabase)`, type **Web application** — *not* Android/iOS. The Supabase guide's "Expo React Native" section says Android/iOS, which is wrong here because that section assumes `@react-native-google-signin/google-signin` and we use the browser flow. Redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, JS origin `http://localhost:8081`. Data Access scopes: `openid`, `userinfo.email`, `userinfo.profile`. Google hides existing secrets after creation; a second secret was added for this setup. The Supabase MCP has no auth-provider tool.
- **The consent screen is in Testing mode, which is a hard gate, not a warning.** Only addresses listed under Google Auth Platform → Audience → Test users can sign in at all; everyone else gets `access_denied` no matter how correct the config is. `<owner-email>` is the only one listed. Cap is 100 users for the app's lifetime. Publishing requires completing the Branding page.
- **Google Cloud has no API for creating OAuth client IDs.** It is console-UI only — there is no `gcloud` command and no public REST endpoint. (`gcloud iam oauth-clients` is Workforce Identity Federation, a different product.) Any future client has to be made by hand in the browser.
- **Expo Go constraint:** `@react-native-google-signin/google-signin` is a native module and does **not** run in Expo Go. Google auth uses the browser flow (`signInWithOAuth` + `expo-web-browser` + `expo-auth-session`) until someone decides to move to a development build.
- **Google OAuth splits by platform.** Native uses `skipBrowserRedirect: true` + `WebBrowser.openAuthSessionAsync`, then reads the tokens itself. On web that same call is a `window.open()` that popup blockers reject, because it runs after an `await` instead of inside the click — so web lets supabase-js redirect the whole page and `detectSessionInUrl` (true on web only) reads the tokens back. The `useLinkingURL` handler in `useAuth` is skipped on web so it does not race with that. Flow type is the supabase-js default, `implicit`, so tokens arrive in the URL fragment and there is no code exchange.
- **Never send `exp://<LAN-IP>` as `redirectTo`.** GoTrue rejects any redirect whose hostname is a non-loopback IP (https://github.com/supabase/auth/issues/2039) before checking `uri_allow_list`, then falls back to `site_url` (`http://localhost:8081`). On a phone that is Safari opening localhost and dying. Native redirect is `aitripplanner://google-auth` — already allowlisted as `aitripplanner://**`. `openAuthSessionAsync` intercepts that scheme; Expo Go does not need it registered. `makeRedirectUri()` is web-only.
- **Auth shape:** `lib/supabase.ts` (client + `AppState` auto-refresh, native only), `lib/auth.ts` (every auth call, returns `{ success, error, notice? }` — never throws a raw Supabase error at a screen), `lib/auth-errors.ts` (error code → sentence), `lib/profiles.ts`, `lib/validation.ts`. `hooks/useAuth.tsx` holds the session context; `hooks/useProfile.ts` reads the row. Routing uses **`Stack.Protected`** in `app/_layout.tsx` keyed on the session, not per-screen `<Redirect>`; `app/(app)/` and `app/(auth)/` are plain stacks. The root holds a loading view until `isRestoring` clears, which is what prevents the sign-in flash.
- **Not built:** trip data, AI, storage. Screens, navigation, and auth exist as of phase 1.
- **Node:** this machine is Node `v23.11.0`. React Native 0.86 wants `^20.19.4`, `^22.13.0`, `^24.3.0`, or `>=25`. Installs warn. Do not change the user’s Node unless asked.
- **iOS Expo Go:** CLI account is `omidev88`. A physical iPhone loads this dev server only when Expo Go is signed in as that same account.
- **Simulator:** iOS 27.0 runtime (24A434) is installed. Booted device is iPhone 17 (`591EACF0-C82B-41E0-ABFE-7F16504CDD0E`). Expo Go 57.0.9 is installed on it. The first `openurl` after a fresh boot can time out (code 60); retry once SpringBoard is up. Metro must listen on all interfaces (`*:8081`). `--localhost` makes the simulator report “Could not connect to the server.” `~/Library/Developer/Xcode/iOS DeviceSupport/15.5 (19F77)` is physical-phone support, not a simulator.
- **Git:** repo initialized by create-expo-app on `main`. Do not commit unless asked.
