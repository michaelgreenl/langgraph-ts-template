# Step 2 Log

## Step

- Corrective retry: restore OpenAI-backed OpenViking defaults in the seeded `.maw/ov.conf` for Phase 4 Step 2.

## Pre-flight

- Read the full Phase 4 tasks doc before changing code.
- Scanned `maw-cli/src/commands/init.ts`, `maw-cli/tests/init.test.ts`, `maw-cli/tests/support.ts`, `maw-cli/package.json`, and the Phase 4 init plan notes.
- No additional implementation blockers found.
- Noted one non-blocking scope concern: the broader Phase 4 task/plan docs still show the reduced `.maw/ov.conf` example, but the manager-approved corrective contract explicitly restores the OpenAI-backed provider defaults. Docs remain deferred to the next corrective step.

## Changes

- Updated `maw-cli/src/commands/init.ts` so first-run seeding of `.maw/ov.conf` restores the approved OpenAI-backed defaults while keeping:
  - `storage.workspace = "./.maw/openviking"`
  - `server.host = "127.0.0.1"`
  - `server.port = 1933`
- Restored the seeded OpenViking provider fields using the `${OPENAI_API_KEY}` placeholder for both dense embedding and VLM config.
- Kept rerun behavior unchanged: existing edited `.maw/ov.conf` files are still preserved and not reconciled.
- Updated `maw-cli/tests/init.test.ts` to assert the restored seeded `.maw/ov.conf` contract.
- Regenerated `maw-cli/dist/commands/init.js` via `bun run build`.
- Also cleaned up the seeded config literals by introducing named constants for the shared OpenAI base URL, env placeholder, model names, and concurrency values (Boy Scout Rule: reduced duplication and magic numbers, G5/G25).

## Files

- `maw-cli/src/commands/init.ts`
- `maw-cli/tests/init.test.ts`
- `maw-cli/dist/commands/init.js`

## Verification

- `bun run test -- tests/init.test.ts` in `maw-cli/` — **FAIL (expected red step before fix)**
  - Vitest failure showed `.maw/ov.conf` was still missing the restored `embedding` and `vlm` sections.
- `bun run test -- tests/init.test.ts` in `maw-cli/` — **PASS**
  - `tests/init.test.ts (12 tests) 87ms`
- `bun run build` in `maw-cli/` — **PASS**
  - `tsc`
- `bun run lint` in `maw-cli/` — **PASS**
  - `eslint src`
- `bun run test` in `maw-cli/` — **PASS**
  - `Test Files  9 passed (9)`
  - `Tests  55 passed (55)`

## Summary

- Restored the approved OpenAI-backed `.maw/ov.conf` bootstrap defaults without changing any other Step 2 behavior.
- New MAW projects now seed loopback OpenViking server settings plus the required OpenAI dense embedding and VLM provider config, while reruns still preserve user edits.

## Remaining

- No code tasks remain in this corrective retry scope.
- Broader Phase 4 docs/plan alignment remains intentionally out of scope for this retry and should be handled in the next corrective step.

## Issues

- No blocking issues remain.
- The broader Phase 4 task/plan docs still describe the reduced `.maw/ov.conf` example; intentionally not updated here to stay within the approved corrective scope.
