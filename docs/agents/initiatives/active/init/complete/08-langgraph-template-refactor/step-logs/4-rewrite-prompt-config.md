# Step 4 Log

## Summary

- Replaced the scaffolded workflow config with the prompt-only `prompts.global` / `prompts.agents` shape and derived `DEFAULT_WORKFLOW_CONFIG` from the embedded scaffold asset instead of duplicating defaults in code.
- Rewrote the template composition, template engine, and graph runtime to use resolved workflow prompts plus `maw.json` project settings, including the Step 4 fallback rules for invalid workflow config and missing snippets.
- Rewrote the Step 4 unit coverage, checked off the completed Step 4 tasks in `tasks.md`, and applied a small Boy Scout cleanup by consolidating repeated error-message extraction in `src/agent/graph.ts`.

## Files

- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/tasks.md`
- `dist/agent/graph.d.ts`
- `dist/agent/graph.js`
- `dist/config.d.ts`
- `dist/config.js`
- `dist/templates/composition.d.ts`
- `dist/templates/composition.js`
- `dist/templates/engine.d.ts`
- `dist/templates/engine.js`
- `src/agent/graph.ts`
- `src/config.ts`
- `src/index.ts`
- `src/scaffold/assets/config.json`
- `src/templates/composition.ts`
- `src/templates/engine.ts`
- `tests/unit/config.spec.ts`
- `tests/unit/scaffold.spec.ts`
- `tests/unit/templates.spec.ts`
- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/step-logs/4-rewrite-prompt-config.md`

## Verification

- `bun run test -- tests/unit/config.spec.ts tests/unit/templates.spec.ts tests/unit/scaffold.spec.ts tests/unit/public-api.spec.ts` — failed first (expected red), then passed
- `bun run typecheck` — passed
- `bun run build` — passed
- `bun run lint` — failed first on forbidden `instanceof` checks in `src/agent/graph.ts`, then passed after replacing them with a shared message helper
- `bun run test` — passed
- `bun run test -- tests/unit/config.spec.ts tests/unit/templates.spec.ts tests/unit/scaffold.spec.ts tests/unit/public-api.spec.ts` — passed

## Remaining

- None.
