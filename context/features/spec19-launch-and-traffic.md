# Spec 19 — Launch and Traffic Sources

## Overview

Spec 19 of 19. Depends on spec 17. Spec 18 is not a dependency, but
read "Before the public channels" below before skipping it.

The site is live and nobody knows it exists. This step shares it in
every place a developer project is normally shared, Product Hunt
included, and counts where the visitors and the sign-ups come from
(user request, 2026-10-10: "we wanna see where traffic mostly comes
from"). The aim behind it is the user's resume and GitHub profile, so
every post links the repository as well as the site.

The assistant builds the counting and drafts every post. **The user
publishes each post by hand, from their own accounts.** Nothing here
costs money.

## Requirements

### Counting where traffic comes from

- **Every shared link carries its channel**, as
  `https://plan-trip-ai.vercel.app/?ref=<channel>`. The `ref` value is
  one of a fixed list, written once in `lib/traffic.ts` and in the
  migration: `producthunt`, `hackernews`, `reddit-reactnative`,
  `reddit-expo`, `reddit-supabase`, `reddit-sideproject`,
  `discord-expo`, `discord-supabase`, `linkedin`, `devto`, `x`,
  `peerlist`, `indiehackers`, `github`, and `resume`. Anything else,
  and a visit with no `ref`, counts as `direct`
- A tag is used and not the browser's referrer, because apps such as
  LinkedIn, Reddit, and Discord open links in a way that often sends no
  referrer at all. Product Hunt adds `?ref=producthunt` to outgoing
  links by itself, which is why the parameter is named `ref`
- **Two numbers per channel per day: visits and sign-ups.** One table,
  `traffic_daily` (`day`, `source`, `visits`, `sign_ups`, unique on day
  and source), that no client role can read or write, like
  `chat_usage`. Two security definer functions in `public` add one to a
  counter: `record_visit(p_source)`, open to `anon`, and
  `record_sign_up(p_source)`, open to `authenticated`. Both turn an
  unknown source into `direct`, so the table cannot be filled with
  invented names. The migration is `0022`
- **Nothing personal is stored.** No user id, no IP address, no user
  agent, and no cookie. The counters cannot be traced back to a person,
  and a sign-up row does not say who signed up
- On the web only, the landing page reads `ref` once when it loads,
  keeps it in `sessionStorage`, calls `record_visit` once for that
  browser session, and takes the parameter out of the address bar. A
  failed call is silent: counting never shows an error and never delays
  the page
- `signUpWithEmail` and the first Google sign-in call `record_sign_up`
  with the stored source. The source has to survive Google's full-page
  redirect, which `sessionStorage` does. A sign-in to an existing
  account is not a sign-up
- **Known gap, said in the report:** an iPhone gives the home screen
  app its own storage, so someone who installs first and signs up from
  the icon counts as `direct`
- The numbers are read with one query the user can run in the SQL
  editor, saved as `supabase/queries/traffic.sql`: visits, sign-ups,
  and the sign-up rate per source, for a date range
- The privacy policy changes in the same commit. It says today that the
  app has no analytics trackers; it then says the site counts how many
  visits and sign-ups came from each shared link, as totals that are
  not tied to a person. The user approves the new sentence before it is
  published

### What a visitor from a launch sees

- The landing page shows the repository link where a developer will
  find it: in the nav and in the footer
- The README opens with a screenshot or a short GIF of the app, the
  live link, and the stack, before any setup text. The repository has
  a description, topics, and the site as its website (the user sets
  those on GitHub by hand)
- **When a shared AI allowance runs out, the visitor is told why.** The
  chat and the cover tile already show a sentence; check both read as
  "the free daily limit for everyone was reached, back tomorrow" and
  not as a fault. This will happen on a launch day
- No demo account (user decision, 2026-10-10). A visitor signs up to
  try the app, so the landing page's phone demo and screenshots carry
  the first impression

### The posts

- One file per channel in `docs/launch/`, in English, ready to paste:
  the title, the body, the link with its `ref`, and the repository
  link. Each is written for that channel and not copied between them:
  a developer community gets how it was built and one hard problem; a
  maker site gets what it does
- **Product Hunt** also needs a tagline, a short description, a
  thumbnail, gallery pictures, a first comment from the maker, and
  topics. Read Product Hunt's current launch guide for the sizes and
  the text limits before making anything. Pictures are drawn the way
  `og-image.png` was, with headless Chrome
- **A technical article** for dev.to: one real problem from this
  project told start to finish. Candidates are in `AGENTS.md`: Google
  sign-in from a home screen icon, the model that leaves junk after its
  JSON, and row-level security checked as three users. The user picks
  one
- Each community's own rules on self-promotion are read before its post
  is written, and a channel that forbids it is dropped from the list
  with a line saying so

### Before the public channels

- Channels go out in order, smallest first, so a problem is found by
  ten people and not by a thousand: the user's own circle and LinkedIn,
  then the Discord showcases and Reddit, then the article, then Show HN,
  and **Product Hunt last**
- Before Reddit and after: the user has opened every screen on a phone
  and with a second account, and what they found is fixed. `AGENTS.md`
  lists what was never checked
- Before Show HN and Product Hunt, the user decides on spec 18. Without
  it an account can be made with an address nobody checked and a
  forgotten password cannot be recovered. Launching without it is
  allowed; it is then said in the first comment, not hidden
- Product Hunt is launched once per product. It does not go out the
  same week as a failing step above

### The report

- One week after the last channel, `docs/launch-report.md`: visits,
  sign-ups, and sign-up rate per channel, which post did best and what
  people said, GitHub stars before and after, and what to do next. It
  says plainly what the numbers cannot show

## Out of scope

- Paid promotion, a paid analytics product, and a paid plan anywhere
- Tracking a person: no user-level analytics, no cookies, no session
  replay, and no per-page funnel inside the signed-in app
- Vercel Web Analytics. It is free on the Hobby plan up to a monthly
  limit, but which plan includes its UTM and custom event reports has
  to be checked, and the two counters answer the question without it.
  Add it later only if untagged traffic turns out to matter
- A demo account, a custom domain, and an App Store release
- New product features. A launch that wants one gets its own spec
- Posting from the assistant. Every post goes out from the user's hand

## Done when

- Opening the site with `?ref=producthunt` adds one visit to that
  source for today, a reload in the same tab does not add a second, and
  an invented `ref` counts as `direct`
- A new email account made after arriving with a `ref` adds one sign-up
  to that source, and so does a first Google sign-in. Signing in to an
  existing account adds none
- `anon` and `authenticated` cannot read or write `traffic_daily`
  directly, and the table holds no column that identifies a person
- With the network blocked for the counting call, the landing page and
  sign-up still work and show no error
- The privacy policy on the public address describes the counting, and
  the user approved the sentence
- `docs/launch/` holds a post for every channel still on the list, each
  with its own tagged link, and the Product Hunt pictures exist at the
  sizes its guide asks for
- The README opens with a picture of the app and the live link
- Every channel was either posted by the user, with the date written
  beside it, or dropped with a reason
- `docs/launch-report.md` exists and names the channel that brought the
  most visits and the one that brought the most sign-ups
- `npx tsc --noEmit` passes, and the exported files hold no secret key

## References

- @context/project-overview.md
- @context/features/spec17-release.md — the public address and the free
  AI allowances
- @context/features/spec18-password-reset-and-email.md
- @AGENTS.md — what was never checked on a phone, and the stories an
  article can be written from
- `public/privacy.html`, `docs/release-notes.md`
