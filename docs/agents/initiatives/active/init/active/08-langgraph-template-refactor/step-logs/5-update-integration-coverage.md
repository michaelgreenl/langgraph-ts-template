# Step 5 Log

## Summary

- Updated `tests/integration/scaffold.test.ts` to assert the final scaffolded `config.json` prompt payload (`prompts.global` plus `prompts.agents`).
- Rewrote `tests/integration/graph.test.ts` for the final runtime contract, including partial workflow overrides, disk-loaded workflow config, missing config fallback, invalid config fallback, missing snippet fallback, and invalid `maw.json` rejection.
- Fixed workflow agent merge order in `src/config.ts` so disk-loaded workflow overrides can drive default agent selection when `createGraph({ workflow })` omits `agent`.

## Files

- docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/tasks.md
- docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/step-logs/5-update-integration-coverage.md
- dist/config.js
- src/config.ts
- tests/integration/graph.test.ts
- tests/integration/scaffold.test.ts

## Verification

- `bun run test:int -- tests/integration/scaffold.test.ts tests/integration/graph.test.ts` — failed initially (`tests/integration/graph.test.ts`: disk-loaded workflow config still selected the default `planner` agent)
- `bun run test:int -- tests/integration/scaffold.test.ts tests/integration/graph.test.ts` — passed
- `bun run typecheck && bun run build && bun run lint && bun run test && bun run test:int` — passed

## Remaining

- None.
