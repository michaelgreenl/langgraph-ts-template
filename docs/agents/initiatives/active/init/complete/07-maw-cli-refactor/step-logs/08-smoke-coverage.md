# Step 8 Log

## Summary

- Replaced the old root-scaffold smoke coverage with standalone `maw-cli` smoke flows that install `maw-cli` into temp projects and exercise local phase-only workflow fixtures.
- Added local `mock-coding` and `mock-code-agent` scaffold fixtures, plus shared smoke helpers, to prove `maw-cli init` and `maw-cli dev coding` follow the new Phase 1 contract.
- Removed obsolete smoke scripts and stale root scaffold artifacts that depended on the retired `.maw/config.json` / root `langgraph.json` contract.

## Files

- `../maw-smoke/maw-smoke-1/package.json`
- `../maw-smoke/maw-smoke-1/.gitignore`
- `../maw-smoke/maw-smoke-1/bun.lock`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/package.json`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/scaffold.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/package.json`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/scaffold.js`
- `../maw-smoke/maw-smoke-1/smoke/support.ts`
- `../maw-smoke/maw-smoke-1/smoke/init.ts`
- `../maw-smoke/maw-smoke-1/smoke/dev.ts`
- `../maw-smoke/maw-smoke-1/smoke/config.ts` (deleted)
- `../maw-smoke/maw-smoke-1/smoke/langgraph-config.ts` (deleted)
- `../maw-smoke/maw-smoke-1/smoke/system-prompt.ts` (deleted)
- `../maw-smoke/maw-smoke-1/.maw/config.json` (deleted)
- `../maw-smoke/maw-smoke-1/.maw/graph.ts` (deleted)
- `../maw-smoke/maw-smoke-1/.maw/ov.conf` (deleted)
- `../maw-smoke/maw-smoke-1/.maw/templates/general-coding.njk` (deleted)
- `../maw-smoke/maw-smoke-1/langgraph.json` (deleted)
- `docs/agents/initiatives/active/init/active/07-maw-cli-refactor/tasks.md`
- `docs/agents/initiatives/active/init/active/07-maw-cli-refactor/step-logs/08-smoke-coverage.md`

## Verification

- `bun install` in `../maw-smoke/maw-smoke-1` — passed (`Saved lockfile`)
- `bun run smoke:init` in `../maw-smoke/maw-smoke-1` — passed (`smoke:init passed.`)
- `bun run smoke:dev` in `../maw-smoke/maw-smoke-1` — passed (`smoke:dev passed.`)
- `bun run build` / `bun run lint` / `bun run test` in `../maw-smoke/maw-smoke-1` — not applicable; those scripts are not defined in `package.json`

## Remaining

- None.
