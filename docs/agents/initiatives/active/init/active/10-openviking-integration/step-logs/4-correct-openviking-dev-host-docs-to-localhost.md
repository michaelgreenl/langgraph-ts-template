# Step 4 Log

## Step

- Corrective retry: align the Phase 4 OpenViking docs/plan contract to the approved loopback dev host (`127.0.0.1`).

## Pre-flight

- Read the full Phase 4 `tasks.md` before editing.
- Scanned `docs/usage/mvp/maw-cli.md`, `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`, and `docs/agents/initiatives/active/init/init-plan.md`.
- Confirmed this retry is docs/plan only and must not change product code or the blocked Step 5 smoke log.
- No blockers found.
- Confirmed the live contract already seeds `.maw/ov.conf.server.host` as `127.0.0.1`, while `.maw/ovcli.conf` still uses `http://localhost:1933`, so the corrective change should update the bind host text and clarify the loopback relationship.

## Changes

- Updated `docs/usage/mvp/maw-cli.md` so the `.maw/ov.conf` example now shows `127.0.0.1` and added a note clarifying that `localhost` still targets the same loopback listener.
- Updated `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md` so the Phase 4 `.maw/ov.conf` default now shows `127.0.0.1` and the surrounding wording now describes these as loopback defaults instead of matching defaults.
- Updated `docs/agents/initiatives/active/init/init-plan.md` so the `.maw/ov.conf` generated-fields example now shows `127.0.0.1` and the `.maw/ovcli.conf` note now calls out the loopback default URL.
- Also cleaned up ambiguous wording around the host/url relationship so the written contract is clearer (Boy Scout Rule: improved intent clarity, G16).

## Files

- `docs/usage/mvp/maw-cli.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`
- `docs/agents/initiatives/active/init/init-plan.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/4-correct-openviking-dev-host-docs-to-localhost.md`

## Verification

- `bun run build` in `langgraph-ts-template/` — **PASS**
  - Output: `$ tsc`
- `bun run lint` in `langgraph-ts-template/` — **PASS**
  - Output: `$ eslint src`
- `bun run test` in `langgraph-ts-template/` — **PASS**
  - Output: `7` test files passed, `29` tests passed.
- `rg "127\.0\.0\.1" docs/usage/mvp/maw-cli.md docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md docs/agents/initiatives/active/init/init-plan.md` — **PASS**
  - Output showed `127.0.0.1` matches in all three corrected docs/plan files.
- `! rg '"host": "0\.0\.0\.0"|0\.0\.0\.0' docs/usage/mvp/maw-cli.md docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md docs/agents/initiatives/active/init/init-plan.md` — **PASS**
  - Output: no matches.

## Summary

- Corrected the remaining Phase 4 docs/plan references from `0.0.0.0` to `127.0.0.1` so the written contract matches the approved Step 2 code/test fix.
- Left product code and the blocked Step 5 smoke log untouched, as required.

## Remaining

- No corrective docs tasks remain in this approved retry scope.
- Step 5 smoke verification can be rerun afterward against the now-aligned docs/plan contract.

## Issues

- No blocking issues remain.
- `.maw/ovcli.conf` still documents `http://localhost:1933` by design; this retry did not change that URL because the current generated contract and tests still use it.
