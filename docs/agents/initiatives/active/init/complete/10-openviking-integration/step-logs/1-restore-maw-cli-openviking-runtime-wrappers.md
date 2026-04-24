# Step 1 Log

## Step

- Restore `maw-cli` OpenViking runtime wrappers.

## Pre-flight

- No implementation blocker found in `tasks.md`, the current `maw-cli` runtime wrappers, or the existing Step 1 tests.
- Concern carried into the retry: the approved runtime contract now requires scoped `.env` fallback reads for `.maw/ov.conf` placeholder resolution, which is broader than the older env-only wording in `tasks.md` and the default repo no-`.env` rule. I proceeded only within the explicitly approved narrow scope: lazy MAW-root `.env` reads, no Bun auto-loading, no `process.env` mutation, no secret logging, and no persistence beyond the existing temp config outside the project tree.
- Existing Step 1 behavior already stayed aligned on the rest of the contract: `.maw/ov.conf` remained the source config, the resolved launch config stayed under a system temp dir outside the project root, `openviking-server --config <resolved-temp-config>` remained the wrapper handoff, and unresolved placeholders still needed to fail clearly.

## Changes

- Kept the existing Step 1 temp-config behavior intact: the resolved OpenViking server config still lives under a system temp directory created with `mkdtemp(join(tmpdir(), ...))`, outside the MAW project tree, and is still cleaned up after wrapper execution or write failure.
- Added explicit MAW-root `.env` fallback resolution to `maw-cli/src/utils/openviking.ts` for `maw-cli ov:server`, using process env first and only consulting `.env` when the first pass leaves placeholders unresolved.
- Parsed the fallback `.env` content explicitly with Node's `parseEnv`, so the runtime does not rely on Bun auto-loading and does not mutate global `process.env`.
- Preserved clear unresolved-placeholder failures when a value is missing from both sources, while avoiding secret logging and limiting `.env` usage to placeholder resolution only.
- Extended `tests/ov-server.test.ts` so Step 1 now proves local `.env` fallback resolution, process-env precedence over `.env`, lazy skip behavior when process env already satisfies every placeholder, and the existing temp-config launch/cleanup behavior.
- Left Step 1 checked in `tasks.md`; no checklist edit was needed for this retry.

## Files

- `maw-cli/src/utils/openviking.ts`
- `maw-cli/tests/ov-server.test.ts`
- `maw-cli/dist/utils/openviking.d.ts`
- `maw-cli/dist/utils/openviking.js`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/1-restore-maw-cli-openviking-runtime-wrappers.md`

## Verification

- `bun run test -- tests/ov-server.test.ts` in `maw-cli/` — FAIL before the code change (new `.env` fallback / precedence tests exposed the missing runtime-contract behavior)
- `bun run test -- tests/ov-server.test.ts` in `maw-cli/` — PASS after the fix
- `bun run build` in `maw-cli/` — PASS
- `bun run lint` in `maw-cli/` — PASS
- `bun run test` in `maw-cli/` — PASS
- `bun run test -- tests/cli.test.ts tests/ov-server.test.ts tests/ov-index.test.ts` in `maw-cli/` — PASS

## Summary

- Step 1 remains complete after the retry: `maw-cli ov:server` resolves `.maw/ov.conf` placeholders with process-env precedence plus MAW-root `.env` fallback, writes the resolved launch config into a system-temp location outside checked-in project files, passes that file to `openviking-server`, and removes it after use.

## Remaining

- None for Step 1.

## Issues

- None.
