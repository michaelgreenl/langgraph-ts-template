# Step 3 Log

## Step name

3. Align active docs and plans to the real Phase 5 contract

## Status

done

## Pre-flight

- Read the full `tasks.md` for Phase 5 and confirmed Step 3 scope plus out-of-scope constraints.
- Scanned `docs/agents/initiatives/active/init/init-plan.md` and `README.md` for stale Phase 5 contract wording.
- Confirmed `docs/usage/mvp/*.md` already includes the target-state planning note and should remain unchanged in this step.
- Blockers: none.

## Summary

- Updated `docs/agents/initiatives/active/init/init-plan.md` Phase 5 bullets to reflect the real landed contract: explicit `planner` -> `coder` runtime, captured `plannerPrompt`/`coderPrompt`/`handoff`, shared package-owned OpenAI `gpt-4.1-mini`, manual `StateGraph`, and runtime-context smoke scope (`workspacePath` + coder `handoff`).
- Replaced stale README placeholder-chatbot language with current Phase 5 runtime wording, including manual planner/coder flow, shared OpenAI model path, and inspection fields (`plannerPrompt`, `coderPrompt`, `handoff`).
- Added explicit README scope note that file/shell/git tool execution is deferred to Phase 6.
- Kept wording aligned with `docs/usage/mvp/*.md` target-state note by leaving those guides untouched in this step.

## Files changed

- `docs/agents/initiatives/active/init/init-plan.md`
- `README.md`
- `docs/agents/initiatives/active/init/active/11-base-workflow-foundation/step-logs/3-align-active-docs-and-plans-to-the-real-phase-5-contract.md`

## Verification

- Manual check: `docs/agents/initiatives/active/init/init-plan.md` Phase 5 bullets match Step 3 contract and do not treat planner/coder scaffold defaults as unfinished work.
  - Result: **pass**
  - Evidence: Phase 5 section now states captured prompt/handoff fields, shared package-owned `gpt-4.1-mini`, manual `StateGraph`, and explicitly says not to treat planner/coder scaffold defaults as unfinished Phase 5 work.

- Manual check: `README.md` no longer describes the runtime as a placeholder greeting chatbot/simple placeholder response.
  - Result: **pass**
  - Evidence: README intro + “What it does” now describe Phase 5 planner/coder runtime and Phase 6 tool deferral; search for `placeholder|greeting chatbot|simple placeholder response|simple chatbot|hardcoded greeting|chatbot` returned no matches.

- `bun run build`
  - Result: **pass**
  - Evidence: `tsc` completed without errors.

- `bun run lint`
  - Result: **pass**
  - Evidence: `eslint src` completed without errors.

- `bun run test`
  - Result: **pass**
  - Evidence: Vitest unit run passed (`8` files, `34` tests).

## Remaining

none

## Issues / follow-ups

- none
