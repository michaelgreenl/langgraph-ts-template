# Step 2 Log

## Step

- Corrective retry: correct seeded OpenViking dev host to loopback (`127.0.0.1`) for Phase 4 Step 2.

## Pre-flight

- Read the full Phase 4 tasks doc and relevant plan notes before changing code.
- Scanned `maw-cli/src/commands/init.ts`, `maw-cli/tests/init.test.ts`, `maw-cli/package.json`, and `maw-cli/AGENTS.md`.
- No implementation blockers found.
- Noted only one scope concern: the phase docs/plan still mention `0.0.0.0`, but this corrective retry is explicitly limited to code, tests, and regenerated build output. Docs are deferred to the next corrective step.

## Changes

- Updated the seeded `.maw/ov.conf` default in `maw-cli/src/commands/init.ts` from `0.0.0.0` to `127.0.0.1`.
- Added `OV_HOST` to make the seeded bind host explicit (Boy Scout Rule: replaced a magic string with a named constant, G25).
- Updated `maw-cli/tests/init.test.ts` to assert the new loopback host.
- Regenerated `maw-cli/dist/commands/init.js` via `bun run build`.

## Summary

- Fixed the Phase 4 seeded OpenViking server bind default so new MAW projects use `127.0.0.1`, matching the installed `openviking-server` dev auth requirement discovered in smoke verification.
- Preserved all other Step 2 behavior unchanged: `package.json` requirement, script seeding, `ovcli.conf` creation, rerun preservation, and warning behavior.

## Files

- maw-cli/src/commands/init.ts
- maw-cli/tests/init.test.ts
- maw-cli/dist/commands/init.js

## Verification

- `bun run test -- tests/init.test.ts` in `maw-cli/` — **FAIL (expected red step before fix)**
  - Vitest failure showed `.maw/ov.conf.server.host` expected `127.0.0.1` but received `0.0.0.0`.
- `bun run test -- tests/init.test.ts` in `maw-cli/` — **PASS**
  - `tests/init.test.ts (12 tests) 81ms`
- `bun run build` in `maw-cli/` — **PASS**
  - `tsc`
- `bun run lint` in `maw-cli/` — **PASS**
  - `eslint src`
- `bun run test` in `maw-cli/` — **PASS**
  - `Test Files  9 passed (9)`
  - `Tests  55 passed (55)`

## Remaining

- No code tasks remain in this corrective retry scope.
- Follow-up corrective step still needs to align docs/plan text that currently describe the old `0.0.0.0` default.

## Issues

- No blocking issues remain.
- Documentation still references `0.0.0.0`; intentionally not changed here to stay within the approved corrective scope.
