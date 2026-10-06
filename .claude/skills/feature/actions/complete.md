# Complete Action

`/feature after-review` is optional. Do not refuse complete if it is
missing. If Notes have After-review **Needs changes**, mention it, then
still complete if the user asked.

Produces exactly ONE commit per feature. Do not create a separate
`chore: reset current-feature.md` commit — the reset is part of the feature
commit itself.

1. Reset current-feature.md FIRST, before staging anything:
   - Add the feature summary to the END of History (take the wording from
     `git log --oneline`, so History matches the real commit messages)
   - Change H1 back to `# Current Feature`
   - Clear the feature name, Status, Goals and Notes (keep placeholder comments)
2. Confirm no secrets are staged. `.env` must stay ignored; only
   `.env.example` with placeholder values is committed
3. Stage all changes — code and the reset doc together — and commit with a
   descriptive conventional-commit message
4. Switch to main and merge the feature branch (fast-forward, no merge commit)
5. Delete the local feature branch
6. Push main to origin ONCE — only if an `origin` remote exists. This repo
   may have no remote; if so, say that instead of creating one
7. If the feature branch was previously pushed, delete it from origin
8. Cleanup leftovers from after-review/complete: stop terminals you started
   (`npx expo start`), close any browser tabs, delete session-only
   screenshots and temp helpers. Do not leave a dev server running.
