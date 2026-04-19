# Step 2 Log

## Summary

- Deleted the embedded `project-context` snippet and renamed the embedded `general-coding` snippet to `general`.
- Updated the legacy scaffold config asset and direct template/graph tests to use `general` and stop depending on embedded workspace-path prompt content.
- Added regression coverage proving a custom `.maw/templates/*.njk` snippet can still render `{{ workspacePath }}` when `workspace` is provided.

## Files

- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/tasks.md`
- `src/scaffold/assets/config.json`
- `src/templates/defaults/general-coding.njk` (deleted)
- `src/templates/defaults/general.njk` (created)
- `src/templates/defaults/project-context.njk` (deleted)
- `tests/integration/graph.test.ts`
- `tests/unit/templates.spec.ts`
- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/step-logs/2-normalize-embedded-snippet-names.md`

## Verification

- `bun run build` — passed
- `bun run lint` — passed
- `bun run test` — passed
- `bun run test -- tests/unit/templates.spec.ts` — passed
- `bun run test:int -- tests/integration/graph.test.ts` — passed

## Remaining

- None.
