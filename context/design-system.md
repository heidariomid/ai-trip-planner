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
  accent colour
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

| Shadow | Use |
| --- | --- |
| `shadows.card` | A card resting on the canvas |
| `shadows.soft` | A small white control: secondary button, tab bar |
| `shadows.accent` | An accent-filled control: primary button, add button |

Radius: `rounded-card` (24px) for cards, `rounded-2xl` for inputs and
images inside a card, `rounded-full` for buttons, chips, and badges.

---

## Type

The font is Outfit from spec 3 on. Until then it is the system font.

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
  `shadows.card`
- `components/Button.tsx` — a capsule, 48pt tall, centred by default.
  `primary` is accent with white text. `secondary` is white with a
  `line` border. `fullWidth` only when the layout needs it
- `components/TextField.tsx` — label above, filled with `canvas`, accent
  border on focus, red border and message on error
- `components/FormMessage.tsx` — `error` is red, `info` is `accent-soft`
- `components/AuthScreenLayout.tsx` — canvas, safe area, keyboard handling

---

## Patterns for components not built yet

Build them this way when their spec arrives.

- **Screen:** `bg-canvas`, safe area respected, 20px side padding,
  content capped at `max-w-[380px]` and centred
- **Tab bar (spec 3):** floating, `surface`, `shadows.soft`. Inactive
  icons are `muted`. The active icon is white inside an `accent` circle.
  No labels under the icons unless the board requires them
- **Add button:** a 56pt `accent` circle with a white plus and
  `shadows.accent`
- **Chip and filter:** a capsule. Selected is `accent` with white text.
  Unselected is `surface` or `canvas` with `subtle` text
- **Badge (Upcoming, Ongoing, Past, roles):** a small capsule. The one
  state that matters now uses `accent-soft` with `accent` text. Every
  other state uses `canvas` with `subtle` text. Do not give each status
  its own colour
- **Trip card:** a `Card` with the cover image on top (`rounded-2xl`),
  a bold title, a `subtle` route line, and dates in a `canvas` strip at
  the bottom
- **Icons:** Lucide, `ink` or `muted`, never multicoloured
- **Divider:** `h-px bg-line`, and only where space alone is not enough
- **Loading:** `ActivityIndicator` in `colors.accent` on `canvas`
- **Empty state:** a `subtle` sentence and at most one button. No
  illustration unless the board shows one
- **Progress bar (spec 8):** a `canvas` track with an `accent` fill
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
