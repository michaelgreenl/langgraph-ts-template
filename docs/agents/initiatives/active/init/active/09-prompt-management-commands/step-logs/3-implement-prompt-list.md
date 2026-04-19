# Step 3 Log

## Pre-flight

- Read the full `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`.
- Reviewed the Step 3 code paths in `../maw-cli/src/index.ts`, `../maw-cli/src/utils/workflows.ts`, `../maw-cli/src/commands/dev.ts`, `../maw-cli/tests/cli.test.ts`, `../maw-cli/tests/support.ts`, and the workflow fixtures under `../maw-cli/tests/fixtures/workflows/*`.
- No blockers found.
- Noted one non-blocking ambiguity: the plan requires missing workflow-directory failures to tell the user to rerun `maw-cli init`, but it does not pin an exact full error string. Covered that behavior with substring assertions instead of inventing a brittle exact message.

## Implementation

- Followed TDD:
  - Added `../maw-cli/tests/prompt-list.test.ts` and updated `../maw-cli/tests/cli.test.ts` first to require the new command surface, usage behavior, workflow resolution, workflow-directory validation, missing/invalid config fallback rules, stderr warning behavior, and exact planner/coder snippet output order.
  - Ran `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `../maw-cli` and verified the suite failed first because `../maw-cli/src/commands/prompt-list.ts` did not exist yet and `COMMAND_NAMES` did not include `prompt:list`.
  - Added `../maw-cli/src/commands/prompt-list.ts` with installed-package `${packageName}/config` loading, workflow-directory validation, missing/invalid `config.json` fallback behavior, and exact stdout formatting.
  - Registered `prompt:list` in `../maw-cli/src/index.ts` so help output, command parsing, and `COMMAND_NAMES` all include it.
- Also kept an explicit runtime contract check for the imported workflow config module, so bad fixture/package exports fail clearly instead of crashing later and TypeScript keeps the prompt-config shape narrowed at the module boundary (G3, G16).
- Updated Step 3 checkboxes in `tasks.md`.

- Files changed:
  - `../maw-cli/dist/commands/prompt-list.d.ts`
  - `../maw-cli/dist/commands/prompt-list.js`
  - `../maw-cli/dist/index.d.ts`
  - `../maw-cli/dist/index.js`
  - `../maw-cli/src/commands/prompt-list.ts`
  - `../maw-cli/src/index.ts`
  - `../maw-cli/tests/cli.test.ts`
  - `../maw-cli/tests/prompt-list.test.ts`
  - `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`
  - `docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/3-implement-prompt-list.md`

## Verification

- `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `../maw-cli` — failed first as expected before implementation (`../src/commands/prompt-list.js` missing and `COMMAND_NAMES` lacked `prompt:list`).
- `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `../maw-cli` — passed after implementation.
- `bun run build` in `../maw-cli` — failed once during a Boy Scout cleanup attempt when inlining the config-module guard erased the narrowed prompt-config type, then passed after restoring the explicit guard.
- `bun run lint` in `../maw-cli` — failed once for the same cleanup attempt (`ResolvedPromptConfig` became unused), then passed after restoring the explicit guard.
- `bun run test` in `../maw-cli` — passed.
- `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `../maw-cli` — passed.

## Summary

- Implemented `maw-cli prompt:list <workflow>` with installed-workflow resolution by `scaffold.workflow`, workflow-directory validation, and missing/invalid workflow-config fallback to embedded defaults.
- Registered `prompt:list` in the CLI help/parser surface and added targeted coverage for usage, error handling, warnings, and exact resolved snippet-order output.
- Verified the new command with both targeted Step 3 tests and the full `maw-cli` build/lint/test suite.

## Remaining

- No remaining Step 3 tasks.
- Step 4 (`prompt:preview`) and Step 5 smoke coverage remain out of scope for this change.
