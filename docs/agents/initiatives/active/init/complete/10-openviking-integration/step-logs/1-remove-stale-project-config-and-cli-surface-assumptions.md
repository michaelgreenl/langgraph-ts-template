# Step 1 Log

## Step

- Remove stale project-config and CLI-surface assumptions

## Pre-flight

- Read the full `tasks.md` and scanned the scoped maw-cli and langgraph files before editing.
- No blocking contract conflicts or missing dependencies found.
- Noted one expected step-boundary concern: Step 1 moves readers to the new `maw.json` shape before Step 2 updates `maw-cli init`, so freshly scaffolded Phase 3-style configs remain temporarily incompatible until the next step lands.
- Resolved the runtime ambiguity by keeping `workspacePath` support for custom snippets, but deriving it as `'.'` from the MAW scope root instead of reading `workspace` from `maw.json`.

## Changes

- Updated maw-cli config parsing to the Phase 4 project config shape: `openviking: boolean` plus `templates.customPath`.
- Kept missing-file behavior unchanged for callers: `readConfig()`/`ensureConfig()` still fail on missing `maw.json`, while `readConfigOrDefault()` still returns init-style defaults.
- Removed `ov:init` and `ov:index` from the CLI command registry/help surface and deleted the retired source and built command files.
- Updated `prompt:preview` to stop reading `workspace` from `maw.json` and always pass `workspacePath='.'` to custom snippets.
- Updated `src/agent/graph.ts` to stop reading `workspace`/OpenViking host-port settings from `maw.json`, while preserving custom-template `workspacePath='.'` behavior.
- Updated scoped maw-cli and langgraph tests first, confirmed they failed under the old behavior, then implemented the minimal changes to make them pass.
- Also cleaned up `maw-cli/src/utils/config.ts` by removing now-dead legacy parsing/cloning helpers (F4, F5).

## Files

- `../maw-cli/dist/commands/ov-index.d.ts` (deleted)
- `../maw-cli/dist/commands/ov-index.js` (deleted)
- `../maw-cli/dist/commands/ov-init.d.ts` (deleted)
- `../maw-cli/dist/commands/ov-init.js` (deleted)
- `../maw-cli/dist/commands/prompt-preview.js`
- `../maw-cli/dist/index.d.ts`
- `../maw-cli/dist/index.js`
- `../maw-cli/dist/utils/config.d.ts`
- `../maw-cli/dist/utils/config.js`
- `../maw-cli/src/commands/ov-index.ts` (deleted)
- `../maw-cli/src/commands/ov-init.ts` (deleted)
- `../maw-cli/src/commands/prompt-preview.ts`
- `../maw-cli/src/index.ts`
- `../maw-cli/src/utils/config.ts`
- `../maw-cli/tests/cli.test.ts`
- `../maw-cli/tests/config.test.ts`
- `../maw-cli/tests/dev.test.ts`
- `../maw-cli/tests/prompt-preview.test.ts`
- `dist/agent/graph.js`
- `src/agent/graph.ts`
- `tests/integration/graph.test.ts`

## Verification

- `maw-cli`: `bun run test -- tests/config.test.ts tests/dev.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` — PASS
- `langgraph-ts-template`: `bun run test:int -- tests/integration/graph.test.ts` — PASS
- `maw-cli`: `bun run build` — PASS
- `maw-cli`: `bun run lint` — PASS
- `maw-cli`: `bun run test` — PASS
- `langgraph-ts-template`: `bun run build` — PASS
- `langgraph-ts-template`: `bun run lint` — PASS
- `langgraph-ts-template`: `bun run test` — PASS
- `langgraph-ts-template`: `bun run test:int` — PASS
- `maw-cli`: `bun run build` (post-dist cleanup) — PASS
- `maw-cli`: `bun run lint` (post-dist cleanup) — PASS
- `maw-cli`: `bun run test -- tests/config.test.ts tests/dev.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` (post-dist cleanup) — PASS
- `maw-cli`: `bun run test` (post-dist cleanup) — PASS

## Summary

- Completed the Step 1 parser/runtime cleanup for the new Phase 4 `maw.json` contract.
- Removed the retired `ov:*` CLI surface from both source and shipped build artifacts.
- Preserved custom-template `workspacePath` compatibility by deriving `'.'` from the MAW scope root instead of project config.

## Remaining

- `maw-cli init` still seeds the pre-Phase-4 `maw.json` shape; Step 2 is responsible for updating bootstrap output, `.maw/ovcli.conf`, and target-project script seeding.

## Issues

- No unresolved blockers in this step.
- Expected temporary cross-step inconsistency remains until Step 2 updates scaffold generation.
