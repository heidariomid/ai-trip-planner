# Design System

Every screen in this app follows this file. The visual reference is
`context/design/mockup.png`, chosen by the user on 2026-10-07.

**The boards in `context/plan/` decide layout and content. This file
decides how it looks.** Where a board shows a colour, a gradient, or a
card style that disagrees with this file, this file wins.

---

## The look

Minimal and airy. A pale canvas, white cards, navy text, and one teal
accent. Photos and destination art supply the colour; the interface
stays quiet around them.

- Hierarchy comes from type size, weight, and space. Not from colour,
  borders, or boxes
- One accent, used rarely: the primary action, the active state, a link
- No gradients, no blur, no decorative shapes, no warm tones, no second
  accent colour. The one exception is the AI planning card on Home,
  which carries a pale sky-to-peach wash. Do not spread it
- Red is for errors only, apart from the `heart` token on a saved place
  and `danger` on Sign out

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
| `accent` | `#0F766E` | Primary button, active tab, links, the add button |
| `accent-deep` | `#0B5A53` | Pressed state of an accent element |
| `accent-soft` | `#D9EFEB` | Tinted background for a selected chip or an info message |
| `sky-soft` | `#E3F0FE` | One end of the wash on the AI planning card. Nowhere else |
| `peach-soft` | `#FFEBDD` | The other end of that wash. Nowhere else |
| `heart` | `#E5484D` | The filled heart of a saved place. Nowhere else |
| `danger` | `#DC2626` | The icon and label of Sign out |
| `danger-soft` | `#FEE2E2` | The circle behind the Sign out icon, and that row while pressed |

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

Persian text is drawn in IRANSansX, because Outfit has no Persian
letters. `Text`, `TextField`, and the chat composer switch to it on their
own when the string holds a Persian letter, at the same weight
(`font-fa-regular`, `font-fa-medium`, `font-fa-semibold`, `font-fa-bold`).
Never write those classes by hand. A string whose first letter
is Persian also reads right to left and is aligned right, unless its
class already aligns it. Only the text flips, not the layout.

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
  `line` border. `fullWidth` only when the layout needs it. `icon` puts a
  Lucide icon before the label, and `compact` trims the side padding for
  two buttons that share a row, as on a curated plan ("Copy to my trips"
  beside "Plan with AI" with a sparkles icon)
- `components/TextField.tsx` — label above, filled with `canvas`, accent
  border on focus, red border and message on error. `hint` puts quiet
  text right of the label, such as a character count. `multiline` makes
  it 96pt tall
- `components/FormMessage.tsx` — `error` is red, `info` is `accent-soft`
- `components/AuthScreenLayout.tsx` — canvas, safe area, keyboard
  handling, and above the title a brand row. It also mounts the install
  hint sheet.
  The brand row says what the app is to someone who opens the link
  cold: the app icon at 40pt with 10pt corners, "AI Trip Planner" in
  15px semibold `ink`, and one 13px `subtle` line under it
- `public/og-image.png` — the 1200 by 630 picture a shared link shows:
  the sky-to-peach wash, the icon, and the headline in Outfit. It is
  drawn outside the app, so the wash is allowed there
- `components/InstallHint.tsx` — how to put the web app on the home
  screen, on Sign In and Sign Up only. A sheet at the bottom over an
  `ink` scrim (user request, 2026-10-10, replacing a static block above
  the title): `surface` with `rounded-card` top corners, a `line` grab
  handle, the app icon at 56pt, a centred card-title headline, a
  `subtle` line, a divider, then three numbered steps, each a medium
  `ink` label with a Lucide icon in a 36pt `canvas` circle on the
  right. A full-width `primary` "Got it" closes it for good, and so
  does a tap on the scrim. On Android a `secondary` "Install app"
  button sits under it when the browser offers its prompt
- `components/Text.tsx` — every string. Sets the Outfit family
- `components/Screen.tsx` — a tab screen: canvas, top safe area, screen
  title, capped width, bottom padding for the tab bar. It does not
  scroll unless it is given `scroll`, which Profile uses
- `components/TabBar.tsx` — the floating capsule. Each tab is an icon
  above a 12px label. The active tab is `accent` on an `accent-soft`
  pill, the others are `subtle` with no background
- `components/Chip.tsx` — a 44pt capsule. Selected is `accent` with white
  text, unselected is `surface` with `subtle` text
