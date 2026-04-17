# Step 1 Log

## Summary

- Switched `maw-cli` project config loading from `.maw/config.json` to root `maw.json`.
- Replaced `MawConfig` with `MawProjectConfig` and narrowed the parsed shape to `workspace`, `openviking`, and `templates.customPath`.
- Removed env interpolation from config loading; `${VAR}` strings now stay literal.
- Made config validation structural so malformed `maw.json` fails fast before runtime commands launch.
- Updated config-facing and runtime command tests to use `maw.json`.
- Regenerated `../maw-cli/dist/` via `bun run build`.

## Files

- `../maw-cli/src/utils/config.ts`
- `../maw-cli/src/index.ts`
- `../maw-cli/tests/config.test.ts`
- `../maw-cli/tests/dev.test.ts`
- `../maw-cli/tests/start.test.ts`
- `../maw-cli/tests/support.ts`
- `../maw-cli/dist/index.d.ts`
- `../maw-cli/dist/utils/config.d.ts`
- `../maw-cli/dist/utils/config.js`

## Verification

- `bun run build` in `../maw-cli`
- `bun run lint` in `../maw-cli`
- `bun run test` in `../maw-cli`
- Acceptance check: `bun run test tests/bin.test.ts` in `../maw-cli`

## Remaining

- The broader `.maw/config.json` scaffold removal is still open. `init`-side workflow scaffold generation and its legacy fixture coverage remain for later steps in this phase.
