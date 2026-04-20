# Step 2 Log

## Pre-flight

- Read the full `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`.
- Reviewed the Step 2 code paths in `../maw-cli/src/commands/init.ts`, `../maw-cli/tests/init.test.ts`, `../maw-cli/tests/support.ts`, and `../maw-cli/tests/fixtures/workflows/*`.
- No blockers found.
- Noted the scope nuance that the execution notes mention both `maw-cli` and `maw-smoke` fixtures, but Step 2’s task list and verification scope only cover `maw-cli`; kept smoke-fixture work deferred to Step 5.

## Implementation

- Followed TDD:
  - Updated `../maw-cli/tests/init.test.ts` first to require the new shared workflow loader, exact-match workflow resolution, finalized scaffold output, and finalized fixture export surface.
  - Ran `bun run test -- tests/init.test.ts` and verified the suite failed first because `../maw-cli/src/utils/workflows.ts` did not exist yet.
  - Added `../maw-cli/src/utils/workflows.ts`, moved workflow discovery there, added `loadWorkflow(root, workflow)`, and rewired `../maw-cli/src/commands/init.ts` to consume the shared loader without changing init behavior.
  - Realigned all `../maw-cli/tests/fixtures/workflows/*` packages to the finalized contract by adding `.` / `./config` / `./templates` exports, side-effect-free `config.js` and `templates/index.js`, embedded default snippets, `templateDir`, prompt-only scaffold `config.json`, and `createGraph({ workflow: '...' })` scaffold output.
- Also cleaned up `../maw-cli/src/commands/init.ts` by removing extracted workflow-discovery code so the command file now focuses on init orchestration (G30).
- Updated Step 2 checkboxes in `tasks.md`.

- Files changed:
  - `../maw-cli/dist/commands/init.d.ts`
  - `../maw-cli/dist/commands/init.js`
  - `../maw-cli/dist/index.js`
  - `../maw-cli/dist/utils/workflows.d.ts`
  - `../maw-cli/dist/utils/workflows.js`
  - `../maw-cli/src/commands/init.ts`
  - `../maw-cli/src/utils/workflows.ts`
  - `../maw-cli/tests/fixtures/workflows/code-agent/config.js`
  - `../maw-cli/tests/fixtures/workflows/code-agent/index.js`
  - `../maw-cli/tests/fixtures/workflows/code-agent/package.json`
  - `../maw-cli/tests/fixtures/workflows/code-agent/scaffold.js`
  - `../maw-cli/tests/fixtures/workflows/code-agent/templates/defaults/general.njk`
  - `../maw-cli/tests/fixtures/workflows/code-agent/templates/defaults/research-rules.njk`
  - `../maw-cli/tests/fixtures/workflows/code-agent/templates/defaults/security.njk`
  - `../maw-cli/tests/fixtures/workflows/code-agent/templates/defaults/typescript.njk`
  - `../maw-cli/tests/fixtures/workflows/code-agent/templates/index.js`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/config.js`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/index.js`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/package.json`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/scaffold.js`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/templates/defaults/general.njk`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/templates/defaults/research-rules.njk`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/templates/defaults/security.njk`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/templates/defaults/typescript.njk`
  - `../maw-cli/tests/fixtures/workflows/coding-alt/templates/index.js`
  - `../maw-cli/tests/fixtures/workflows/coding/config.js`
  - `../maw-cli/tests/fixtures/workflows/coding/index.js`
  - `../maw-cli/tests/fixtures/workflows/coding/package.json`
  - `../maw-cli/tests/fixtures/workflows/coding/scaffold.js`
  - `../maw-cli/tests/fixtures/workflows/coding/templates/defaults/general.njk`
  - `../maw-cli/tests/fixtures/workflows/coding/templates/defaults/research-rules.njk`
  - `../maw-cli/tests/fixtures/workflows/coding/templates/defaults/security.njk`
  - `../maw-cli/tests/fixtures/workflows/coding/templates/defaults/typescript.njk`
  - `../maw-cli/tests/fixtures/workflows/coding/templates/index.js`
  - `../maw-cli/tests/init.test.ts`
  - `docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/2-extract-workflow-resolution.md`
  - `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`

## Verification

- `bun run test -- tests/init.test.ts` in `../maw-cli` — failed first as expected before implementation (`Cannot find module '../src/utils/workflows.js'`).
- `bun run test -- tests/init.test.ts` in `../maw-cli` — passed after implementation.
- `bun run build` in `../maw-cli` — passed.
- `bun run lint` in `../maw-cli` — passed.
- `bun run test` in `../maw-cli` — passed.
- `bun run test -- tests/init.test.ts` in `../maw-cli` — passed.

## Summary

- Extracted shared workflow discovery into `../maw-cli/src/utils/workflows.ts` and added exact-match workflow resolution by `scaffold.workflow`.
- Kept `../maw-cli/src/commands/init.ts` behavior intact while switching it to the shared loader.
- Realigned all `maw-cli` workflow fixtures and init tests to the finalized prompt/config/template contract required by the upcoming prompt commands.

## Remaining

- No remaining Step 2 tasks.
- `maw-smoke` fixture upgrades remain deferred to Step 5 per the plan.
