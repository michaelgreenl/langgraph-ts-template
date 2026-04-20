# Phase 3 Plan: Prompt Management Commands

## Goal

Add `maw-cli prompt:list <workflow>` and `maw-cli prompt:preview <workflow> <agent>` so a target project can inspect the exact deterministic prompt configuration a workflow will use before execution. The CLI must resolve installed workflows by `scaffold.workflow`, reuse the workflow package's prompt-config and template-engine logic without importing its graph runtime, and gain standalone smoke coverage that proves project-level template overrides win over embedded defaults.

## Scope

- `package.json` in `langgraph-ts-template` - add a side-effect-free `./templates` subpath export and keep prompt-command subpaths compatible with installed-target resolution
- `src/templates/index.ts` in `langgraph-ts-template` - new barrel for the template engine surface
- `tests/unit/package-metadata.spec.ts` in `langgraph-ts-template` - assert the prompt-command subpath exports and their install-time compatibility
- `maw-cli/src/index.ts` - register prompt commands and update help output
- `maw-cli/src/commands/init.ts` - consume extracted workflow-resolution helpers; no behavior change beyond fixture-contract realignment
- `maw-cli/src/commands/prompt-list.ts` - new command
- `maw-cli/src/commands/prompt-preview.ts` - new command
- `maw-cli/src/utils/config.ts` - add a defaulting project-config reader for preview without changing the public `readConfig()` contract
- `maw-cli/src/utils/workflows.ts` - new shared workflow discovery and resolution helpers extracted from `init.ts`
- `maw-cli/tests/init.test.ts` - align fixture expectations with the finalized workflow scaffold contract
- `maw-cli/tests/cli.test.ts` - prompt-command help and parser coverage
- `maw-cli/tests/config.test.ts` - direct coverage for the new defaulting config reader
- `maw-cli/tests/prompt-list.test.ts` - new
- `maw-cli/tests/prompt-preview.test.ts` - new
- `maw-cli/tests/fixtures/workflows/**/*` - keep local fixture packages aligned with the finalized prompt/config/template surface and the real workflow package export shape
- `maw-smoke/scripts/initialize-maw-smoke.sh` - create disposable smoke projects that install local repo checkouts
- `docs/agents/initiatives/active/init/init-plan.md` - align Phase 3 smoke verification language with the README-driven manual smoke flow

## Out of Scope

- `maw-cli ov:init` and `maw-cli ov:index` (Phase 4)
- Base workflow model wiring, tool loop, filesystem/shell/git tools, or any Phase 5 runtime behavior
- Runtime-backed skills or any `prompt:list` / `prompt:preview` distinction between static and runtime skills
- Changes to `langgraph-ts-template/src/templates/engine.ts`, `src/templates/composition.ts`, or `src/agent/graph.ts` prompt semantics; Phase 2 already finalized those behaviors
- Adding a prompt-rendering dependency or duplicate Nunjucks implementation to `maw-cli`
- Docs refresh outside this plan file

## Decisions Cleared

- `maw-cli` must not import the workflow package root `.` for prompt commands. In `langgraph-ts-template`, `.` re-exports `graph`, and `graph = createGraph()` eagerly starts prompt-loading work at module-load time. Phase 3 therefore adds and consumes side-effect-free subpaths instead.
- The new side-effect-free workflow package import surface is:
  - `${packageName}/config` for `resolveWorkflowConfig`
  - `${packageName}/templates` for `createTemplateEngine`
  - `${packageName}/scaffold` continues to expose `scaffold`, `createScaffoldFiles`, and `templateDir`
- `templateDir` stays on `./scaffold` to preserve the Phase 2 contract, but Phase 3 prompt commands compose through `./templates` rather than reimplementing template loading in `maw-cli`.
- `prompt:list` prints the resolved snippet order after workflow defaults are applied. It does not inspect snippet file contents.
- `prompt:list` prints one stdout line per agent in the final execution order `[...global, ...agents[agent]]`, with no header or extra prose. The exact format is:

  ```text
  planner: general, security, research-rules
  coder: general, security, typescript
  ```

