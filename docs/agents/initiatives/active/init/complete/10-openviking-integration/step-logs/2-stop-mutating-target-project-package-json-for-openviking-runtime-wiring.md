# Step 2

## Pre-flight

- No blockers found.
- Concern noted before implementation: the current `init` path and tests were coupled to `maw:ov:*` script seeding/warnings, so Step 2 required reversing that behavior while preserving `.maw/ov.conf` and `.maw/ovcli.conf` bootstrap/rerun handling.

## Changes

- Updated `maw-cli/tests/init.test.ts` first to assert raw `package.json` contents stay unchanged for empty-project bootstrap, existing-script scenarios, and reruns.
- Removed `maw:ov:*` runtime script seeding/warning behavior from `maw-cli/src/commands/init.ts`.
- Kept the root `package.json` requirement by validating that it exists and parses as an object before workflow discovery.
- Refreshed the generated `maw-cli/dist/commands/init.js` output via `bun run build`.
- Also cleaned up: inlined the now-single-use package validation path in `init.ts` (F5).
- Marked only Step 2 task and verification checkboxes complete in `tasks.md` after verification passed.

## Files

- maw-cli/dist/commands/init.js
- maw-cli/src/commands/init.ts
- maw-cli/tests/init.test.ts
- docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md
- docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/2-stop-mutating-target-project-package-json-for-openviking-runtime-wiring.md

## Verification

- `bun run test -- tests/init.test.ts` — FAIL initially (expected TDD red: `package.json` was rewritten and script-warning output still appeared)
- `bun run test -- tests/init.test.ts` — PASS
- `bun run build` — PASS
- `bun run lint` — PASS

## Summary

- `maw-cli init` still requires a target-project `package.json` for workflow discovery, but it now leaves that file untouched for OpenViking runtime wiring.
- `.maw/ov.conf` and `.maw/ovcli.conf` bootstrap plus rerun preservation behavior stayed unchanged.
- Step 2 checklist items were updated after the step passed verification.

## Remaining

- None.

## Issues

- None.
