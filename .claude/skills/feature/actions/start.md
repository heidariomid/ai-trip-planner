# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Set Status to "In Progress"
4. Create and checkout the feature branch (derive name from H1 heading)
5. List the goals, then implement them one by one
6. After the code is in: run `npx tsc --noEmit`, then list **leftovers**.
   If there are none, say so in one line.

`/feature pre-review` is optional. Do not refuse start if it is missing.
If Notes have an open Pre-review **Needs decisions**, mention it, then
still implement unless the user says wait.

## Design rules while implementing

- Read @context/design-system.md before writing a screen or component
- Use the existing `Card`, `Button`, `TextField`, and `FormMessage`.
  Colours come from the tokens in `lib/theme.js`, never a hex value
- A new token or shared component is added to the design system file in
  the same change

## Expo rules while implementing

- Install with `npx expo install`, never `npm install`, for any package
  Expo knows about. The wrong version compiles and then crashes on device
- Read the versioned docs for the SDK major in @AGENTS.md before using an
  Expo API. Do not write it from memory
- Never create or edit `ios/` or `android/`. Native config belongs in
  `app.json` or a config plugin
- If a package needs a development build, say so **before** writing code
  against it — the user is on Expo Go, and a native module there fails at
  runtime with an unhelpful error

## Leftovers (required at the end)

Code done is not feature done. Scan what you just shipped and tell the
user every step that is still on them. Do not wait for them to ask. Do
not hide a silent skip (missing env var, unconfigured OAuth client,
missing table) as success.

Include only what this feature actually needs, for example:

- Env vars to set, with the exact names, and which are `EXPO_PUBLIC_*`
- Dashboard configuration: Supabase providers, redirect URLs, SQL to run,
  storage buckets, RLS policies
- Accounts / OAuth clients / API keys to create, and where
- What happens if they skip a step (sign-up works, Google button fails)
- Whether a development build is now required, and what stops working in
  Expo Go if it is
- Anything that must not be merged yet

If a leftover belongs to a later phase, say that and do not mix it in as
if it blocks this one.
