# Step 1 Log

## Summary

- Removed the `maw-cli` dependency and retired CLI metadata from `package.json`, then refreshed `bun.lock`.
- Deleted the old proxy entrypoints (`src/bin.ts`, `scripts/checkLanggraphPaths.js`) and the stale published `dist/bin.*` artifacts they had left behind.
- Updated `tests/unit/package-metadata.spec.ts` with TDD so Step 1 now locks the retired proxy surface out of the package.

## Files

- `bun.lock`
- `dist/bin.d.ts`
- `dist/bin.js`
- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/step-logs/1-remove-maw-cli-entanglement.md`
- `docs/agents/initiatives/active/init/active/08-langgraph-template-refactor/tasks.md`
- `package.json`
- `scripts/checkLanggraphPaths.js`
- `src/bin.ts`
- `tests/unit/package-metadata.spec.ts`

## Verification

- `bun run test -- tests/unit/package-metadata.spec.ts` — failed as expected before implementation because `package.json` still depended on `maw-cli`
- `bun run test -- tests/unit/package-metadata.spec.ts` — failed as expected after expanding coverage because `dist/bin.js` still existed
- `bun run test -- tests/unit/package-metadata.spec.ts` — passed
- `bun run build` — passed
- `bun run lint` — passed
- `bun run test` — passed

## Remaining

- No incomplete Step 1 tasks.
- Follow-up for Step 3: `tests/integration/scaffold.test.ts` still references `scripts/checkLanggraphPaths.js`; that cleanup is already planned in the Phase 2 task list.
