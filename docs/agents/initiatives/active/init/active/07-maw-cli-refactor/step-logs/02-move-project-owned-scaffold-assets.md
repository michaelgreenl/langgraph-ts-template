# Step 2 Log

## Summary

- Moved project-owned scaffold generation into `maw-cli init`.
- Added maw-cli-owned defaults for root `maw.json` and project-wide `.maw/ov.conf`.
- `maw-cli init` now creates `.maw/templates/` and `.maw/graphs/` directly instead of relying on workflow scaffold metadata.
- `.gitignore` merging is now limited to `.maw/openviking/`.
- Updated `init` fixture coverage so workflow packages only need to provide workflow-owned files for this step.
- Regenerated `../maw-cli/dist/commands/init.js` via `bun run build`.

## Files

- `../maw-cli/src/commands/init.ts`
- `../maw-cli/tests/init.test.ts`
- `../maw-cli/dist/commands/init.js`
- `docs/agents/initiatives/active/init/active/07-maw-cli-refactor/tasks.md`

## Verification

- `bun run test tests/init.test.ts` in `../maw-cli`
- `bun run build` in `../maw-cli`
- `bun run lint` in `../maw-cli`
- `bun run test` in `../maw-cli`
- Confirmed there are no remaining `maw-cli` source-path assumptions for `.maw/config.json` under `../maw-cli/src/`

## Remaining

- `init` still expects a single workflow package and still writes legacy root workflow files; multi-workflow discovery and `.maw/graphs/<workflow>/` generation remain for steps 3-5.
- Zero-workflow bootstrap-and-warn behavior is still open.