- `components/EmptyState.tsx` — a `subtle` sentence and at most one button
- `components/Avatar.tsx` — the profile picture, or the first letter of
  the name on a `surface` circle. It takes `path` for an uploaded avatar
  and `uri` for a public or local one, and never shows the grey
  placeholder: no picture means the letter
- `components/ExploreCard.tsx` — a `Card` with a title, facts as label
  above value, tags as `canvas` capsules, and the plan's own bundled
  picture as a 92pt image on the right (user request, 2026-10-10; it
  replaced a static map drawing that read as a placeholder).
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
  whole ask bar is one button that opens the assistant. The
  header is one 22px line, a `subtle` greeting then the first name in
  bold `ink`. Nothing after the name: no emoji and no icon (the user
  found both ugly, 2026-10-08). The avatar is on the right, and it is a
  button that opens `components/ProfileMenu.tsx`: a sheet at the bottom
  like `TripMenu`, with the name and email, then Profile, Edit profile,
  and Saved places, a `line` divider, and Sign out. Nothing in it is
  `accent`. Sign out is red (user request, 2026-10-10): a 16pt icon in
  `danger` on a 32pt `danger-soft` circle, and the label in `danger`. The ask bar is a card with a pale wash from `sky-soft`
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
  form, for adding and editing. With no cover the picker is two dashed
  `canvas` tiles side by side, each a Lucide icon in `ink`, a medium
  title, and a `subtle` caption: "Upload image" and "Generate with AI",
  whose caption is the count left today ("3 left today", "Back
  tomorrow"). While a cover is being generated the tile's icon becomes
  a small `accent` spinner and the caption says how long it can take.
  With a cover showing, three quiet text actions sit under it on the
  right, "Change" and "Generate" in `ink` and "Remove" or "Undo" in
  `subtle`, with a `subtle` line below for the count left or the wait.
  A disabled tile or action is at 45% opacity. A generation that fails
  shows an error `FormMessage` under the picker, where the traveller is
  looking, not beside Save. Nothing here is `accent` but the spinner
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

- `components/ProfileForm.tsx`, `components/InterestChips.tsx` — the
  edit-profile form. An 88pt avatar centred above a quiet `ink` "Change
  photo", with a 32pt white camera badge on its corner. The avatar, the
  badge, and the label are one button, with no spinner and no crop
  step. Then the name field with a character count, and the interest tags
  as 44pt capsules that wrap. A picked tag is `accent-soft` with
  `accent` text and the others are `canvas` with `subtle` text, so Save
  stays the one filled accent element. Once six are picked the rest dim.
  On the Profile tab the same tags are quiet `Badge`s

- `components/ChatBubble.tsx`, `components/ChatCards.tsx`,
  `components/ChatComposer.tsx`, `components/TripPicker.tsx`,
  `components/Markdown.tsx` — the assistant screen. The traveller's
  message is an `accent` bubble with white text on the right. The
  assistant's is a `surface` bubble on the left with `shadows.soft`,
  its text drawn by `Markdown` (headings, bold, and lists, in Outfit;
  never a link or an image). Under a reply come its cards, each a
  `surface` block with `rounded-2xl`: a day card with a time column, place
  cards in a row that scrolls sideways (each 210pt wide: a 132pt photo
  of the place or the shared placeholder on top, then the name
  with a small up-right arrow, a `subtle` line, the address with a pin,
  and a `muted` 11px photo credit; tapping one opens Google Maps), a
  packing card (a `subtle` "Packing list" label, each category in
  semibold `ink` with its items in `subtle` under it, and one Add to
  Packing button), a
  trip summary card (a
  `subtle` "New trip" label, the title, then facts as label above
  value), a booking card (a Lucide icon in a `canvas` circle, the kind
  as a label, the name in bold), and suggestion chips as white 44pt
  capsules with `ink` text. A card's button is a `CardAction`: a 44pt
  capsule. The one that saves the card is filled `accent` with white
  text (Create Trip, Add to Trip, Add to Bookings, Add to Packing; user
  request, 2026-10-10, because outlined save buttons went unnoticed);
  every other one (Save Draft, Edit, Regenerate) is outlined with `ink`
  text. A hotel card also has a "View on Google Maps" link under its
  line, in the same style as the place on a day's stop. Once a card is saved its button reads "Added" at 45%
  opacity. A day card also has Edit, which turns each stop into an
  outlined `line` block with a remove cross and a `TimeField`, and Done
  to leave it. The place on a stop is a link: a pin, the name in medium
  `ink`, and a small arrow. With no trip selected, a card that needs one shows a
  `subtle` line in place of the button. The composer is a white capsule with one 40pt round button:
  `accent` with an up arrow to send, `canvas` with a square to stop.
  The trip picker is a white capsule that opens a sheet at the bottom,
  like `TripMenu`. While a reply has no text yet the bubble holds a
  small `subtle` spinner. A `muted` 12px line under the composer says
  the assistant can be wrong. Accent here is the traveller's bubbles
  and the send button, nothing else. After a question the list moves
  once, to put that question at the top of the screen, and then stays
  still while the reply is written under it; it never follows the
  reply down

- `components/AssistantButton.tsx` — a 56pt `accent` capsule with a white
  Lucide sparkles icon and "Ask AI" in semibold white, floating at the
  bottom right of a trip with `shadows.accent`. It opens that trip's
  conversation. It was a white 48pt capsule reading "Assistant"; the
  user said on 2026-10-10 that travellers do not notice it, so it is
  filled, and it is the one place the trip screen goes past the
  two-accent rule on purpose
- `components/DayPickerSheet.tsx` — a sheet at the bottom, like
  `TripMenu`, that asks which existing day of a trip a day card goes
  onto. A day is a 48pt row; the chosen one is `accent-soft` with
  `accent` text and a check. When that day already has activities, two
  tinted options sit under the list, "Keep the N already there" and
  "Replace those N", the chosen one `accent-soft`. Cancel is `secondary`,
  and the primary button says what it will do: "Add 2 activities" or
  "Replace with 2". It is the confirmation, so
  no dialog follows it
- `app/(app)/chat-history.tsx` — past conversations: a round back
  button, the screen title, then one `surface` row per conversation
  with `rounded-2xl` and `shadows.soft`. A row is the first message in
  medium `ink` (two lines at most), a `subtle` line with the trip and
  the date, and a `muted` bin on the right that asks first. The chat's
  header has two round buttons on the right, history and new
- A draft trip shows a quiet `Draft` badge wherever Upcoming, Ongoing,
  or Past would be
- A trip that is not the traveller's own shows a quiet `Shared` badge
  beside that one, on `TripCard` and under it on `TripBanner`. Roles
  never get a colour of their own
- `components/TripBanner.tsx` has two controls on the right of the
  cover: a white 44pt capsule with a Lucide `Users` icon and, when more
  than one person is on the trip, the number in semibold `ink`; then
  the round options button. The first opens the share screen
- A viewer's trip is read-only. Every section drops its "+ Add", its
  pencils, and its ticks (a packed item still shows its filled circle),
  a note and a booking are plain cards, and the photo viewer shows the
  caption alone. Nothing is greyed out; the controls are simply not
  there. In the chat a card that would write to that trip shows the
  `subtle` line "Only editors can add to this trip." in place of its
  button
- `app/(app)/trip/[id]/share.tsx`, `components/PersonRow.tsx` — who a
  trip is shared with. A round back button, the screen title, a
  `subtle` count, then one `surface` row per person with `rounded-2xl`
  and `shadows.soft`: a 44pt `Avatar`, the name in medium `ink` (with
  "(You)"), and the role in `subtle` under it: "Owner", "Can edit", or
  "Can view". For the owner a member's row has a `muted` ellipsis that
  opens the row in place: two 44pt capsules for the role, the chosen
  one `accent-soft` with `accent` text and the other `canvas` with
  `subtle` text, and a quiet `ink` "Remove" on the right, which asks
  first with `ConfirmDialog`. Under the list the owner sees one `Card`:
  a `subtle` "Join code" label, the code in bold 28px `ink` with wide
  letter spacing as `XXXX-XXXX`, a `subtle` line of help, and two
  buttons, "Copy code" (`primary`, reads "Copied" once it worked) and
  "New code" (`secondary`, asks first). A member sees a `subtle` line
  instead of the card. It is a screen and not a sheet, because it opens
  a dialog and a modal over a modal is unreliable on iOS
- `app/(app)/join-trip.tsx` — a `FormScreen` with a `subtle` line of
  help, one code field in capitals, and a "Join trip" button. A join shows
  an `info` `FormMessage` for a moment and then opens My Trips
- The Profile tab has three rows under the card, "Saved places",
  "Join a trip", and "Privacy policy": each a 56pt `surface` row with
  `rounded-2xl` and `shadows.soft`, a Lucide icon in `ink`, the label
  in medium `ink`, and a `muted` chevron. The profile card has a `muted`
  pencil with a 44pt target on its top right, which opens Edit profile.
  After a wider gap "Sign out" is a fourth row of the same shape with
  no chevron, drawn in red like the one in the account menu (a `danger`
  icon on a `danger-soft` circle and a `danger` label), and under it sits "Delete account": 14px medium red text
  with a 44pt target and no border or fill, which opens a
  `ConfirmDialog`. The tab has no capsule buttons (user request,
  2026-10-10: three stacked buttons looked messy). It is red because it destroys
  data, and it is text so it does not compete with the buttons
- Sign Up has one `subtle` 13px line above "Already have an account?"
  whose words "privacy policy" are underlined medium `ink`, not `accent`
- `public/privacy.html` is a plain page outside the app: the `canvas`
  background, `ink` text in the system font, and one white table. Its
  colours are written in the file, because it cannot read the theme
- `components/TripMenu.tsx` shows a row only to someone who may use it:
  "Edit trip" to the owner and an editor, "Delete trip" and "Move to my
  trips" to the owner, and "Leave trip" to a member
- **The heart on a place card** — a small 30pt white circle with
  `shadows.soft` on the top right corner of the card's photo, holding a
  16pt Lucide heart (user request, 2026-10-09: the 44pt circle was too
  much white around the heart). `hitSlop` keeps the tap target at 44pt: outlined `ink` when the place is not saved, filled
  `heart` red when it is (user decision, 2026-10-09, after a filled
  `ink` heart read as black). Never `accent`. It sits beside the card's link to Google
  Maps, not inside it, and changes at once with no spinner
- `app/(app)/saved-places.tsx` — saved places: a round back button, the
  screen title, then one `surface` row per place with `rounded-2xl` and
  `shadows.soft`, like the conversation list. A row is the name in
  medium `ink`, a `subtle` line with the label and the city, and a
  filled `heart` red heart on the right that removes it with one tap and no
  dialog. Tapping the row opens Google Maps. No photo
- The "Saved places" row on the Profile tab — a 56pt `surface` row with
  `rounded-2xl` and `shadows.soft`: an `ink` heart, the label in medium
  `ink`, the count in `subtle`, and a `muted` chevron

- **Desktop layout** — from 1024px wide a browser is "wide"
  (`useIsWide` in `hooks/useLayout.ts`; never the native app). The
  floating tab bar is replaced by `components/Sidebar.tsx`: a 248pt
  `surface` column with a `line` edge, the app icon and name, then
  Home, My Trips, Explore, Assistant, and Profile as 48pt capsules. The
  active one is `accent-soft` with `accent` text, like the active tab.
  Content is capped by `useContentWidth`: 1040 for a list of cards
  (Home, My Trips, Explore), which then shows two to a row; 720 for a
  screen that is read (a trip, a plan, the chat, the lists); 520 for a
  form and Profile. A cover is 320pt tall. Sheets and dialogs keep 380
- **The landing page** — `components/landing/`, shown at `/` to a
  signed-out visitor in a browser. It is marketing, drawn outside the
  app's rules like `og-image.png`: a mesh of `sky-soft`, `peach-soft`,
  and `accent-soft` on `canvas`, a glass nav, large type, and motion (fade-up on scroll, floating cards, a
  ticker, and a phone that plays a conversation). Its CSS is built from
  the tokens in `lib/landing-styles.ts` and added to the page at
  runtime; those `lp-` classes are used nowhere in the app. It still
  uses only the theme's colours. Its closing block is light, like the
  mockup: a white-to-`canvas` card with a soft grey shadow, a white
  seal holding an `ink` plane, an `ink` headline with a `muted` full
  stop, and the `accent` button. No red and no dark block: the user
  rejected both on 2026-10-10. Every section's eyebrow, headline, and
  lead are centred through `SectionHeader`; the user does not want
  section text pushed to one side

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

---

## Before a screen is done

- No hex value, `amber`, `orange`, `rose`, `slate`, `sky`, or `blue`
  class appears in the diff
- Every surface is a `Card`, every button a `Button`
- The accent appears on at most two elements in one viewport
- The loading and empty states use the same canvas as the screen
- It was looked at on a device and on web next to
  `context/design/mockup.png`
