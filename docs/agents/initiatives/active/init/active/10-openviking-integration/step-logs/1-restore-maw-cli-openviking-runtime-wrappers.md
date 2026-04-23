# Step 1 Log

## Step

- Restore `maw-cli` OpenViking runtime wrappers.

## Pre-flight

- No blockers found in `tasks.md`, the current `maw-cli` runtime wrappers, or the existing test surface.
- Manager review confirmed the only Step 1 mismatch: `maw-cli/src/utils/openviking.ts` wrote the resolved runtime config into `<root>/.maw/ov.resolved.<uuid>.conf`, which violated the plan requirement that `maw-cli ov:server` keep the resolved launch config outside checked-in project files.
- Existing Step 1 behavior otherwise already matched scope: `.maw/ov.conf` remained the source config, `${VAR}` placeholders resolved against the provided env, unresolved placeholders failed clearly, and `openviking-server --config <resolved-temp-config>` was already wired.

## Changes

- Moved the resolved OpenViking server config from `<root>/.maw/...` to a system temp directory created with `mkdtemp(join(tmpdir(), ...))`.
- Preserved the existing Step 1 contract: `.maw/ov.conf` is still parsed from the MAW scope root, `${VAR}` placeholders are still resolved against the provided env, unresolved placeholders still fail clearly, and `openviking-server --config <resolved-temp-config>` still receives the fully resolved file.
- Tightened cleanup so the temp directory is removed after wrapper execution and also removed if writing the resolved config fails.
- Extended `tests/ov-server.test.ts` so Step 1 now proves the resolved placeholder values are written into the config passed to `openviking-server`, that the path lives under the system temp directory but outside the project root, and that the temp config is deleted after use.
- Re-ran Step 1 verification plus `maw-cli` build, lint, and full tests; Step 1 checkboxes remain checked in `tasks.md`.

## Files

- `maw-cli/src/utils/openviking.ts`
- `maw-cli/tests/ov-server.test.ts`
- `maw-cli/dist/utils/openviking.d.ts`
- `maw-cli/dist/utils/openviking.js`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/1-restore-maw-cli-openviking-runtime-wrappers.md`

## Verification

- `bun run test -- tests/ov-server.test.ts` in `maw-cli/` — FAIL before the code change (`ov:server` still wrote the resolved config under the project root)
- `bun run test -- tests/ov-server.test.ts` in `maw-cli/` — PASS after the fix
- `bun run build` in `maw-cli/` — PASS
- `bun run lint` in `maw-cli/` — PASS
- `bun run test` in `maw-cli/` — PASS
- `bun run test -- tests/cli.test.ts tests/ov-server.test.ts tests/ov-index.test.ts` in `maw-cli/` — PASS

## Summary

- Step 1 remains complete and now matches the plan exactly: `maw-cli ov:server` resolves `.maw/ov.conf` placeholders into a system-temp config outside checked-in project files, passes that resolved file to `openviking-server`, and removes it after use.

## Remaining

- None for Step 1.

## Issues

- None.
