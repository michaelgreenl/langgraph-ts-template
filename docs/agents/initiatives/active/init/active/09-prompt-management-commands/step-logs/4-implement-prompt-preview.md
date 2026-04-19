# Step 4 Log

## Pre-flight

- Read the full `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md` before editing.
- Reviewed the Step 4 code paths in `../maw-cli/src/index.ts`, `../maw-cli/src/utils/config.ts`, `../maw-cli/src/utils/workflows.ts`, `../maw-cli/src/commands/prompt-list.ts`, `../maw-cli/tests/cli.test.ts`, `../maw-cli/tests/config.test.ts`, `../maw-cli/tests/support.ts`, and the installed-workflow fixtures under `../maw-cli/tests/fixtures/workflows/*`.
- No blockers or ambiguities required escalation.

## Changes

### Step 4 checklist mapping

- [x] Create `maw-cli/src/commands/prompt-preview.ts`
  - Added `runPromptPreview()` and `promptPreviewCommand`.
- [x] Use the usage string `prompt:preview <workflow> <agent>`
  - Added the exact `usage` constant and wired it into command registration/help output.
- [x] Missing workflow or agent arg returns exit code `1` and prints `Usage: maw-cli prompt:preview <workflow> <agent>`
  - Missing args now fail through `printError()` with the exact usage message.
- [x] In `maw-cli/src/utils/config.ts`, add a new module export that returns the default project config when `maw.json` is missing but still throws when an existing `maw.json` is invalid
  - Added `readConfigOrDefault(root)` with missing-file fallback and invalid-file pass-through.
- [x] Keep the public `readConfig()` export and its missing-file failure behavior unchanged; `src/index.ts` should not export the new defaulting helper
  - Kept `src/index.ts` exporting only `readConfig`; direct coverage asserts `readConfigOrDefault` is only available from `src/utils/config.ts`.
- [x] Resolve the installed workflow package through `loadWorkflow(root, workflow)`
  - `prompt:preview` resolves workflows by `scaffold.workflow` through `loadWorkflow()`.
- [x] Validate `.maw/graphs/<workflow>/` exists before reading config
  - Added the same workflow-directory guard used by `prompt:list`, including the rerun-`maw-cli init` guidance.
- [x] Import `${packageName}/config` and `${packageName}/templates` from the installed workflow package's subpath exports; do not import `${packageName}` root
  - Dynamic imports now resolve only `${packageName}/config` and `${packageName}/templates`.
- [x] Resolve workflow config with the same missing/invalid-file fallback rules as `prompt:list`
  - Missing `.maw/graphs/<workflow>/config.json` falls back to embedded defaults; invalid JSON/schema emits `Warning:` to stderr and also falls back.
- [x] Load project config with the new defaulting helper and pass `workspace`, `customPath`, and `root` into `createTemplateEngine({ prompts, workspace, customPath, root })`
  - `prompt:preview` now reads project config through `readConfigOrDefault()` and passes those exact fields into `createTemplateEngine()`.
- [x] On `Unable to resolve snippet: ...`, emit a `Warning:` to stderr and retry once with `resolveWorkflowConfig()` defaults
  - Added a single retry path gated by the `Unable to resolve snippet: ` prefix.
- [x] Do not retry unknown agents or any other render failure
  - Non-snippet errors bubble out unchanged and fail the command.
- [x] Print only the final rendered prompt to stdout, plus a trailing newline
  - Successful runs now write only `${prompt}\n`.
- [x] Add `maw-cli/tests/prompt-preview.test.ts` covering:
  - [x] missing args
  - [x] missing `maw.json` -> default project config fallback
  - [x] invalid existing `maw.json` -> fatal error
  - [x] missing workflow-local `config.json` -> default prompt render
  - [x] invalid workflow-local `config.json` -> `Warning:` + default prompt render
  - [x] unknown agent -> fatal error
  - [x] missing configured snippet -> `Warning:` + default prompt render
  - [x] custom `.maw/templates/security.njk` override wins over embedded `security.njk`
  - [x] preview order is global snippets first, then agent-specific snippet content
  - [x] stdout contains only prompt text and no command banner
- [x] Update `maw-cli/tests/config.test.ts` to cover the new defaulting reader directly from `src/utils/config.ts`
  - Added direct `readConfigOrDefault()` coverage and an assertion that it is not exported from `src/index.ts`.
- [x] Update `maw-cli/tests/cli.test.ts` to assert `prompt:preview` appears in help output and parses as a valid command
  - Updated help and parser assertions for the new command.

- Also cleaned up: deduplicated config-file loading and ENOENT handling in `../maw-cli/src/utils/config.ts` while preserving the public `readConfig()` contract (G5).
- Updated the Step 4 checkboxes in `tasks.md`.

## Files

- `../maw-cli/dist/commands/prompt-preview.d.ts`
- `../maw-cli/dist/commands/prompt-preview.js`
- `../maw-cli/dist/index.d.ts`
- `../maw-cli/dist/index.js`
- `../maw-cli/dist/utils/config.d.ts`
- `../maw-cli/dist/utils/config.js`
- `../maw-cli/src/commands/prompt-preview.ts`
- `../maw-cli/src/index.ts`
- `../maw-cli/src/utils/config.ts`
- `../maw-cli/tests/cli.test.ts`
- `../maw-cli/tests/config.test.ts`
- `../maw-cli/tests/prompt-preview.test.ts`
- `docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`
- `docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/4-implement-prompt-preview.md`

## Verification

- `bun run test -- tests/config.test.ts tests/cli.test.ts` in `../maw-cli` — **FAIL** (expected RED state: `readConfigOrDefault` and `prompt:preview` were not implemented yet).
- `bun run test -- tests/config.test.ts tests/cli.test.ts` in `../maw-cli` — **PASS**.
- `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `../maw-cli` — **FAIL** (expected RED state: `prompt:preview` behavior was still stubbed).
- `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `../maw-cli` — **PASS**.
- `bun run build` in `../maw-cli` — **FAIL** once with TS2322 narrowing errors in the dynamic import loaders inside `src/commands/prompt-preview.ts`.
- `bun run build` in `../maw-cli` — **PASS** after returning explicitly validated module shapes.
- `bun run build` in `../maw-cli` — **PASS** (final full-suite verification run).
- `bun run lint` in `../maw-cli` — **PASS**.
- `bun run test` in `../maw-cli` — **PASS**.
- `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `../maw-cli` — **PASS** (Step 4 plan verification command).

## Summary

- Implemented `maw-cli prompt:preview <workflow> <agent>` with installed-workflow resolution, workflow-directory validation, workflow-config fallback rules, project-config defaulting, and installed `${packageName}/templates` rendering.
- Added a single warning-and-retry path for missing configured snippets while keeping unknown agents and other render failures fatal.
- Verified the new command with targeted Step 4 coverage plus the full `maw-cli` build/lint/test suite.

## Remaining

- No remaining Step 4 tasks.
- Step 5 smoke coverage remains intentionally untouched and out of scope for this step.

## Issues

- None.