- `prompt:list` iterates agents in the order returned by `resolveWorkflowConfig().prompts.agents`; do not sort the agent names alphabetically.
- `prompt:preview` composes through the workflow package's exported `createTemplateEngine()` so the preview path matches runtime rendering behavior.
- `prompt:preview` prints only the final rendered prompt to stdout, followed by a trailing newline. No banner, label, or snippet list is prepended.
- Both prompt commands resolve workflows by `scaffold.workflow`, not npm package name. `coding` refers to the workflow id.
- Both prompt commands require `.maw/graphs/<workflow>/` to exist. Missing workflow directory is a hard failure that tells the user to rerun `maw-cli init`.
- Missing `.maw/graphs/<workflow>/config.json` falls back to embedded workflow defaults.
- Invalid workflow-local `config.json` emits a loud warning to stderr, starts with `Warning:`, and falls back to embedded defaults.
- `prompt:preview` reads `maw.json` with the same missing-file fallback the workflow runtime uses: missing file falls back to the default project config; an existing but invalid `maw.json` fails loudly.
- `prompt:preview` retries once with embedded defaults only when rendering fails because a configured snippet cannot be resolved. Unknown agent names and other engine/render failures are fatal.
- Phase 3 is not complete until `prompt:list` and `prompt:preview` work against the real installed `langgraph-ts-template` package surface, not just local fixture packages.
- Final smoke verification follows `../maw-smoke/README.md` and `docs/agents/smoke-tests.md`, using `bun smoke-init <test-slug>` to create a disposable target project under `../maw-smoke/tests/`.
- `../maw-smoke/scripts/initialize-maw-smoke.sh` must install local checkout paths for `../maw-cli` and `../langgraph-ts-template` so agents can verify uncommitted changes without pushing.

## Execution Notes

### Side-effect-free template export

Add a new workflow-package subpath export in `langgraph-ts-template`:

```json
"./templates": {
    "import": "./dist/templates/index.js",
    "types": "./dist/templates/index.d.ts"
}
```

`src/templates/index.ts` should export only the template-engine surface needed by `maw-cli`:

```ts
export { createTemplateEngine, type TemplateEngine, type TemplateVars } from './engine.js';
```

Do not move `createTemplateEngine` off the root export and do not change the runtime graph surface in this step. This is an additive packaging change only.

### Shared workflow resolution in `maw-cli`

Phase 1 left workflow discovery inside `maw-cli/src/commands/init.ts`. Phase 3 adds two more callers (`prompt:list` and `prompt:preview`), so the package-resolution logic should move into `maw-cli/src/utils/workflows.ts`.

That shared module should own:

- `WorkflowScaffold`
- `WorkflowModule`
- `loadWorkflows(root)`
- `loadWorkflow(root, workflow)` or an equivalent exact-match helper that throws `Workflow not found: <workflow>` when no installed package claims the requested workflow id

`maw-cli/src/commands/init.ts` should import that helper and otherwise keep its current scaffold behavior unchanged.

### Finalized local fixture contract

The local workflow fixtures in `maw-cli/tests/fixtures/workflows/` landed the initial prompt-command coverage, but manual smoke against the real installed `langgraph-ts-template` package exposed a remaining export-shape gap. Phase 3 therefore needs one follow-up pass that keeps the fixture contract aligned with the real workflow package surface instead of relying on simpler string-only subpath exports.

Each fixture package should expose:

- `./scaffold`
- `./config`
- `./templates`
- `.`

Each fixture's generated `config.json` should use the finalized prompt-only shape:

```json
{
    "prompts": {
        "global": ["general", "security"],
        "agents": {
            "planner": ["research-rules"],
            "coder": ["typescript"]
        }
    }
}
```

Each fixture's generated `graph.ts` should use the finalized workflow id handoff:

```ts
import { createGraph } from 'coding';

export const graph = createGraph({ workflow: 'coding' });
```

Each fixture package should also include embedded default snippets for at least:

- `general.njk`
- `security.njk`
- `research-rules.njk`
- `typescript.njk`

The fixture template text should stay short and structural so unit and smoke tests can assert exact output ordering without involving a model or live service.

### Prompt-command fallback rules

Both prompt commands should share the same workflow-config resolution semantics:

