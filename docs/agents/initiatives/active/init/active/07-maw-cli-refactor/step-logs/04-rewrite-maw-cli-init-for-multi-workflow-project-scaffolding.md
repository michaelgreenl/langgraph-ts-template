# Step 4 Log

## Summary

- Rewrote `runInit()` so project-owned scaffold creation is independent from workflow discovery, which allows zero-workflow bootstrap to succeed with a warning instead of failing.
- `maw-cli init` now creates workflow-local scaffold directories at `.maw/graphs/<workflow>/` for every discovered workflow, keyed by `scaffold.workflow`.
- Workflow-owned `graph.ts` and `config.json` are now written into each workflow directory, and `maw-cli` generates the matching workflow-local `langgraph.json` itself.
- `init` no longer writes legacy root workflow files: `.maw/config.json`, `.maw/graph.ts`, or `langgraph.json`.
- Expanded `init` coverage for zero, one, and multiple workflows, rerun preservation, `.gitignore` idempotency, legacy file absence, and distinct success vs warning output.
- Also cleaned up shared test IO capture by adding `captureStdout()` to `../maw-cli/tests/support.ts` (G5).

## Files

- `../maw-cli/src/commands/init.ts`
- `../maw-cli/tests/init.test.ts`
- `../maw-cli/tests/support.ts`
- `../maw-cli/dist/commands/init.js`
- `docs/agents/initiatives/active/init/active/07-maw-cli-refactor/tasks.md`

## Verification

- `bun run test tests/init.test.ts` in `../maw-cli`
- `bun run build` in `../maw-cli`
- `bun run lint` in `../maw-cli`
- `bun run test` in `../maw-cli`

## Remaining

- Step 5 still needs the workflow-local `langgraph.json` generation pulled into the shared langgraph helper layer and covered through the dedicated follow-up tasks there.
- Step 6 still needs `dev <workflow>` and `start` removal.
- Step 8 smoke coverage still needs the standalone `maw-cli init` and `maw-cli dev <workflow>` flow.
