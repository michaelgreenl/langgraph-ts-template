# Step 3 Log

## Step

- 3. Replace template-side OpenViking stubs with Phase 5-ready toggle/url plumbing

## Pre-flight

- No blocking contract conflicts were found in `tasks.md`, `src/openviking/{config,client,scanner}.ts`, `src/index.ts`, or `tests/integration/graph.test.ts`.
- `tests/unit/openviking.spec.ts` did not exist yet; creating it was within step scope.
- Proceeded with the non-blocking assumption that the “exported OpenViking surface” for Phase 4 should be root-level exports from `src/index.ts` only, without adding live retrieval behavior.

## Changes

- Replaced the OpenViking host/port stub with concrete loaders for the `maw.json` retrieval toggle and `.maw/ovcli.conf` client URL, plus project-scope path resolution for `.maw/openviking/`.
- Replaced the stub OpenViking client/scanner surface with URL-based client config types, shared project-scope types, and exported scanner defaults aligned to project-local OpenViking state.
- Exported the new OpenViking config/client/scanner surface from `src/index.ts` for Phase 5 consumers.
- Added unit coverage for exported OpenViking defaults, missing `maw.json` fallback, valid runtime loading, invalid `maw.json`, and missing/invalid `.maw/ovcli.conf` handling.
- Added integration coverage proving `createGraph()` still works when retrieval is deferred, even if `.maw/ovcli.conf` is missing or invalid.
- Checked off the completed Step 3 items and Step 3 verification entries in `tasks.md`.
- Also cleaned up: removed a dead OpenViking config catch branch and dropped test-only `as Error` casts (G9, G16, TY3).

## Files

- `src/openviking/config.ts`
- `src/openviking/client.ts`
- `src/openviking/scanner.ts`
- `src/index.ts`
- `tests/unit/openviking.spec.ts`
- `tests/integration/graph.test.ts`
- `dist/openviking/config.js`
- `dist/openviking/config.d.ts`
- `dist/openviking/client.d.ts`
- `dist/openviking/scanner.js`
- `dist/openviking/scanner.d.ts`
- `dist/index.js`
- `dist/index.d.ts`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`

## Verification

- `bun run build` in `langgraph-ts-template/` — PASS
- `bun run lint` in `langgraph-ts-template/` — PASS
- `bun run test` in `langgraph-ts-template/` — PASS (`29 passed`)
- `bun run typecheck` in `langgraph-ts-template/` — PASS
- `bun run test -- tests/unit/openviking.spec.ts` in `langgraph-ts-template/` — PASS (`6 passed`)
- `bun run test:int -- tests/integration/graph.test.ts` in `langgraph-ts-template/` — PASS (`9 passed`)

## Summary

- Completed Step 3 within scope.
- `langgraph-ts-template` now exports concrete OpenViking toggle/url plumbing for Phase 5 while keeping graph-time retrieval deferred in Phase 4.

## Remaining

- No Step 3 tasks remain.
- Phase 4 Steps 4-5 remain out of scope for this log.

## Issues

- None.
