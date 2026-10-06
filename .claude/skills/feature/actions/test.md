# Test Action

Optional. This project has **no test runner** — prefer
`/feature after-review`. Do not invent a harness.

1. Read current-feature.md
2. Check `package.json` for a test script and look for existing tests
3. If there is no test runner: stop. Tell the user to use `/feature after-review`
4. If tests exist: follow **this repo's** helpers and style. Do not copy
   Jest paths, Vitest config, or mock names from another project
5. Only add tests for pure utilities in `lib/` with real branches
   (happy path + the error path that has its own code). Do not try to
   unit-test screens — on-device QA covers those
6. Run the repo's test command and report what ran
