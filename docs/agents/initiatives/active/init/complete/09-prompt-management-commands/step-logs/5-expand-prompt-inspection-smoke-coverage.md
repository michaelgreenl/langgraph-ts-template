# Step 5 Log

## Pre-flight

- Read the full `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md` before editing.
- Reviewed `../maw-smoke/maw-smoke-1/package.json`, `../maw-smoke/maw-smoke-1/smoke/support.ts`, `../maw-smoke/maw-smoke-1/smoke/init.ts`, `../maw-smoke/maw-smoke-1/smoke/dev.ts`, and the smoke workflow fixtures under `../maw-smoke/maw-smoke-1/fixtures/workflows/*`.
- Cross-checked the finalized fixture contract against `../maw-cli/tests/fixtures/workflows/*` plus `../maw-cli/tests/prompt-list.test.ts` and `../maw-cli/tests/prompt-preview.test.ts` so the standalone smoke flows assert the same prompt-order and override behavior as the CLI tests.
- No blockers required escalation.
- Noted and proceeded with the non-blocking assumption that the smoke fixtures could keep their existing npm package names (`mock-coding`, `mock-code-agent`) because the prompt commands resolve installed workflows by `scaffold.workflow`, not package name.

## Changes

### Step 5 checklist mapping

- [x] Upgrade `maw-smoke/maw-smoke-1/fixtures/workflows/*` to the same finalized fixture contract used in `maw-cli/tests/fixtures/workflows/*`
  - [x] `./config` export
  - [x] `./templates` export
  - [x] `./scaffold` export with `templateDir`
  - [x] prompt-only `config.json`
  - [x] generated `createGraph({ workflow: '...' })`
  - [x] embedded `general.njk`, `security.njk`, `research-rules.njk`, and `typescript.njk`
  - Updated both `mock-coding` and `mock-code-agent` fixture packages to export side-effect-free `./config`, `./templates`, and scaffold metadata; added finalized prompt config loaders/resolvers; added embedded default snippets; and updated generated `graph.ts` output to pass the workflow id explicitly.
- [x] Update `maw-smoke/maw-smoke-1/smoke/init.ts` only where the upgraded fixture contract changes stale assertions
  - Tightened the coding graph assertion to the finalized `createGraph({ workflow: 'coding' })` scaffold output and added a direct prompt-config assertion for the new prompt-only `config.json` shape.
- [x] Add `smoke:prompt-list` and `smoke:prompt-preview` scripts to `maw-smoke/maw-smoke-1/package.json`
  - Added both standalone prompt smoke scripts to the repo script surface.
- [x] Add `maw-smoke/maw-smoke-1/smoke/prompt-list.ts`
  - [x] create a temp target project
  - [x] install local `maw-cli` plus local mock workflow packages
  - [x] run `maw-cli init`
  - [x] run `maw-cli prompt:list coding`
  - [x] assert exact stdout lines for planner and coder resolved snippet order
  - [x] assert no live model, `.env`, or LangGraph server is required
  - Added a standalone installed-bin smoke that initializes a temp project, runs `prompt:list coding`, asserts the exact planner/coder snippet order, verifies no `.env` exists, and uses the spawn hook to prove the command does not start a child process/server.
- [x] Add `maw-smoke/maw-smoke-1/smoke/prompt-preview.ts`
  - [x] create a temp target project
  - [x] install local `maw-cli` plus local mock workflow packages
  - [x] run `maw-cli init`
  - [x] write `.maw/templates/security.njk` with override text
  - [x] run `maw-cli prompt:preview coding planner`
  - [x] run `maw-cli prompt:preview coding coder`
  - [x] assert the custom security override appears in both previews
  - [x] assert the global snippet text appears before the agent-specific snippet text
  - [x] assert stdout contains only the rendered prompt body
  - [x] assert the smoke path does not depend on a real model provider, `.env`, or OpenViking server
  - Added a standalone installed-bin smoke that writes a custom security override, previews both planner and coder prompts, asserts exact rendered output ordering/body-only stdout, verifies no `.env` exists, and uses the spawn hook to prove the command does not start a child process/server.
- [x] Update `maw-smoke/maw-smoke-1/smoke/support.ts` with any shared helpers needed by the new prompt smoke flows
  - Added shared `prepareProject()`, `initProject()`, and `assertOk()` helpers and reused them across the smoke flows.
- [x] Keep `smoke:init` and `smoke:dev` passing after the fixture upgrades
  - Reused the new shared helpers in the existing smoke scripts and verified both commands still pass.

- Also cleaned up: deduplicated repeated smoke setup/success checks into shared support helpers in `../maw-smoke/maw-smoke-1/smoke/support.ts` (G5) and tightened the stale init assertions to the finalized scaffold contract.
- Updated the Step 5 checkboxes in `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`.

## Files

- `../maw-smoke/maw-smoke-1/package.json`
- `../maw-smoke/maw-smoke-1/smoke/support.ts`
- `../maw-smoke/maw-smoke-1/smoke/init.ts`
- `../maw-smoke/maw-smoke-1/smoke/dev.ts`
- `../maw-smoke/maw-smoke-1/smoke/prompt-list.ts`
- `../maw-smoke/maw-smoke-1/smoke/prompt-preview.ts`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/package.json`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/scaffold.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/config.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/templates/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/templates/defaults/general.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/templates/defaults/security.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/templates/defaults/research-rules.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-coding/templates/defaults/typescript.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/package.json`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/scaffold.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/config.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/templates/index.js`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/templates/defaults/general.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/templates/defaults/security.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/templates/defaults/research-rules.njk`
- `../maw-smoke/maw-smoke-1/fixtures/workflows/mock-code-agent/templates/defaults/typescript.njk`
- `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`
- `docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/5-expand-prompt-inspection-smoke-coverage.md`

## Verification

- `bun run smoke:init` in `../maw-smoke/maw-smoke-1` — **FAIL** (expected RED state: `smoke/init.ts` was tightened to the finalized `createGraph({ workflow: 'coding' })` contract before the smoke fixtures were upgraded).
- `bun run smoke:prompt-list` in `../maw-smoke/maw-smoke-1` — **FAIL** (expected RED state: the smoke fixtures did not yet export `./config`).
- `bun run smoke:prompt-preview` in `../maw-smoke/maw-smoke-1` — **FAIL** (expected RED state: the smoke fixtures did not yet export `./config`).
- `bun run smoke:init` in `../maw-smoke/maw-smoke-1` — **PASS**.
- `bun run smoke:dev` in `../maw-smoke/maw-smoke-1` — **PASS**.
- `bun run smoke:prompt-list` in `../maw-smoke/maw-smoke-1` — **PASS**.
- `bun run smoke:prompt-preview` in `../maw-smoke/maw-smoke-1` — **PASS**.
- `bun run build`, `bun run lint`, and `bun run test` were **not run** in `../maw-smoke/maw-smoke-1` because that package exposes only smoke scripts in `package.json`; there are no `build`, `lint`, or `test` scripts to execute in this repo.

## Summary

- Upgraded the standalone smoke workflow fixtures to the finalized Phase 3 prompt/config/template contract used by `maw-cli` tests.
- Added installed-bin smoke coverage for `maw-cli prompt:list coding` and `maw-cli prompt:preview coding <agent>`, including exact prompt ordering, custom template override precedence, body-only stdout, and no-server / no-`.env` assertions.
- Kept the existing `smoke:init` and `smoke:dev` flows passing after the fixture contract upgrade.

## Remaining

- No Step 5 checklist items remain incomplete.
- Phase-level completion verification remains outside this step.

## Issues

- None.
