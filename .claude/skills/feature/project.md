# Feature skill — this project only

The action files are reusable. **This file is not.** Copy the `feature`
skill to another repo and replace these values. Do not put project names
or Notion URLs in the action files.

## Who we write for

- **Traveller** — the person using the app to plan a trip. The only
  end user this product has
- **Us** — there is no external client on this project. Write briefings
  for a teammate, not for a non-technical owner
- **App language** — English, left-to-right. No RTL work here (unlike the
  bakery repo this skill came from)

## Notion

- **Parent:** _not set — ask the user for the parent page URL before the
  first pre-review or after-review_
- **Index:** _not set_
- **Title prefix:** Trip Planner
- **Title shape:** `{prefix} {feature from H1} — Pre-Review` or `After-Review`

Search the index before creating a page. Same subject → update. New page
goes under Parent and is linked from Index.

Until Parent is set, do not invent a page location. Ask once, then write
the URL into this file so the next run does not have to ask again.

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
