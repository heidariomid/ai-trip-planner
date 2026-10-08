# After-Review Action

**Optional.** Best after implementation, before `/feature complete`.
`complete` does not wait for this. Skip it when the user wants to merge
without a write-up.

Code that typechecks but was never opened on a phone is assumed, not
reviewed. **A React Native screen has no compile-time proof it renders.**
TypeScript cannot catch a view with zero height, a keyboard covering the
submit button, or a row silently blocked by RLS.

## 1. Read context

- [project.md](../project.md) — where the write-up is saved, QA devices, known QA story
- @context/current-feature.md — goals and notes
- The phase spec in @context/features/ if loaded from one
- @context/ai-interaction.md — verification checklists (sections A, B, C)
- @context/design-system.md — the "Before a screen is done" list

## 2. Code review

Review all changes on the feature branch against the goals:

- ✅ Goals met
- ❌ Goals missing or incomplete
- ⚠️ Code quality issues or likely bugs
- 🚫 Scope creep (work beyond goals)

Pay extra attention when the phase touches **auth or the database**:

- No secret in the client bundle. Only `EXPO_PUBLIC_*` reaches the app,
  and the service-role key must never be one of them
- Every new table has RLS enabled and a policy that actually matches the
  queries the app makes
- Errors surface as readable copy, never a raw Supabase message
- Session restores on cold start — not just right after sign-in

## 3. Automated checks

Run and fix before giving a pass:

```bash
npx tsc --noEmit
npx expo-doctor
```

There is **no lint script**. Do not run `npx expo lint` and do not report
lint as passing. If `expo-doctor` flags version mismatches, say so — it is
the closest thing this project has to a build gate.

## 4. On-device verification

@context/ai-interaction.md section **A**. Actually perform these — do not
infer from code:

- **Renders** — the screen opens on a real device or simulator, not just
  in the bundler with no red screen
- **Both platforms** if the phase touches native config, deep links or
  permissions. If you only checked iOS, say only iOS
- **Keyboard** — the focused input stays visible; the submit button is
  reachable with the keyboard open
- **Small screen** — nothing clipped or overlapping the notch / home
  indicator
- **Cold start** — kill the app and reopen. Session and navigation state
  must land where they should
- **Offline / failure path** — turn off the network and confirm the error
  state is readable copy, not a spinner forever
- **Console** — no red box and no unhandled promise rejection warnings

Use the physical phone from `project.md` when the simulator is unavailable.

## 5. Supabase QA (required for phases touching auth or data)

@context/ai-interaction.md section **B**. Walk the dashboard as a
maintainer would:

- **Authentication → Users** — the account you just created is there, with
  the provider you expect
- **Table Editor** — the row landed, with the right foreign key and no
  nulls where the app assumed a value
- Run the sign-up flow **twice** — once new, once with an email that
  already exists — and confirm both outcomes are handled
- For every new table: read, insert, update, delete as a signed-in user
  **and** confirm a signed-out client is refused

A table that inserts from the dashboard but fails from the app is almost
always RLS. Check the policy, not the client code, first.

Skip only the checklist items that belong to a later phase.

## 6. Access control (when tables or policies changed)

Signed-out checks against the REST endpoint with the anon key:

- Public reads that should work → 200
- Rows that belong to another user → empty result, never someone else's data

See section B end in @context/ai-interaction.md.

## 7. Save the result as a file

The write-up is a **team briefing**, not a QA log. Someone who did not run
the checks should still understand: is it safe to ship, and what is broken
in plain words. Do **not** paste the findings in chat.

**Voice.** Short sentences. What a traveller would see. Define a term the
first time it is not obvious. No file tours, no raw errors unless one line
of the message is the whole point.

1. Read the "Review write-ups" section of `project.md` for the folder,
   the file name, the language, and the title shape.
2. Same feature already has a file → update it. None → create it.
3. Plain GitHub-flavoured markdown. Start with the date and the status
   or branch
4. File shape:
   - Opening section: the verdict + the one thing to remember
   - A simple table: device QA, Supabase QA, typecheck, expo-doctor,
     console — PASS / FAIL / SKIPPED, each with a one-line reason a
     teammate can read
   - Blockers: what is broken, who it hits (traveller / us / nobody yet),
     and whether it is already fixed
   - Sign-off checkboxes from @context/ai-interaction.md section **C**
5. End with what they should do next (complete, or fix the blockers).

Never report success for a step you did not run. "Could not test Android,
no device" is a useful sentence; a silent pass is not.

## 8. Pointer in current-feature

Append only this to **Notes** (so `/feature complete` can see it ran):

```
After-review — [date]
- Verdict: Ready to complete / Needs changes
- Write-up: {file path}
```

## 9. Chat

Chat is **only**:

- The verdict: **Ready to complete** or **Needs changes**
- A link to the write-up file

If Needs changes: one line that the blockers are in the file; do not commit
or run `/feature complete`. If a step was skipped, one short clause why.

## 10. Cleanup

Before ending the turn, stop leftover work from this after-review:

- Kill `npx expo start` and any other process you started
- Close browser tabs used for the Supabase dashboard
- Delete session-only screenshots and temp helpers
- Delete any test user you created in Supabase, unless the user wants it
