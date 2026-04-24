# Step 2 Log

## Step name

Replace the greeting stub with a clean planner -> coder runtime

## Status

done

## Pre-flight

- Read the full `tasks.md` and validated Step 2 scope/out-of-scope plus execution notes.
- No blockers found.
- Non-blocking note: once the greeting stub was replaced, prior unit tests that invoked the graph needed deterministic model-path stubbing.

## Summary

- `src/agent/graph.ts`: replaced the greeting stub graph with a manual `StateGraph` runtime using topology `__start__ -> planner -> coder -> __end__`.
- Planner node now renders the resolved `planner` prompt, stores it in `plannerPrompt`, calls the shared package-owned model path exactly once, and derives a guaranteed non-empty `handoff`.
- Coder node now renders the resolved `coder` prompt with shared vars plus planner `handoff`, stores it in `coderPrompt`, calls the shared package-owned model path exactly once, and returns the final assistant response.
- Preserved runtime prompt resolution/fallback behavior: embedded defaults -> workflow config -> `.maw/templates/*.njk` overrides, including existing missing/invalid-config fallback semantics.
- `src/templates/engine.ts`: aligned runtime var injection so `workspacePath` stays bound to runtime workspace (`'.'`) while still merging caller-provided vars.
- `tests/integration/graph.test.ts`: added deterministic stubbing for the shared model path and coverage for planner/coder ordering, non-empty handoff, live prompt capture, workspacePath injection, snippet overrides, and missing/invalid-config fallback behavior.
- `tests/unit/templates.spec.ts`: added coverage for coder `handoff` rendering and runtime `workspacePath` binding behavior.
- `tests/unit/graph.spec.ts` and `tests/unit/public-api.spec.ts`: updated to keep unit verification deterministic now that graph execution performs live planner/coder model calls.

## Files changed

- src/agent/graph.ts
- src/templates/engine.ts
- tests/integration/graph.test.ts
- tests/unit/templates.spec.ts
- tests/unit/graph.spec.ts
- tests/unit/public-api.spec.ts

## Verification

- `bun run test -- tests/unit/templates.spec.ts` — pass (6/6 tests)
- `bun run test:int -- tests/integration/graph.test.ts` — pass (6/6 tests)
- `bun run build` — pass
- `bun run lint` — pass
- `bun run test` — pass (34/34 unit tests)

## Remaining

- none

## Issues / follow-ups

- `route()` remains exported for backward-compatibility/unit coverage, but Step 2 runtime execution now uses the fixed planner -> coder graph path.
