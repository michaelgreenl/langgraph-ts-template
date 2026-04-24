# Step 4 Log

## Step name

4. Prove installed-package runtime prompt injection in smoke

## Status

done

## Pre-flight

- Read full `tasks.md` and re-checked Step 4 scope + Execution Notes.
- Confirmed retry constraints before execution:
  - Reuse existing disposable project at `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`.
  - Do not rerun `bun smoke-init` or `bunx maw-cli init`.
  - Do not read/inspect/copy `.env` contents.
- Verified the required smoke config/snippet files were already present with exact Phase 5 bodies.
- Pre-flight blockers: none.

## Summary

- Reused the existing smoke project and reran live runtime verification.
- Ran `bunx maw-cli dev langgraph-ts-template` and the exact required `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` request.
- First retry run still showed legacy greeting-only payload; refreshed installed dependency dist with `bun run build` in `tests/smoke-phase5-base-workflow-foundation/node_modules/langgraph-ts-template`.
- Cleared a lingering listener on port `2024`, reran the live request, and captured payload containing `plannerPrompt`, `coderPrompt`, and `handoff`.
- All required prompt/handoff assertions passed.
- Updated the smoke log with final payload, assertion results, and runtime-env note (high-level only, no secrets).

## Files changed

- `../maw-smoke/docs/agents/smoke-logs/phase5-base-workflow-foundation.md`
- `docs/agents/initiatives/active/init/active/11-base-workflow-foundation/step-logs/4-prove-installed-package-runtime-prompt-injection-in-smoke.md`

## Verification

- Existing smoke project reused — **pass**
  - Evidence: executed in `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/` without rerunning init commands.

- `bunx maw-cli dev langgraph-ts-template` (smoke project) — **pass**
  - Evidence: server accepted `runs/wait` request and was cleaned up after run (no listener remained on `localhost:2024`).

- Exact required curl request to `/runs/wait` — **pass**
  - Evidence: final payload contained `plannerPrompt`, `coderPrompt`, and `handoff` fields.

- Required assertions — **pass**
  - `plannerPrompt` contained `Workspace path: .` and `Planner snippet active.`
  - `coderPrompt` contained `Workspace path: .`, `Coder snippet active.`, and a non-empty rendered `Planner handoff:` line.
  - `handoff` was non-empty.

- Supporting retry fix command:
  - `bun run build` in `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/node_modules/langgraph-ts-template` — **pass**

## Remaining

- None for Step 4.

## Issues / follow-ups

- Retry transient issue: stale installed dependency dist initially surfaced greeting-only payload; fixed by rebuilding installed dependency dist in the smoke project.
- Retry transient issue: lingering dev server listener on port `2024`; fixed by explicit cleanup before final rerun.
- Runtime env handling remained compliant: used existing runtime configuration source only, with no `.env` inspection and no secret output.
