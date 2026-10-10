# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` types — use proper typing or `unknown`
- Generate database types from Supabase rather than hand-writing them, and
  import those. Never hand-write an interface that duplicates a table —
  it drifts the first time a column changes
- Define interfaces for all component props
- Use type inference where obvious, explicit types where helpful

## React Native

- Functional components only
- One job per component. A screen composes; it does not also contain a
  200-line form
- Extract reusable logic into hooks in `hooks/`
- Keep network calls out of components — they belong in `lib/` or a hook,
  so a screen can be read in one pass
- Every list that can grow uses `FlatList`, never `.map()` inside a
  `ScrollView`. A map renders every row even when none are visible

## Expo

- Install with `npx expo install`, never `npm install`, for anything Expo
  knows about. `npm install` resolves a version that compiles and then
  fails at runtime on device
- Read the versioned docs for the SDK major in @AGENTS.md before using an
  Expo API. The SDK breaks APIs every release; memory is not a source
- `ios/` and `android/` are generated. Never create or edit them. Native
  configuration goes in `app.json` or a config plugin
- Before adding a dependency, check whether it needs a development build.
  Native modules do not run in Expo Go, and finding that out at runtime
  costs an hour

## Styling

- **Tailwind via NativeWind.** Style with `className`, not
  `StyleSheet.create`. The utilities compile to real native styles at
  build time, so there is no runtime cost to prefer them
- Reach for `style={}` only where NativeWind genuinely cannot express the
  value — a measured layout, an animated value, a prop a native component
  only accepts as an object. Never mix both on the same element for the
  same property; the resolution order is not worth reasoning about
- The full rules are in @context/design-system.md. Read it before
  building or changing a screen
- Colours and shadows are defined once, in `lib/theme.js`.
  `tailwind.config.js` reads it under `theme.extend`, and a component
  imports it only for a prop that needs a raw value. One source of truth
- **Never write a hex value in a component or screen.** If a colour is
  missing, add a token to `lib/theme.js`
- **The look is minimal and airy, and that is a product decision, not a
  preference.** A pale `canvas`, white `surface` cards with a soft
  shadow, navy `ink` text, grey `subtle` labels, and one teal `accent`.
  The accent is rare on purpose: primary action, active state, links. A
  screen with three accent elements has two too many. **No gradients
  (except the pale wash on the AI planning card on Home), no blur, no
  warm tones** (`amber`, `orange`, `rose`), and no second accent
  colour. Red is reserved for errors
- Hierarchy comes from type and space, not from colour or borders: a
  small `subtle` label above a bold `ink` value, generous padding, and
  few dividers
- Surfaces go through `components/Card.tsx`
- Buttons are capsules and are centred, not stretched edge to edge. Pass
  `fullWidth` only when the layout genuinely calls for it
- Repeating the same long class string in three places is the signal to
  extract a component, not to add a `@apply` layer
- No component library. Components are hand-rolled in `components/`
- Respect the safe area. Content must not sit under the notch or the home
  indicator
- Tap targets at least 44×44pt
- Use `Platform.select` for genuine platform differences, not to patch a
  layout that was only ever checked on one of them

## File organization

```
app/               Routes — Expo Router, file-based
components/        Reusable UI
lib/               Clients and helpers (supabase.ts, …)
hooks/             Custom hooks
types/             Shared and generated types
```

Theme values live in `lib/theme.js` and `tailwind.config.js`, so there
is no `constants/` directory for them.

## Naming

- Components: PascalCase (`TripCard.tsx`)
- Files: match the component name, or kebab-case for utilities
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase, no prefix
- Database tables and columns: lowercase `snake_case`, tables plural
  (`trips`, `itinerary_items`)

## Data and Supabase

- One Supabase client, created once in `lib/supabase.ts` and imported
  everywhere. Never call `createClient` in a component
- Select only the columns you need. `select('*')` over a join pulls far
  more than a screen renders
- Let the database enforce access. **Row-level security is the security
  boundary**; filtering by user id in the client is a convenience, and a
  client-side filter without a policy behind it is a leak
- Every new table gets RLS enabled and a policy in the same migration that
  creates it. A table with RLS on and no policy silently returns nothing,
  which is confusing but safe; a table with RLS off is readable by anyone
  holding the publishable key, which is not
- Keep SQL in `supabase/` as files, so the schema is reviewable and
  repeatable. Clicking it into the dashboard leaves no record

## Validation

- Validate form input before it reaches the network, and again trust only
  what the database enforces. Client validation is UX, never a boundary
- Validation messages are user-facing copy — write them as sentences a
  traveller would understand

## Error handling

- try/catch around every network call
- Return the `{ success, data, error }` shape from helpers that can fail
- Show user-friendly messages — never surface a raw Supabase error,
  stack trace or Postgres code to the traveller
- Log the real error for debugging
- Every async action has a visible loading state and a visible failure
  state. A button that does nothing for three seconds reads as broken

## Security

- Only `EXPO_PUBLIC_*` variables reach the app bundle. **Anything in the
  bundle is public** — it ships to the device and can be read out of it
- The Supabase publishable key (`sb_publishable_…`) is designed to be
  public and is fine to ship. The secret key (`sb_secret_…`) is not, and
  must never appear in this repo
- `.env` is gitignored. `.env.example` holds the key names with
  placeholder values and is committed
- Supabase handles auth. Do not store passwords, hand-roll a session, or
  keep a token anywhere except the client's configured storage

## Code quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
- `npx tsc --noEmit` must pass before committing

## Testing

This project has **no automated test suite**. It is an early-stage app
where the screens change faster than tests for them would pay off.

Verification is manual and on a device instead. Before any commit:

- The screen renders on a real phone or simulator
- **The web bundle loads without a console error.** Native and web take
  different code paths through NativeWind, and web has already thrown an
  uncaught error that iOS never saw
- The keyboard does not cover the input or the submit button
- Loading and error states both appear, not just the happy path
- The app survives a cold start with the expected session
- `npx tsc --noEmit` passes with no errors

There is no lint script. Do not run `npx expo lint` and do not report lint
as passing.
