# Spec 3 — App Shell

## Overview

Spec 3 of 17. Depends on spec 1. Spec 2 may already be applied; this step
does not read `trips`.

Replace the placeholder home with three tabs: Home, My Trips, and
Profile. The layout matches the Home board. Nothing on it is live data
except the profile header.

## Requirements

- A tab navigator inside the signed-in stack. Home, My Trips, Profile.
  The signed-out stack is unchanged
- The tab bar floats: a rounded capsule above the home indicator, with a
  margin on both sides, not a bar pinned edge to edge. The last row of
  every tab's list scrolls clear of it
- Icons come from one library, `lucide-react-native`, with
  `react-native-svg` as its peer. The app font is Outfit, from
  `@expo-google-fonts/outfit` and `expo-font`, set once in
  `tailwind.config.js` and loaded before the first screen shows. Install
  all of them with `npx expo install`, and confirm each runs in Expo Go
  before writing code against it
- Home shows a greeting, the destination strip, the ask bar, and the
  filter chips My Plan, Explore, All Plans, and Active
- Explore shows a few static cards: title, day count, a rough cost, a
  place count, tags, and a map picture. The picture is an asset, not a
  map library
- My Plan, All Plans, and Active show an empty state. They start showing
  real trips in spec 4. The My Plan and My Trips empty states carry a
  Create a trip button. It is visible and disabled until spec 4
- The ask bar accepts no submit. It does not call a model. The mic icon
  does nothing
- My Trips is an empty state
- Profile shows the signed-in user's name and avatar from `profiles`, and
  signs out. Sign out still lands on Sign In after a cold start
- The minimal look from the rest of the app: tokens from `lib/theme.js`,
  no gradients, no warm tones

## Out of scope

- Creating a trip, opening a trip, or calling the assistant
- Editing the profile, interest tags, saved places, a join code
- A map SDK, voice input, or a place search

## Done when

- On a phone, all three tabs render, the static Explore cards scroll, and
  the empty states are readable
- The tab bar floats and hides no content. Text renders in Outfit, with
  no flash of the system font on a cold start. The same holds on web
- The ask bar cannot submit
- Sign out still works, including after a cold start
- Nothing sits under the notch or the home indicator
- `npx tsc --noEmit` passes

## References

- @context/project-overview.md
- @context/features/spec1-auth.md
- The Home board in @context/plan/
