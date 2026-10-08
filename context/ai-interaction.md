# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features that aren't in the project spec
- Never delete files without clarification

## Workflow

The common workflow for every feature/fix:

1. **Document** — document the feature in @context/current-feature.md
2. **Branch** — create a new branch for the feature/fix
3. **Implement** — implement what's described in @context/current-feature.md
4. **After-review** (optional) — `/feature after-review` if the user wants
   a QA write-up in `docs/`: code against goals, device QA, Supabase QA,
   `npx tsc --noEmit`, `npx expo-doctor`
5. **Iterate** — fix what the user or after-review flagged
6. **Commit** — only when the user asks
7. **Merge** — merge to main
8. **Delete Branch** — delete the branch after merge
9. Mark as completed in @context/current-feature.md and add to History

Do NOT commit without permission or before the typecheck passes. If it
fails, fix the issues first.

## Verification

There is no automated test suite in this project (see
@context/coding-standards.md). Verification is manual and must actually be
performed — not assumed.

**A React Native screen has no compile-time proof that it works.**
TypeScript cannot see a view with zero height, a keyboard covering the
submit button, a native module missing from Expo Go, or a query that
returns nothing because a row-level security policy blocked it. All four
compile cleanly and all four are broken on the phone. This is why the
checklists below exist.

**When you run `/feature after-review`**, actually perform both checklists.
The step itself is optional; faking it is not.

### A. On device (every phase)

Before marking any feature done:

- **Renders** — the screen opens on a real device or simulator. The
  bundler not erroring is not the same thing
- **Keyboard** — focus every input. The field stays visible and the submit
  button is still reachable. This is the single most common defect in a
  React Native form, and it is invisible in code review
- **Design** — the screen passes the "Before a screen is done" list in
  @context/design-system.md, compared against `context/design/mockup.png`
- **Safe area** — nothing clipped by the notch, the status bar or the home
  indicator
- **Both platforms** — required when the phase touches native config, deep
  links or permissions. If you only checked iOS, report only iOS
- **Loading and error states** — trigger both. Turn the network off and
  confirm the failure is readable copy, not an endless spinner
- **Cold start** — kill the app and reopen it. Session and navigation must
  land where they should
- **Console** — no red box, no unhandled promise rejection warnings
- **Checks** — `npx tsc --noEmit` and `npx expo-doctor` both pass

Report honestly. If a step was skipped or something didn't work, say so
plainly rather than reporting success. "Could not test Android, no device"
is a useful sentence; a silent pass is not.

### B. Supabase QA (mandatory after phases touching auth or data)

Walk the Supabase dashboard as a maintainer would, not as a developer
skimming code.

#### Auth

- [ ] Sign up with a new email → the account appears in
      **Authentication → Users** with the expected provider
- [ ] Sign up with an email that already exists → a readable error, not a
      crash and not a silent success
- [ ] Sign in with the wrong password → a readable error
- [ ] Sign in with Google → one user row, not a duplicate alongside the
      email account
- [ ] Sign out → the session is gone after a cold start, not just hidden
- [ ] Email confirmation: know whether it is on. If it is, a brand-new
      user has **no session** until they confirm, and the app must say so
      instead of appearing to hang

#### Tables

- [ ] The row landed in **Table Editor**, with the right foreign key
- [ ] No nulls in columns a screen assumes are populated
- [ ] Create, read, update and delete each new table as a signed-in user
- [ ] Confirm a **second** user cannot see the first user's rows. This is
      the test that actually proves row-level security, and the one most
      often skipped

#### Access control

With the anon key and no session:

- [ ] Reads that should be public → 200
- [ ] Rows belonging to a user → empty result, never another user's data

A row that inserts from the dashboard but fails from the app is almost
always RLS. Check the policy before the client code.

#### When something fails

1. Reproduce on the device (note the exact button pressed)
2. Check the Supabase dashboard logs for the matching request
3. Fix, reload, **re-run the failing checklist item**
4. Record the bug in the phase History or current-feature Notes so it is
   not reintroduced

### C. Phase sign-off template

Copy into current-feature History when closing a phase:

```
Phase N verification — [date]
- On device: PASS / FAIL (which device, which OS)
- Supabase QA: PASS / FAIL (notes)
- Typecheck / expo-doctor: PASS / FAIL
- Known gaps left for later phases: …
- Bugs found and fixed: …
```

## Expo Go is the current runtime

The app runs in **Expo Go on a physical iPhone**. That is a constraint on
design, not just on testing:

- A package with native code does not run in Expo Go. Check before you
  choose it, and say so before writing code against it
- Moving to a development build is a real decision with real cost. Raise
  it; do not make it silently by adding a dependency
- The simulator may be unavailable on this machine. If `npm run ios`
  fails, QA on the phone and report which one you used

## Branching

Create a new branch for every feature/fix. Name it **feature/[feature]** or
**fix/[fix]**. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused — one feature/fix per commit
- Never commit `.env` or any real key. Only `.env.example` with placeholders
- Never put "Generated with Claude" or any AI attribution in commit messages

## When stuck

- If something isn't working after 2–3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code review

Review AI-generated code periodically, especially for:

- Security (RLS policies, secrets in the bundle, what `EXPO_PUBLIC_*` exposes)
- Performance (list rendering, images, re-renders, over-fetching)
- Logic errors (unhandled loading and error states)
- Patterns (does it match the rest of the codebase?)
- Platform correctness (safe areas, keyboard handling, iOS vs Android)
