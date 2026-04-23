# Step 3 Log

## Step

- Align docs to direct `maw-cli` runtime execution

## Pre-flight

- No blockers found.
- Concern noted before editing: `docs/agents/initiatives/active/init/init-plan.md` was already mostly aligned, so this step focused on removing stale target-project `maw:ov:*` script guidance and reinforcing the corrected Phase 4 ownership rules without broad doc rewrites.

## Changes

- Updated `docs/usage/mvp/maw-cli.md` to replace target-project `maw:ov:*` script guidance with direct `maw-cli ov:server` / `maw-cli ov:index` usage.
- Documented that `maw-cli ov:server` resolves `.maw/ov.conf` `${VAR}` placeholders against the current process environment before launching upstream OpenViking.
- Updated `docs/usage/mvp/langgraph-ts-template.md` so the workflow-package guide matches direct `maw-cli` runtime ownership and the unchanged target-project `package.json` contract.
- Tightened `docs/agents/initiatives/active/init/init-plan.md` runtime rules to restate direct `maw-cli` ownership, `package.json` non-mutation for OpenViking runtime wiring, and retrieval-only `openviking` toggle behavior.
- Checked off Step 3 items and Step 3 verification items in `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md` after verification passed.

## Files

- `docs/usage/mvp/maw-cli.md`
- `docs/usage/mvp/langgraph-ts-template.md`
- `docs/agents/initiatives/active/init/init-plan.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/3-align-docs-to-direct-maw-cli-runtime-execution.md`

## Verification

- `bun run build` — PASS (`tsc`)
- `bun run lint` — PASS (`eslint src`)
- `bun run test` — PASS (`7` test files, `29` tests)
- `rg "maw-cli ov:server|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md` — PASS
- `! rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md` — PASS

## Summary

- Step 3 is complete.
- The Phase 4 docs now consistently describe direct `maw-cli ov:server` / `maw-cli ov:index` runtime ownership, `.maw/ov.conf` placeholder resolution in `maw-cli`, and the retrieval-only meaning of `openviking: false`.

## Remaining

- None for Step 3.

## Issues

- None.