1. Resolve the installed workflow package from the target project's dependencies by matching `scaffold.workflow`
2. Validate `.maw/graphs/<workflow>/` exists
3. Try to read `.maw/graphs/<workflow>/config.json`
   - missing file -> `resolveWorkflowConfig()` defaults
   - invalid JSON or schema -> `Warning:` to stderr, then `resolveWorkflowConfig()` defaults

`prompt:preview` adds project-config loading on top:

1. Try to read `maw.json`
   - missing file -> use the same default project config that `maw-cli init` scaffolds
   - existing but invalid -> throw
2. Create the template engine with `{ prompts, workspace, customPath, root }`
3. If composition fails with `Unable to resolve snippet: ...`, warn once and retry with `resolveWorkflowConfig()` defaults

Warnings must go to stderr. Successful command output must stay on stdout.

### Real-package export compatibility gap

The initial Phase 3 fixture coverage passed because the fixture packages exported `./config` and `./templates` as plain string subpaths. Manual smoke against the real installed `langgraph-ts-template` package exposed that `maw-cli` resolves `${packageName}/config` and `${packageName}/templates` through `createRequire(...).resolve()`, which currently fails against the real package's conditional export shape.

Phase 3 stays open until that gap is closed in the real package flow and regression coverage reflects the real export surface.

### Manual smoke methodology

Final Phase 3 smoke verification now follows `../maw-smoke/README.md` and `docs/agents/smoke-tests.md`, not the retired `maw-smoke-1` harness.

Use this flow:

1. Run `bun smoke-init <test-slug>` in `../maw-smoke`
2. Work inside `../maw-smoke/tests/smoke-<test-slug>/`
3. Let `scripts/initialize-maw-smoke.sh` install local checkout paths for `../maw-cli` and `../langgraph-ts-template`
4. Execute the relevant `bunx maw-cli ...` commands manually in that disposable target project
5. Log results/issues/fixes to `../maw-smoke/docs/agents/smoke-logs/<test-slug>.md`

## Work Plan

### 1. Publish a side-effect-free template-engine subpath

This step is additive packaging only. It exists so `maw-cli prompt:preview` can compose prompts without importing the workflow package root and accidentally constructing the default graph.

- [x] `langgraph-ts-template/src/templates/index.ts`: add a barrel that re-exports `createTemplateEngine`, `TemplateEngine`, and `TemplateVars`
- [x] `langgraph-ts-template/package.json`: add the `./templates` export pointing at `dist/templates/index.js` and `dist/templates/index.d.ts`
- [x] `langgraph-ts-template/tests/unit/package-metadata.spec.ts`: extend the subpath-export assertion to include `./templates`
- [x] Do not change `langgraph-ts-template/src/index.ts`, `src/templates/engine.ts`, or `src/agent/graph.ts` in this step

Verify:

- [x] `bun run build` in `langgraph-ts-template`
- [x] `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`

### 2. Extract shared workflow resolution and realign local fixtures

This step prepares the `maw-cli` and smoke harness for prompt commands without implementing the commands yet.

- [x] Create `maw-cli/src/utils/workflows.ts` and move workflow-package discovery out of `maw-cli/src/commands/init.ts`
- [x] Add an exact-match workflow resolver that throws `Workflow not found: <workflow>` when the requested workflow id is not installed
- [x] Update `maw-cli/src/commands/init.ts` to import the shared workflow loader and keep existing scaffold behavior unchanged
- [x] Upgrade `maw-cli/tests/fixtures/workflows/*/package.json` exports to include `./config`, `./templates`, and `.`
- [x] Add side-effect-free `config.js` and `templates/index.js` files to each `maw-cli` workflow fixture package
- [x] Add embedded `.njk` snippets to each `maw-cli` workflow fixture package so preview tests can assert override precedence and ordering
- [x] Update each `maw-cli` fixture `scaffold.js` to:
  - [x] return prompt-only `config.json`
  - [x] generate `createGraph({ workflow: '...' })`
  - [x] export `templateDir` alongside `scaffold` and `createScaffoldFiles`
- [x] Update `maw-cli/tests/init.test.ts` assertions that still reference the retired `general-coding` snippet name or `createGraph()` without a workflow id

Verify:

