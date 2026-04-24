# Step 2 Log

## Step

- 2. Teach `maw-cli init` to seed project-local OpenViking files and scripts

## Pre-flight

- No blockers found in `tasks.md`, `maw-cli/src/commands/init.ts`, `maw-cli/tests/init.test.ts`, or `maw-cli/tests/support.ts`.
- Clarified with the manager that the missing-`package.json` failure message only needed to be explicit, not exact-string matched to a prior contract.
- Clarified with the manager that preserving `package.json` means preserving parsed fields/values while allowing normal JSON rewrite formatting.

## Changes

- Updated `maw-cli init` to fail when the MAW scope root is missing `package.json`.
- Seeded the Phase 4 project files on first run only: `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf`.
- Seeded missing target-project scripts `maw:ov:server` and `maw:ov:index`, preserved matching values, and emitted `Warning:` for conflicting existing values without overwriting them.
- Kept `.gitignore` additions limited to `.maw/openviking/`.
- Expanded init coverage for missing-package failure, zero-workflow bootstrap, script seeding, conflict warnings, rerun preservation, and default `.maw/ovcli.conf` seeding independent from `maw.json`.
- Checked off the completed Step 2 items and Step 2 verification entries in `tasks.md`.

## Files

- `maw-cli/src/commands/init.ts`
- `maw-cli/tests/init.test.ts`
- `maw-cli/tests/support.ts`
- `maw-cli/dist/commands/init.js`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`

## Verification

- `bun run test -- tests/init.test.ts` in `maw-cli/` — PASS (`12 passed`)
- `bun run build` in `maw-cli/` — PASS
- `bun run lint` in `maw-cli/` — PASS
- `bun run test` in `maw-cli/` — PASS (`55 passed`)

## Summary

- Completed Step 2 within scope.
- `maw-cli init` now requires a target-project `package.json`, seeds project-local OpenViking files/scripts, and preserves user-edited config/script drift on rerun.

## Remaining

- No Step 2 tasks remain.
- Phase 4 Steps 3-5 remain out of scope for this log.

## Issues

- None.
