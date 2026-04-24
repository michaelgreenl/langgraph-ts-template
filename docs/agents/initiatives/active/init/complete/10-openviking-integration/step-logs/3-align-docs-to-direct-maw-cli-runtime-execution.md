# Step 3 Log

## Step

- Align docs to direct `maw-cli` runtime execution

## Pre-flight

- No blockers found.
- Concern noted before editing: `docs/usage/mvp/langgraph-ts-template.md` was already aligned to the direct-`maw-cli` ownership model and does not describe the `ov:server` env-loading contract, so changing it would have broadened this retry beyond the approved runtime-contract wording.

## Changes

- Updated `docs/usage/mvp/maw-cli.md` so the user-facing `ov:server` docs now state the approved resolution order: current process environment first, then the MAW-scope local `.env` as fallback.
- Documented in `docs/usage/mvp/maw-cli.md` that `maw-cli` loads that `.env` file explicitly rather than relying on Bun auto-loading, and that the resolved values are written only to the ephemeral temp config outside the project tree before launching upstream OpenViking.
- Updated `docs/agents/initiatives/active/init/init-plan.md` so the master Phase 4 contract matches the approved `ov:server` runtime behavior, including precedence, explicit `.env` loading, temp-config-only use, and continued direct `maw-cli` ownership.
- Updated `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md` where the Phase 4 contract still said process-environment-only, while keeping the Step 3 checklist checked because the retry left Step 3 fully compliant.
- Updated this existing Step 3 log for the retry.

## Files

- `docs/usage/mvp/maw-cli.md`
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

- Step 3 remains complete.
- The Phase 4 docs now consistently describe direct `maw-cli ov:server` / `maw-cli ov:index` runtime ownership, process-env-first plus MAW-scope local `.env` fallback placeholder resolution in `maw-cli`, explicit non-Bun `.env` loading, temp-config-only value use, and the retrieval-only meaning of `openviking: false`.

## Remaining

- None for Step 3.

## Issues

- None.
