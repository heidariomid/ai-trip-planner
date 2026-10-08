# Design System

Every screen in this app follows this file. The visual reference is
`context/design/mockup.png`, chosen by the user on 2026-10-07.

**The boards in `context/plan/` decide layout and content. This file
decides how it looks.** Where a board shows a colour, a gradient, or a
card style that disagrees with this file, this file wins.

---

## The look

Minimal and airy. A pale canvas, white cards, navy text, and one indigo
accent. Photos and destination art supply the colour; the interface
stays quiet around them.

- Hierarchy comes from type size, weight, and space. Not from colour,
  borders, or boxes
- One accent, used rarely: the primary action, the active state, a link
- No gradients, no blur, no decorative shapes, no warm tones, no second
  accent colour. The one exception is the AI planning card on Home,
  which carries a pale sky-to-peach wash. Do not spread it
- Red is for errors only

---

## Tokens

Defined once in `lib/theme.js`. `tailwind.config.js` reads it, so every
token is a class (`bg-canvas`, `text-ink`, `border-line`). A component
imports `colors` or `shadows` from `lib/theme` only for a prop that needs
a raw value.

**Never write a hex value in a component or screen.** If a colour is
missing, add a token to `lib/theme.js` and list it here.

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F3F3F8` | Screen background, filled inputs, quiet strips inside a card |
| `surface` | `#FFFFFF` | Cards, the tab bar, secondary buttons |
| `ink` | `#1A1C3D` | Headlines, values, body text |
| `subtle` | `#74778F` | Labels, captions, secondary text |
| `muted` | `#B7B9C9` | Placeholders, inactive icons, disabled text |
| `line` | `#E8E8F0` | Hairline borders and dividers |
| `accent` | `#5038E0` | Primary button, active tab, links, the add button |
| `accent-deep` | `#3E28C4` | Pressed state of an accent element |
| `accent-soft` | `#EEEBFD` | Tinted background for a selected chip or an info message |
| `sky-soft` | `#E3F0FE` | One end of the wash on the AI planning card. Nowhere else |
| `peach-soft` | `#FFEBDD` | The other end of that wash. Nowhere else |

| Shadow | Use |
| --- | --- |
| `shadows.card` | A card resting on the canvas |
| `shadows.soft` | A small white control: secondary button, tab bar |
| `shadows.accent` | An accent-filled control: primary button, add button |

Radius: `rounded-card` (24px) for cards, `rounded-2xl` for inputs and
images inside a card, `rounded-full` for buttons, chips, and badges.

---

## Type

The font is Outfit, loaded in `app/_layout.tsx` before the first screen
shows. Outfit ships one file per weight, so in `tailwind.config.js` a
weight is a family: `font-regular`, `font-medium`, `font-semibold`,
`font-bold`. There is no `font-sans` and no numeric weight.

**Import `Text` from `components/Text`, never from `react-native`.** It
applies `font-regular` unless a weight class is present. React Native has
no inherited font, so a bare `Text` falls back to the system font. A
`TextInput` carries `font-regular` in its own classes.

| Role | Classes |
| --- | --- |
| Screen title | `text-[32px] font-bold leading-tight tracking-tight text-ink` |
| Card title | `text-[20px] font-semibold tracking-tight text-ink` |
| Body | `text-[15px] leading-5 text-ink` |
| Secondary | `text-[14px] text-subtle` |
| Label, caption | `text-[13px] text-subtle` |

A fact is shown as a small `subtle` label above a bold `ink` value
("From" above "Vancouver", "Price" above "$781"). Do not put a fact in a
bordered box.

---

## Components that exist

Use these. Do not restyle them per screen.

- `components/Card.tsx` — the only surface. White, `rounded-card`,
  `shadows.card`. `flush` removes the padding for a card whose picture
  runs edge to edge; the picture then rounds its own top corners
- `components/Button.tsx` — a capsule, 48pt tall, centred by default.
  `primary` is accent with white text. `secondary` is white with a
  `line` border. `fullWidth` only when the layout needs it
- `components/TextField.tsx` — label above, filled with `canvas`, accent
  border on focus, red border and message on error. `hint` puts quiet
  text right of the label, such as a character count. `multiline` makes
  it 96pt tall
- `components/FormMessage.tsx` — `error` is red, `info` is `accent-soft`
- `components/AuthScreenLayout.tsx` — canvas, safe area, keyboard handling
- `components/Text.tsx` — every string. Sets the Outfit family
- `components/Screen.tsx` — a tab screen that does not scroll: canvas,
  top safe area, screen title, capped width, bottom padding for the tab
  bar
