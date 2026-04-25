# Step 2 Log

## Step

- Step 2: Keep the retained LangGraph compatibility runtime runnable after the reset
- Repo: `langgraph-ts-template`
- Tasks file: `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md`

## Pre-flight

- No blockers found.
- Confirmed `src/agent/graph.ts` still depended on retired `.maw/graphs/<workflow>/config.json`, `maw.json`, and Nunjucks template composition.
- Confirmed Step 2 only needed the retained compatibility path to stay runnable; planner/manager parity was out of scope.

## Changes

- Reworked `src/agent/graph.ts` to load the retained compatibility runtime from inline or workflow-local `opencode.json` data, fall back to packaged defaults, and stop reading the retired prompt-template surface.
- Kept the exported `createGraph` compatibility contract aligned with the new scaffold contract by replacing the old inline workflow-config override with inline `opencode` input.
- Replaced the graph tests so they now cover inline `opencode`, packaged default fallback, workflow-local `.maw/graphs/<workflow>/opencode.json`, and invalid `opencode.json` failure behavior.
- Updated Step 2 checkboxes in `tasks.md` after verification passed.
- Files touched:
  - `src/agent/graph.ts`
  - `tests/unit/graph.spec.ts`
  - `tests/unit/agent.spec.ts`
  - `tests/integration/graph.test.ts`
  - `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md`
  - `dist/agent/graph.d.ts`
  - `dist/agent/graph.js`
  - `dist/scaffold/assets.js`
  - `dist/scaffold/index.js`

## Verification

- `bun run test -- tests/unit/graph.spec.ts tests/unit/agent.spec.ts` — failed first as expected before implementation, then passed after the runtime changes
- `bun run test:int -- tests/integration/graph.test.ts` — failed first as expected before implementation, then passed after the runtime changes
- `bun run build` — passed
- `bun run lint` — passed
- `bun run test` — passed
- `bun run test:int -- tests/integration/graph.test.ts` — passed

## Summary

- The retained LangGraph compatibility runtime now runs from the Phase 6 `opencode.json` contract instead of the retired `config.json` + Nunjucks prompt surface.
- `createGraph({ workflow })` still works for the generated compatibility scaffold, and `createGraph({ opencode })` now provides a new workflow-aligned inline override for tests and callers.
- Step 2 tasks and verification boxes are complete.

## Remaining / unresolved items

- None for Step 2.
- Follow-up note: `src/config.ts` and `src/templates/**` are no longer used by the retained compatibility runtime, but deleting that retired surface was not required to complete this step.