- [x] `bun run test -- tests/init.test.ts` in `maw-cli`

### 3. Implement `prompt:list <workflow>`

This step adds the first prompt-inspection command and its help/CLI coverage.

- [x] Create `maw-cli/src/commands/prompt-list.ts`
- [x] Use the usage string `prompt:list <workflow>`
- [x] Missing workflow arg returns exit code `1` and prints `Usage: maw-cli prompt:list <workflow>`
- [x] Resolve the installed workflow package through `loadWorkflow(root, workflow)`
- [x] Validate `.maw/graphs/<workflow>/` exists before reading config
- [x] Import `${packageName}/config` from the target project's installed workflow package, not from the repository source tree
- [x] Resolve prompt config with the finalized fallback rules from the execution notes
- [x] Print one line per agent in the exact format `<agent>: <snippet>, <snippet>, <snippet>` with no header or extra prose
- [x] Register `prompt:list` in `maw-cli/src/index.ts` so `COMMAND_NAMES`, help text, and command parsing all include it
- [x] Add `maw-cli/tests/prompt-list.test.ts` covering:
  - [x] missing workflow arg
  - [x] workflow id not installed
  - [x] missing `.maw/graphs/<workflow>/` directory
  - [x] missing `config.json` -> defaults
  - [x] invalid `config.json` -> `Warning:` to stderr + defaults
  - [x] resolved planner/coder output order using the finalized fixture defaults
- [x] Update `maw-cli/tests/cli.test.ts` to assert `prompt:list` appears in help output and parses as a valid command

Verify:

- [x] `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `maw-cli`

### 4. Implement `prompt:preview <workflow> <agent>`

This step adds the rendering path and the project-config fallback behavior that matches the workflow runtime.

- [x] Create `maw-cli/src/commands/prompt-preview.ts`
- [x] Use the usage string `prompt:preview <workflow> <agent>`
- [x] Missing workflow or agent arg returns exit code `1` and prints `Usage: maw-cli prompt:preview <workflow> <agent>`
- [x] In `maw-cli/src/utils/config.ts`, add a new module export that returns the default project config when `maw.json` is missing but still throws when an existing `maw.json` is invalid
- [x] Keep the public `readConfig()` export and its missing-file failure behavior unchanged; `src/index.ts` should not export the new defaulting helper
- [x] Resolve the installed workflow package through `loadWorkflow(root, workflow)`
- [x] Validate `.maw/graphs/<workflow>/` exists before reading config
- [x] Import `${packageName}/config` and `${packageName}/templates` from the installed workflow package's subpath exports; do not import `${packageName}` root
- [x] Resolve workflow config with the same missing/invalid-file fallback rules as `prompt:list`
- [x] Load project config with the new defaulting helper and pass `workspace`, `customPath`, and `root` into `createTemplateEngine({ prompts, workspace, customPath, root })`
- [x] On `Unable to resolve snippet: ...`, emit a `Warning:` to stderr and retry once with `resolveWorkflowConfig()` defaults
- [x] Do not retry unknown agents or any other render failure
- [x] Print only the final rendered prompt to stdout, plus a trailing newline
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
- [x] Update `maw-cli/tests/cli.test.ts` to assert `prompt:preview` appears in help output and parses as a valid command

Verify:

- [x] `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `maw-cli`

### 5. Expand standalone smoke coverage for prompt inspection (initial harness)

This step proved the new commands through the initial phase-local smoke harness. It remains useful historical context, but final Phase 3 verification now follows the manual local-repo smoke flow in Issue Step 7 below.

- [x] Upgrade `maw-smoke/maw-smoke-1/fixtures/workflows/*` to the same finalized fixture contract used in `maw-cli/tests/fixtures/workflows/*`:
  - [x] `./config` export
  - [x] `./templates` export
  - [x] `./scaffold` export with `templateDir`
  - [x] prompt-only `config.json`
  - [x] generated `createGraph({ workflow: '...' })`
  - [x] embedded `general.njk`, `security.njk`, `research-rules.njk`, and `typescript.njk`