- `components/TabBar.tsx` — the floating capsule. Each tab is an icon
  above a 12px label. The active tab is `accent` on an `accent-soft`
  pill, the others are `subtle` with no background
- `components/Chip.tsx` — a 44pt capsule. Selected is `accent` with white
  text, unselected is `surface` with `subtle` text
- `components/EmptyState.tsx` — a `subtle` sentence and at most one button
- `components/Avatar.tsx` — the profile picture, or the first letter of
  the name on a `surface` circle
- `components/ExploreCard.tsx` — a `Card` with a title, facts as label
  above value, tags as `canvas` capsules, and the static map picture.
  It opens the plan
- `components/Fact.tsx` — one fact: a small `subtle` label above a bold
  `ink` value
- `components/CategoryChips.tsx` — the category filter under the Explore
  chip. A 44pt capsule; the selected one is `accent-soft` with `accent`
  text, not filled, so it does not compete with the Explore chip
- `components/PlanBanner.tsx` — the top of a curated plan: its bundled
  picture with a back button, the title, the destination, three facts,
  and the description. No dates and no badge
- `components/RoundButton.tsx` — a 44pt white circle with one icon, for
  a control that sits on a picture
- `components/AskBar.tsx`, `components/HomeHeader.tsx` — Home only. The
  header is one 22px line, a `subtle` greeting then the first name in
  bold `ink`. Nothing after the name: no emoji and no icon (the user
  found both ugly, 2026-10-08). The avatar is on the right. The ask bar is a card with a pale wash from `sky-soft`
  through `surface` to `peach-soft`, corner to corner (user decision,
  2026-10-08, picked over flat mint, sky, and sand after pure white
  felt too plain), with a `surface` edge and `shadows.card`, a small
  `ink` caps label, a `subtle` lead-in, a bold
  30px `ink` headline that rotates through trip ideas, a `subtle` line
  of help, and a white capsule that looks like an input. It is the first
  thing on Home because planning with
  AI is what the app is for, and it stands out by size and motion.
  Tried and rejected by the user the same day: a filled `accent` card,
  a purple glow under blur, and a blurred photo
- `components/RotatingText.tsx` — one line of text that swaps to the
  next phrase with a short fade and rise. The only animation in the app
  so far
- `components/SectionHeader.tsx` — a section title in the card-title
  style, with an optional `subtle` "See all" and chevron on the right
- `components/DestinationCard.tsx`, `components/PopularDestinations.tsx`
  — a row of 150pt cards on Home, each an explore plan: its picture edge
  to edge at the top, then the place in bold and the country with a pin. Tapping one
  opens the plan. The row bleeds past the screen's side padding
- `components/TripCard.tsx` — a traveller's own trip, compact and in the
  same shape as `ExploreCard`: title, a `subtle` route line, a calendar icon
  beside the day count and the dates, and the badge on the left, with
  the cover as a 92pt picture on the right and the planning progress
  bar across the bottom. Not a full-width cover: two
  cards have to fit on one screen
- `components/Badge.tsx` — a small capsule. `highlighted` is
  `accent-soft` with `accent` text and is for the one state that matters
  now (Ongoing). Everything else is `canvas` with `subtle` text
- `components/AddButton.tsx` — the 56pt `accent` circle with a white
  plus. It floats above the tab bar on the right
- `components/DateField.tsx` — looks like a filled input and opens a
  month calendar in a modal. The selected day is an `accent` circle
- `components/ProgressBar.tsx` — a `subtle` label and a bold percentage
  above a 6pt `canvas` track with an `accent` fill
- `components/Stepper.tsx` — a count in a filled row with minus and plus
- `components/CoverPicker.tsx`, `components/TripForm.tsx` — the trip
  form, for adding and editing
- `components/FormScreen.tsx` — a pushed screen holding one form: a
  round back button, the screen title, one `Card`, keyboard handling
- `components/TimeField.tsx` — like `DateField`, opening an hour and
  minute picker in a modal, in five-minute steps
- `components/ConfirmDialog.tsx` — asks before something that cannot be
  undone. Cancel is `secondary`, the action is `primary`, and a failure
  shows inside the dialog. Use it instead of `Alert`, which does nothing
  on web
- `components/TripBanner.tsx` — the cover with round back and options
  buttons on it, then the title, badge, route, dates, and description
- `components/TripMenu.tsx` — the banner's options as a sheet at the
  bottom
- `components/DayChips.tsx` — the days of a trip in a row. The selected
  day is `accent-soft` with `accent` text, not a filled chip, so it does
  not compete with the selected section chip above it
