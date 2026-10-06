# Pre-Review Action

**Optional.** Best after `/feature load`, before `/feature start`.
`start` does not wait for this. Skip it when the change is small and the
spec is already clear.

Not `/feature after-review`. Do not typecheck, build, start the dev
server, create a branch, or write the feature. Status stays Not Started.

## 1. Read context

- [project.md](../project.md) — this repo's Notion parent, who the user
  is, QA devices. Required for the briefing voice
- @context/current-feature.md — goals and notes
- The spec in @context/features/ or @context/fixes/ if one was loaded
- @context/coding-standards.md
- @context/project-overview.md

If Goals are empty: stop. "Run /feature load first."

## 2. Read the files the spec will touch

Open the current code. Do not rely on memory.

- Screens, components, and data models the spec names
- Existing navigation, state and hooks it says to change
- Helpers it will reuse (`lib/`, `hooks/`, config, env)
- `app.json` — scheme, plugins, permissions the spec implies
- `package.json` — is a named dependency already installed, and at what
  version?

Follow an existing pattern in the repo. Do not invent a new one.

## 3. Check platform and SDK defaults

This is where a React Native spec usually breaks. Check all of these when
relevant:

- **Expo Go vs development build.** Any package with native code does not
  run in Expo Go. If the spec needs one, that is a **must change** — it
  changes how the user runs the app, not just the code
- Read the versioned Expo docs for the SDK major in @AGENTS.md, and the
  vendor's own docs for anything third-party
- iOS and Android differences the spec glosses over (deep link schemes,
  permissions, keyboard behaviour, safe areas)
- Supabase defaults that bite later: RLS on by default, email confirmation
  on by default, redirect URL allowlists

A limit that only appears on a real device is a must-change.

## 4. Classify findings

| Mark | Meaning |
| ---- | ------- |
| **Must change** | Spec or current code will fail or contradict if implemented as written |
| **Spec amendment** | Small change so the spec matches how it will actually be built |
| **Implementation note** | Easy to miss; no product vote |
| **Do not add** | Out of scope, or extra screens / vendors |

## 5. Save the result to Notion

The write-up is a **team briefing**, not a developer dump. Someone who does
not read the repo should be able to vote. Do **not** paste the findings in
chat.

**Voice.** Short sentences. What happens for the traveller using the app,
then why. Define a term the first time it is not obvious. No file tours,
no stack traces, no "see line 40". One real example only when it makes the
risk obvious.

1. Fetch `notion://docs/enhanced-markdown-spec` and follow it. Do not guess
   Notion markdown.
2. Search Notion using `project.md` (parent + index). Same subject → update.
   None → create under Parent and link from Index. If Parent is not set in
   `project.md`, ask the user for it once rather than guessing a location.
3. Title from `project.md` title shape + the H1 feature name
4. Page shape:
   - Opening callout: the one thing to remember + the verdict
   - For each must-change / amendment: **what it is now**, **what the
     traveller would see if we ship that**, **why we want a change**,
     **what we recommend**
   - Implementation notes in one short table (dev traps, not votes)
   - Do not add
   - **Votes** as checkboxes the team can tick
5. End with what they should do next (approve the boxes, or start is fine).

Do not implement. Do not edit the spec until the user says the team agreed.

## 6. Pointer in current-feature

Append only this to **Notes** (so `/feature start` can see it ran):

```
Pre-review — [date]
- Verdict: Ready to implement / Needs decisions
- Notion: {url}
```

Leave Goals unchanged until decisions are approved. After the team agrees,
update Goals, Notes, and the spec so implementation follows the new text.

## 7. Chat

Chat is **only**:

- The verdict: **Ready to implement** or **Needs decisions**
- The Notion URL

If a step was skipped, one short clause why. No findings dump.
