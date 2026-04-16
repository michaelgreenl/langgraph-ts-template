# Step 3 Log

## Summary

- Replaced `maw-cli`'s single-workflow loader with `loadWorkflows(root)` and exported it for direct discovery coverage.
- Updated the workflow scaffold contract to require `scaffold.workflow` and workflow-owned `createScaffoldFiles()` output shaped as `graph.ts` and `config.json`.
- Sorted discovered workflows by `workflow` and fail fast on duplicate workflow names.
- Added fixture workflow packages under `../maw-cli/tests/fixtures/workflows/` so Phase 1 can exercise the next scaffold contract before the real template package lands.
- Kept `runInit()` on the current legacy root workflow file layout by adapting the new workflow-owned files into `.maw/config.json` and `.maw/graph.ts`; Step 4 still owns moving `init` onto `.maw/graphs/<workflow>/`.
- Also cleaned up test setup by centralizing temporary project and fixture installation helpers in `../maw-cli/tests/support.ts` (G5).

## Files

- `../maw-cli/src/commands/init.ts`
- `../maw-cli/tests/init.test.ts`
- `../maw-cli/tests/support.ts`
- `../maw-cli/tests/fixtures/workflows/docs-agent/package.json`
- `../maw-cli/tests/fixtures/workflows/docs-agent/scaffold.js`
- `../maw-cli/tests/fixtures/workflows/code-agent/package.json`
- `../maw-cli/tests/fixtures/workflows/code-agent/scaffold.js`
- `../maw-cli/tests/fixtures/workflows/docs-agent-alt/package.json`
- `../maw-cli/tests/fixtures/workflows/docs-agent-alt/scaffold.js`
- `../maw-cli/dist/commands/init.js`
- `../maw-cli/dist/commands/init.d.ts`
- `docs/agents/initiatives/active/init/active/07-maw-cli-refactor/tasks.md`

## Verification

- `bun run test tests/init.test.ts` in `../maw-cli`
- `bun run build` in `../maw-cli`
- `bun run lint` in `../maw-cli`
- `bun run test` in `../maw-cli`

## Remaining

- Step 4 still needs `runInit()` to consume all discovered workflows, create `.maw/graphs/<workflow>/` from `scaffold.workflow`, and handle zero-workflow bootstrap-and-warn behavior.
- Step 5 still needs workflow-local `langgraph.json` generation.
- Step 6 still needs `dev <workflow>` and `start` removal.