- `components/ActivityRow.tsx`, `components/ActivityForm.tsx`,
  `components/Itinerary.tsx` — the timeline. `ActivityRow` without
  `onPress` is read-only: no pencil, and only the place can be tapped.
  A row sits on the canvas
  with its time on the left and a 24pt tick circle on a `line` rail:
  empty with a `muted` border, or `accent` with a white check once the
  activity is done, and then the title is struck through in `subtle`.
  A read-only row has a small `muted` dot instead. Tapping
  it swaps the row for the form, which is a `Card`. The place is the
  one link on the row: `ink`, medium weight, with a pin before it and a
  small up-right arrow after it. It opens Google Maps and is not
  `accent`, because the screen already carries enough of it

- `components/BookingRow.tsx`, `components/BookingForm.tsx`,
  `components/BookingFields.tsx`, `components/Bookings.tsx` — the
  Bookings section of a trip. Four sections (Flights, Car rental, Hotels,
  Extras), each a card-title heading with a quiet `ink` "+ Add" on the
  right, like "See all". A booking is a `Card` with a Lucide icon in a
  `canvas` circle, a bold `ink` title, `subtle` lines under it, and a
  `muted` pencil. Tapping it swaps the card for the form, as on the
  timeline. An empty section is one `subtle` sentence. Nothing here is
  `accent` except Save

- `components/PackingRow.tsx`, `components/PackingForm.tsx`,
  `components/Packing.tsx` — the Packing section of a trip. One heading
  per category in the card-title style, with a `subtle` "2 of 5 packed"
  beside it and the same quiet `ink` "+ Add" as Bookings. An item is a
  row on the canvas: the 24pt tick circle from the timeline, the label,
  and a `muted` pencil. A packed item is struck through in `subtle`.
  Tapping the row swaps it for the form, a `Card` with Item and
  Category. Below the last category a `secondary` button adds an item
  under a new category

- `components/AddHeader.tsx` — a section title in the card-title style
  with an optional `subtle` detail beside it and a quiet `ink` "+ Add"
  on the right, which can read "Uploading…" while it works. Photos and
  Notes use it; Bookings and Packing draw the same header by hand
- `components/Photos.tsx`, `components/PhotoViewer.tsx` — the Photos
  section of a trip. Under the header, square thumbnails three to a
  row with an 8pt gap and `rounded-2xl` corners, newest first. Tapping
  one opens the viewer: the photo on `ink`, a round close button on it,
  and a `surface` sheet at the bottom with the caption, a red Delete,
  and a `secondary` button for the caption. The sheet swaps in place to
  the caption field or to the delete question; nothing opens over it.
  `ink` behind a photo is the one dark surface in the app
- `components/Notes.tsx`, `components/NoteForm.tsx` — the Notes section
  of a trip. A note is a `Card` with its text in `ink`, its date in
  `subtle`, and a `muted` pencil. Tapping it swaps the card for the
  form, a multiline field with a character count. A new note's form
  opens under the header

A plan's picture is bundled, not private: `getExploreImage(key)` from
`lib/explore-images.ts` returns it, or the placeholder for an unknown
key. A new plan picture needs a new build.

A private image is never given a URL by hand. A component calls
`useImageSource(path)` from `hooks/useImageSource.ts`, which goes through
`lib/storage.ts` and falls back to `assets/placeholder.png`.

Focus is always the `accent`: an `accent` border, an `accent` text
cursor and selection, and `outline-none` so the browser's own focus ring
(which follows the system colour and can be orange) never shows.

A form puts its error message beside the submit button when the form is
taller than the screen. A message at the top is off screen by then.

The tab bar floats over the content. A scrolling tab pads its list with
`useTabBarClearance()` from `hooks/useTabBar.ts`; `Screen` does it for a
tab that does not scroll.

Size a bundled image with a `style` object, not `w-` and `h-` classes. On
web a class does not override the image's intrinsic size.

---

## Patterns for components not built yet

Build them this way when their spec arrives.

- **Screen:** `bg-canvas`, safe area respected, 20px side padding,
  content capped at `max-w-[380px]` and centred
- **Role badges (spec 15):** use `Badge`. Do not give each role its own
  colour
- **Icons:** Lucide, `ink` or `muted`, never multicoloured
- **Divider:** `h-px bg-line`, and only where space alone is not enough
- **Loading:** `ActivityIndicator` in `colors.accent` on `canvas`
- **Chat bubbles (spec 11):** the traveller's message is `accent` with
  white text. The assistant's is `surface` with `ink` text

---

## Before a screen is done

- No hex value, `amber`, `orange`, `rose`, `slate`, `sky`, or `blue`
  class appears in the diff
- Every surface is a `Card`, every button a `Button`
- The accent appears on at most two elements in one viewport
- The loading and empty states use the same canvas as the screen
- It was looked at on a device and on web next to
  `context/design/mockup.png`
