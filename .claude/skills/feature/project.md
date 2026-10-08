# Feature skill — this project only

The action files are reusable. **This file is not.** Copy the `feature`
skill to another repo and replace these values. Do not put project names
or write-up locations in the action files.

## Who we write for

- **Traveller** — the person using the app to plan a trip. The only
  end user this product has
- **Us** — there is no external client on this project. Write briefings
  for a teammate, not for a non-technical owner
- **App language** — English, left-to-right. No RTL work here (unlike the
  bakery repo this skill came from)

## Review write-ups

- **Where:** the `docs/` folder in this repo. Notion is not used on this
  project (user decision, 2026-10-07). Do not search, create, or update a
  Notion page
- **File name:** `docs/spec{N}-pre-review.fa.md` or
  `docs/spec{N}-after-review.fa.md`. For a fix with no spec number, use a
  short kebab-case name in place of `spec{N}`
- **Language:** Persian, and short, written the way one developer talks
  to another. Conversational, not a formal or book-style translation
- **Never translate a technical term.** Keep it in English inside the
  Persian sentence: spec, pre-review, explore plan, source, destination,
  trip, card, copy, banner, migration, row, policy, bucket, screen,
  route, blocker, and so on. Write «spec 6», not «اسپک ۶»; `source`, not
  «مبدأ». A translated term reads as vague and has to be mapped back to
  the code (user correction, 2026-10-07)
- Name the real thing a sentence is about: the column, the function, the
  component. «explore plan فیلد `source` نداره» is clear; «پلن آماده مبدأ
  ندارد» is not
- **Direction:** right-to-left. Wrap the whole file in
  `<div dir="rtl" align="right">` … `</div>`, with a blank line after the opening tag
  and before the closing one so the markdown inside still renders
- **Title shape:** `# Pre-review برای spec {N}: {feature}` or
  `# After-review برای spec {N}: {feature}`

Same feature → update its file. Do not create a second one.

## QA

- **No production deployment yet.** There is no EAS build and no store
  listing. QA happens on the dev server only
- **Device:** a physical iPhone running Expo Go, signed in as `omidev88`
  — the same account as the CLI, or the dev server will not appear
- **Simulator:** was unavailable (Xcode 27 shipped without an iOS runtime).
  If `npm run ios` still fails, QA on the physical phone and say so
- **Checks:** `npx tsc --noEmit` and `npx expo-doctor`. There is **no**
  lint script — do not run `npx expo lint` and do not report it as passing
- **Supabase:** QA the dashboard the way a maintainer would — Table Editor
  for rows, Authentication → Users for accounts. A row that inserts but is
  blocked by RLS on read is the failure mode to look for
- **Known QA story:** nothing yet. Record the first real one here — the
  bug that looked fine in code and only showed up on the phone