- [x] Update `maw-smoke/maw-smoke-1/smoke/init.ts` only where the upgraded fixture contract changes stale assertions
- [x] Add `smoke:prompt-list` and `smoke:prompt-preview` scripts to `maw-smoke/maw-smoke-1/package.json`
- [x] Add `maw-smoke/maw-smoke-1/smoke/prompt-list.ts`:
  - [x] create a temp target project
  - [x] install local `maw-cli` plus local mock workflow packages
  - [x] run `maw-cli init`
  - [x] run `maw-cli prompt:list coding`
  - [x] assert exact stdout lines for planner and coder resolved snippet order
  - [x] assert no live model, `.env`, or LangGraph server is required
- [x] Add `maw-smoke/maw-smoke-1/smoke/prompt-preview.ts`:
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
- [x] Update `maw-smoke/maw-smoke-1/smoke/support.ts` with any shared helpers needed by the new prompt smoke flows
- [x] Keep `smoke:init` and `smoke:dev` passing after the fixture upgrades

Verify:

- [x] `bun run smoke:init` in `maw-smoke/maw-smoke-1`
- [x] `bun run smoke:dev` in `maw-smoke/maw-smoke-1`
- [x] `bun run smoke:prompt-list` in `maw-smoke/maw-smoke-1`
- [x] `bun run smoke:prompt-preview` in `maw-smoke/maw-smoke-1`

### 6. Fix prompt-command resolution against the real installed workflow package

This issue step closes the gap between fixture coverage and the real installed `langgraph-ts-template` package surface.

- [x] Update the relevant prompt-command module-resolution path and/or workflow package export conditions so `${packageName}/config` and `${packageName}/templates` resolve from an installed target project when the workflow package uses conditional `exports`
- [x] Add regression coverage in `langgraph-ts-template/tests/unit/package-metadata.spec.ts` for the export conditions that `maw-cli prompt:list` and `maw-cli prompt:preview` rely on
- [x] Update `maw-cli/tests/fixtures/workflows/*/package.json` so at least one prompt-command fixture mirrors the real conditional subpath export shape instead of the earlier string-only form
- [x] Extend `maw-cli/tests/prompt-list.test.ts` and `maw-cli/tests/prompt-preview.test.ts` so the real-package export-shape regression is covered automatically
- [x] Verify `bunx maw-cli prompt:list langgraph-ts-template` works in a disposable smoke project created from local repo checkouts
- [x] Verify `bunx maw-cli prompt:preview langgraph-ts-template planner` works in that same disposable smoke project

Verify:

- [x] `bun run build` in `langgraph-ts-template`
- [x] `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [x] `bun run test -- tests/prompt-list.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` in `maw-cli`

### 7. Replace the retired phase-local smoke harness with the manual local-repo smoke workflow

This issue step makes the README-driven smoke flow the official Phase 3 verification path.

- [x] Update `../maw-smoke/scripts/initialize-maw-smoke.sh` so `bun smoke-init <test-slug>` installs local checkout paths for `../maw-cli` and `../langgraph-ts-template` instead of GitHub URLs, leaving `bunx maw-cli ...` execution to the manual smoke flow
- [x] Update `docs/agents/initiatives/active/init/init-plan.md` so Phase 3 and the verification gates point at the README-driven manual smoke flow
- [x] Update this Phase 3 plan so `../maw-smoke/README.md` + `docs/agents/smoke-tests.md` are the canonical smoke instructions and `maw-smoke-1` is no longer treated as the final verification path
- [x] Define the manual Phase 3 smoke runbook in this plan:
  - [x] run `bun smoke-init <test-slug>` in `../maw-smoke`
  - [x] in `../maw-smoke/tests/smoke-<test-slug>/`, run `bunx maw-cli init`
  - [x] in that generated smoke project, run `bunx maw-cli prompt:list langgraph-ts-template`
  - [x] write `.maw/templates/security.njk` override text in the generated smoke project
  - [x] run `bunx maw-cli prompt:preview langgraph-ts-template planner`
  - [x] log results/issues/fixes to `../maw-smoke/docs/agents/smoke-logs/<test-slug>.md`

Verify:

- [x] `bun smoke-init phase3-prompt-commands` in `../maw-smoke`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli init`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli prompt:list langgraph-ts-template`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, write `.maw/templates/security.njk` and run `bunx maw-cli prompt:preview langgraph-ts-template planner`

## Verification

### Per-step verification

- [x] Step 1: `bun run build` in `langgraph-ts-template`
- [x] Step 1: `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [x] Step 2: `bun run test -- tests/init.test.ts` in `maw-cli`
- [x] Step 3: `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `maw-cli`
- [x] Step 4: `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `maw-cli`
- [x] Step 6: `bun run build` in `langgraph-ts-template`
- [x] Step 6: `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [x] Step 6: `bun run test -- tests/prompt-list.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` in `maw-cli`
- [x] Step 7: `bun smoke-init phase3-prompt-commands` in `../maw-smoke`
- [x] Step 7: in `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli init`
- [x] Step 7: in `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli prompt:list langgraph-ts-template`
- [x] Step 7: in `../maw-smoke/tests/smoke-phase3-prompt-commands/`, write `.maw/templates/security.njk` and run `bunx maw-cli prompt:preview langgraph-ts-template planner`

### Phase completion

- [x] `bun run build` in `langgraph-ts-template`
- [x] `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [x] `bun run typecheck` in `maw-cli`
- [x] `bun run build` in `maw-cli`
- [x] `bun run lint` in `maw-cli`
- [x] `bun run test` in `maw-cli`
- [x] `bun smoke-init phase3-prompt-commands` in `../maw-smoke`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli init`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, run `bunx maw-cli prompt:list langgraph-ts-template`
- [x] In `../maw-smoke/tests/smoke-phase3-prompt-commands/`, write `.maw/templates/security.njk` and run `bunx maw-cli prompt:preview langgraph-ts-template planner`

## Exit Criteria

- [x] `langgraph-ts-template/package.json` publishes prompt-command subpath exports (`./config`, `./templates`) in a shape that installed target projects can resolve
- [x] `langgraph-ts-template/src/templates/index.ts` exists and exports the template-engine surface without importing graph runtime code
- [x] `maw-cli` command help advertises `prompt:list <workflow>` and `prompt:preview <workflow> <agent>` alongside `init`, `dev`, and `ov:*`
- [x] `COMMAND_NAMES` in `maw-cli` becomes `['init', 'dev', 'prompt:list', 'prompt:preview', 'ov:init', 'ov:index']`
- [x] `maw-cli` prompt commands resolve workflows by `scaffold.workflow`, not npm package name
- [x] `maw-cli` prompt commands do not import workflow package root `.`
- [x] `maw-cli` automated prompt-command coverage includes a fixture package whose `exports` shape matches the real installed workflow package surface closely enough to catch the conditional-subpath regression
- [x] Fixture-generated `graph.ts` files use `createGraph({ workflow: '...' })`
- [x] `maw-cli prompt:list coding` prints:

  ```text
  planner: general, security, research-rules
  coder: general, security, typescript
  ```

- [x] `maw-cli prompt:list <workflow>` falls back to embedded defaults when `.maw/graphs/<workflow>/config.json` is missing or invalid, and invalid files emit a `Warning:` to stderr
- [x] `maw-cli prompt:list langgraph-ts-template` works in a disposable smoke project created from local repo checkouts
- [x] `maw-cli prompt:preview langgraph-ts-template planner` and `maw-cli prompt:preview langgraph-ts-template coder` print only the rendered prompt body to stdout in that smoke project
- [x] `maw-cli prompt:preview` falls back to the default project config when `maw.json` is missing, but fails loudly when an existing `maw.json` is invalid
- [x] `maw-cli prompt:preview` retries once with embedded defaults when a configured snippet cannot be resolved, and emits a `Warning:` to stderr when that fallback happens
- [x] A custom override in `.maw/templates/security.njk` is visible in prompt preview output and outranks the embedded `security.njk`
- [x] `bun run typecheck && bun run build && bun run lint && bun run test` pass in `maw-cli`
- [x] The README-driven manual smoke flow passes without pushing changes first: `bun smoke-init <test-slug>`, `bunx maw-cli init`, `bunx maw-cli prompt:list langgraph-ts-template`, `bunx maw-cli prompt:preview langgraph-ts-template planner`, and a smoke log entry under `../maw-smoke/docs/agents/smoke-logs/`
