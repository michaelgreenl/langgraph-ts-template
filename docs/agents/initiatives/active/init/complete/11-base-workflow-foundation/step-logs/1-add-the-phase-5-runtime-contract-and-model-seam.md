# Step 1: Add the Phase 5 runtime contract and model seam

## Status

done

## Pre-flight

- Read the full `tasks.md` and confirmed this retry is constrained to revised Step 1 only.
- Confirmed HITL plan change: workflow-local/shared override seam (`GraphConfig.model` / `GraphModel`) is superseded for MVP and must be removed.
- Verified Step 1 guardrails remain: no tools loop, no retrieval, no workflow-local model config, deterministic tests only.
- Blockers: none.

## Summary

- `langgraph-ts-template/package.json`: the shared OpenAI runtime dependency (`@langchain/openai`) required for the Phase 5 model path is already present in the working tree and was kept as-is.
- `langgraph-ts-template/src/agent/state.ts` and `src/index.ts`: the runtime/state contract exposing `plannerPrompt`, `coderPrompt`, and `handoff` remains in place; `GraphState` and `GraphUpdate` remain exported for clean state inspection in tests.
- `langgraph-ts-template/tests/unit/{graph.spec.ts,public-api.spec.ts}`: deterministic unit coverage remains centered on graph-visible runtime contract fields without real model calls; `graph.spec.ts` was updated to remove the superseded model-override test case.
- Superseded local model override seam removal: removed `GraphModel` from the public API surface export in `src/index.ts`; no `GraphConfig.model` / `GraphModel` references remain in runtime code/tests/public API.

## Files changed

- `src/index.ts`
- `tests/unit/graph.spec.ts`
- `docs/agents/initiatives/active/init/active/11-base-workflow-foundation/step-logs/1-add-the-phase-5-runtime-contract-and-model-seam.md`

## Verification

- `bun run typecheck` — **pass** (`tsc --noEmit` completed with no diagnostics)
- `bun run test -- tests/unit/graph.spec.ts tests/unit/public-api.spec.ts` — **pass** (2 test files passed, 6 tests passed)

## Remaining

- none

## Issues / follow-ups

- Phase 5 runtime wiring to the shared package-owned OpenAI model path is still implemented in later steps; this retry only locks/removes Step 1 contract seams per revised plan.
