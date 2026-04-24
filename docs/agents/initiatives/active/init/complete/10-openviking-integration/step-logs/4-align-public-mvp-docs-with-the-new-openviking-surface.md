# Step 4 Log

## Step

- Align public MVP docs with the new OpenViking surface.

## Pre-flight

- Read the full Phase 4 `tasks.md` plus both target usage docs before editing.
- No blockers or unresolved ambiguities.
- Confirmed both docs were stale in the Step 4 target areas: retired OpenViking subcommands, old `maw.json` shape, and missing target-project `package.json` script guidance.

## Changes

- Updated `docs/usage/mvp/maw-cli.md` to document the Phase 4 target-project OpenViking script model, the simplified `maw.json` shape, `.maw/ovcli.conf`, and explicit `bun run maw:ov:index -- <target-path>` usage.
- Updated `docs/usage/mvp/langgraph-ts-template.md` to align workflow-package guidance with target-project `maw:ov:*` scripts, remove old `workspace` / host-port assumptions from the project config contract, and keep live retrieval language deferred beyond Phase 4.
- Checked off the completed Step 4 tasks and Step 4 verification items in `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`.
- Also cleaned up stale Phase 5-facing wording so the docs stay aligned to the current Phase 4 runtime model.

## Files

- `docs/usage/mvp/maw-cli.md`
- `docs/usage/mvp/langgraph-ts-template.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/4-align-public-mvp-docs-with-the-new-openviking-surface.md`

## Verification

- `bun run build` — PASS
  - Output: `$ tsc`
- `bun run lint` — PASS
  - Output: `$ eslint src`
- `bun run test` — PASS
  - Output: `7` test files passed, `29` tests passed.
- `rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md` — PASS
  - Output included matches in both docs for `maw:ov:server` and `maw:ov:index`.
- `! rg "ov:init|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md` — PASS
  - Output: no matches.

## Summary

- Both public MVP usage guides now reflect the Phase 4 OpenViking surface: target-project `maw:ov:*` scripts for runtime tasks and `maw-cli dev <workflow>` as the workflow runner.
- The `maw.json` guidance now matches the simplified boolean `openviking` contract and no longer documents `workspace` or host-port fields as live configuration.

## Remaining

- No Step 4 tasks remain incomplete.
- Phase 5 live OpenViking retrieval wiring remains intentionally out of scope for this step.

## Issues

- None.
