# Phase 3 Plan: Prompt Management Commands

## Goal

Add `maw-cli prompt:list <workflow>` and `maw-cli prompt:preview <workflow> <agent>` so a target project can inspect the exact deterministic prompt configuration a workflow will use before execution. The CLI must resolve installed workflows by `scaffold.workflow`, reuse the workflow package's prompt-config and template-engine logic without importing its graph runtime, and gain standalone smoke coverage that proves project-level template overrides win over embedded defaults.

## Scope

- `package.json` in `langgraph-ts-template` - add a side-effect-free `./templates` subpath export
- `src/templates/index.ts` in `langgraph-ts-template` - new barrel for the template engine surface
- `tests/unit/package-metadata.spec.ts` in `langgraph-ts-template` - assert the new `./templates` export
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
- `maw-cli/tests/fixtures/workflows/**/*` - upgrade local fixture packages to the finalized prompt/config/template surface
- `maw-smoke/maw-smoke-1/package.json` - add prompt smoke scripts
- `maw-smoke/maw-smoke-1/smoke/support.ts` - add helpers shared by the new smoke flows
- `maw-smoke/maw-smoke-1/smoke/init.ts` - tighten stale fixture assertions only if the fixture contract change requires it
- `maw-smoke/maw-smoke-1/smoke/prompt-list.ts` - new
- `maw-smoke/maw-smoke-1/smoke/prompt-preview.ts` - new
- `maw-smoke/maw-smoke-1/fixtures/workflows/**/*` - upgrade phase-local mock workflows to the finalized prompt/config/template surface

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
- Smoke coverage stays in `maw-smoke/maw-smoke-1/` and keeps using phase-local fixture workflows, but those fixtures are upgraded to the same prompt/config/template contract that Phase 3 expects from real workflow packages.

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

The local workflow fixtures in both `maw-cli/tests/fixtures/workflows/` and `maw-smoke/maw-smoke-1/fixtures/workflows/` are still on the pre-Phase-2 prompt shape. Phase 3 must realign them before adding prompt-command tests.

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

## Work Plan

### 1. Publish a side-effect-free template-engine subpath

This step is additive packaging only. It exists so `maw-cli prompt:preview` can compose prompts without importing the workflow package root and accidentally constructing the default graph.

- [ ] `langgraph-ts-template/src/templates/index.ts`: add a barrel that re-exports `createTemplateEngine`, `TemplateEngine`, and `TemplateVars`
- [ ] `langgraph-ts-template/package.json`: add the `./templates` export pointing at `dist/templates/index.js` and `dist/templates/index.d.ts`
- [ ] `langgraph-ts-template/tests/unit/package-metadata.spec.ts`: extend the subpath-export assertion to include `./templates`
- [ ] Do not change `langgraph-ts-template/src/index.ts`, `src/templates/engine.ts`, or `src/agent/graph.ts` in this step

Verify:

- [ ] `bun run build` in `langgraph-ts-template`
- [ ] `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`

### 2. Extract shared workflow resolution and realign local fixtures

This step prepares the `maw-cli` and smoke harness for prompt commands without implementing the commands yet.

- [ ] Create `maw-cli/src/utils/workflows.ts` and move workflow-package discovery out of `maw-cli/src/commands/init.ts`
- [ ] Add an exact-match workflow resolver that throws `Workflow not found: <workflow>` when the requested workflow id is not installed
- [ ] Update `maw-cli/src/commands/init.ts` to import the shared workflow loader and keep existing scaffold behavior unchanged
- [ ] Upgrade `maw-cli/tests/fixtures/workflows/*/package.json` exports to include `./config`, `./templates`, and `.`
- [ ] Add side-effect-free `config.js` and `templates/index.js` files to each `maw-cli` workflow fixture package
- [ ] Add embedded `.njk` snippets to each `maw-cli` workflow fixture package so preview tests can assert override precedence and ordering
- [ ] Update each `maw-cli` fixture `scaffold.js` to:
  - [ ] return prompt-only `config.json`
  - [ ] generate `createGraph({ workflow: '...' })`
  - [ ] export `templateDir` alongside `scaffold` and `createScaffoldFiles`
- [ ] Update `maw-cli/tests/init.test.ts` assertions that still reference the retired `general-coding` snippet name or `createGraph()` without a workflow id

Verify:

- [ ] `bun run test -- tests/init.test.ts` in `maw-cli`

### 3. Implement `prompt:list <workflow>`

This step adds the first prompt-inspection command and its help/CLI coverage.

- [ ] Create `maw-cli/src/commands/prompt-list.ts`
- [ ] Use the usage string `prompt:list <workflow>`
- [ ] Missing workflow arg returns exit code `1` and prints `Usage: maw-cli prompt:list <workflow>`
- [ ] Resolve the installed workflow package through `loadWorkflow(root, workflow)`
- [ ] Validate `.maw/graphs/<workflow>/` exists before reading config
- [ ] Import `${packageName}/config` from the target project's installed workflow package, not from the repository source tree
- [ ] Resolve prompt config with the finalized fallback rules from the execution notes
- [ ] Print one line per agent in the exact format `<agent>: <snippet>, <snippet>, <snippet>` with no header or extra prose
- [ ] Register `prompt:list` in `maw-cli/src/index.ts` so `COMMAND_NAMES`, help text, and command parsing all include it
- [ ] Add `maw-cli/tests/prompt-list.test.ts` covering:
  - [ ] missing workflow arg
  - [ ] workflow id not installed
  - [ ] missing `.maw/graphs/<workflow>/` directory
  - [ ] missing `config.json` -> defaults
  - [ ] invalid `config.json` -> `Warning:` to stderr + defaults
  - [ ] resolved planner/coder output order using the finalized fixture defaults
- [ ] Update `maw-cli/tests/cli.test.ts` to assert `prompt:list` appears in help output and parses as a valid command

Verify:

- [ ] `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `maw-cli`

### 4. Implement `prompt:preview <workflow> <agent>`

This step adds the rendering path and the project-config fallback behavior that matches the workflow runtime.

- [ ] Create `maw-cli/src/commands/prompt-preview.ts`
- [ ] Use the usage string `prompt:preview <workflow> <agent>`
- [ ] Missing workflow or agent arg returns exit code `1` and prints `Usage: maw-cli prompt:preview <workflow> <agent>`
- [ ] In `maw-cli/src/utils/config.ts`, add a new module export that returns the default project config when `maw.json` is missing but still throws when an existing `maw.json` is invalid
- [ ] Keep the public `readConfig()` export and its missing-file failure behavior unchanged; `src/index.ts` should not export the new defaulting helper
- [ ] Resolve the installed workflow package through `loadWorkflow(root, workflow)`
- [ ] Validate `.maw/graphs/<workflow>/` exists before reading config
- [ ] Import `${packageName}/config` and `${packageName}/templates` from the installed workflow package's subpath exports; do not import `${packageName}` root
- [ ] Resolve workflow config with the same missing/invalid-file fallback rules as `prompt:list`
- [ ] Load project config with the new defaulting helper and pass `workspace`, `customPath`, and `root` into `createTemplateEngine({ prompts, workspace, customPath, root })`
- [ ] On `Unable to resolve snippet: ...`, emit a `Warning:` to stderr and retry once with `resolveWorkflowConfig()` defaults
- [ ] Do not retry unknown agents or any other render failure
- [ ] Print only the final rendered prompt to stdout, plus a trailing newline
- [ ] Add `maw-cli/tests/prompt-preview.test.ts` covering:
  - [ ] missing args
  - [ ] missing `maw.json` -> default project config fallback
  - [ ] invalid existing `maw.json` -> fatal error
  - [ ] missing workflow-local `config.json` -> default prompt render
  - [ ] invalid workflow-local `config.json` -> `Warning:` + default prompt render
  - [ ] unknown agent -> fatal error
  - [ ] missing configured snippet -> `Warning:` + default prompt render
  - [ ] custom `.maw/templates/security.njk` override wins over embedded `security.njk`
  - [ ] preview order is global snippets first, then agent-specific snippet content
  - [ ] stdout contains only prompt text and no command banner
- [ ] Update `maw-cli/tests/config.test.ts` to cover the new defaulting reader directly from `src/utils/config.ts`
- [ ] Update `maw-cli/tests/cli.test.ts` to assert `prompt:preview` appears in help output and parses as a valid command

Verify:

- [ ] `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `maw-cli`

### 5. Expand standalone smoke coverage for prompt inspection

This step proves the new commands work through the installed-bin flow in a temp target project, with local workflow fixtures and no live provider.

- [ ] Upgrade `maw-smoke/maw-smoke-1/fixtures/workflows/*` to the same finalized fixture contract used in `maw-cli/tests/fixtures/workflows/*`:
  - [ ] `./config` export
  - [ ] `./templates` export
  - [ ] `./scaffold` export with `templateDir`
  - [ ] prompt-only `config.json`
  - [ ] generated `createGraph({ workflow: '...' })`
  - [ ] embedded `general.njk`, `security.njk`, `research-rules.njk`, and `typescript.njk`
- [ ] Update `maw-smoke/maw-smoke-1/smoke/init.ts` only where the upgraded fixture contract changes stale assertions
- [ ] Add `smoke:prompt-list` and `smoke:prompt-preview` scripts to `maw-smoke/maw-smoke-1/package.json`
- [ ] Add `maw-smoke/maw-smoke-1/smoke/prompt-list.ts`:
  - [ ] create a temp target project
  - [ ] install local `maw-cli` plus local mock workflow packages
  - [ ] run `maw-cli init`
  - [ ] run `maw-cli prompt:list coding`
  - [ ] assert exact stdout lines for planner and coder resolved snippet order
  - [ ] assert no live model, `.env`, or LangGraph server is required
- [ ] Add `maw-smoke/maw-smoke-1/smoke/prompt-preview.ts`:
  - [ ] create a temp target project
  - [ ] install local `maw-cli` plus local mock workflow packages
  - [ ] run `maw-cli init`
  - [ ] write `.maw/templates/security.njk` with override text
  - [ ] run `maw-cli prompt:preview coding planner`
  - [ ] run `maw-cli prompt:preview coding coder`
  - [ ] assert the custom security override appears in both previews
  - [ ] assert the global snippet text appears before the agent-specific snippet text
  - [ ] assert stdout contains only the rendered prompt body
  - [ ] assert the smoke path does not depend on a real model provider, `.env`, or OpenViking server
- [ ] Update `maw-smoke/maw-smoke-1/smoke/support.ts` with any shared helpers needed by the new prompt smoke flows
- [ ] Keep `smoke:init` and `smoke:dev` passing after the fixture upgrades

Verify:

- [ ] `bun run smoke:init` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:dev` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:prompt-list` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:prompt-preview` in `maw-smoke/maw-smoke-1`

## Verification

### Per-step verification

- [ ] Step 1: `bun run build` in `langgraph-ts-template`
- [ ] Step 1: `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [ ] Step 2: `bun run test -- tests/init.test.ts` in `maw-cli`
- [ ] Step 3: `bun run test -- tests/prompt-list.test.ts tests/cli.test.ts` in `maw-cli`
- [ ] Step 4: `bun run test -- tests/prompt-preview.test.ts tests/config.test.ts tests/cli.test.ts` in `maw-cli`
- [ ] Step 5: `bun run smoke:init` in `maw-smoke/maw-smoke-1`
- [ ] Step 5: `bun run smoke:dev` in `maw-smoke/maw-smoke-1`
- [ ] Step 5: `bun run smoke:prompt-list` in `maw-smoke/maw-smoke-1`
- [ ] Step 5: `bun run smoke:prompt-preview` in `maw-smoke/maw-smoke-1`

### Phase completion

- [ ] `bun run build` in `langgraph-ts-template`
- [ ] `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template`
- [ ] `bun run typecheck` in `maw-cli`
- [ ] `bun run build` in `maw-cli`
- [ ] `bun run lint` in `maw-cli`
- [ ] `bun run test` in `maw-cli`
- [ ] `bun run smoke:init` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:dev` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:prompt-list` in `maw-smoke/maw-smoke-1`
- [ ] `bun run smoke:prompt-preview` in `maw-smoke/maw-smoke-1`

## Exit Criteria

- [ ] `langgraph-ts-template/package.json` publishes a side-effect-free `./templates` subpath export
- [ ] `langgraph-ts-template/src/templates/index.ts` exists and exports the template-engine surface without importing graph runtime code
- [ ] `maw-cli` command help advertises `prompt:list <workflow>` and `prompt:preview <workflow> <agent>` alongside `init`, `dev`, and `ov:*`
- [ ] `COMMAND_NAMES` in `maw-cli` becomes `['init', 'dev', 'prompt:list', 'prompt:preview', 'ov:init', 'ov:index']`
- [ ] `maw-cli` prompt commands resolve workflows by `scaffold.workflow`, not npm package name
- [ ] `maw-cli` prompt commands do not import workflow package root `.`
- [ ] `maw-cli/tests/fixtures/workflows/*` and `maw-smoke/maw-smoke-1/fixtures/workflows/*` no longer use the retired `general-coding` snippet name or the retired `{ agents: { ...skills } }` config shape
- [ ] Fixture-generated `graph.ts` files use `createGraph({ workflow: '...' })`
- [ ] `maw-cli prompt:list coding` prints:

  ```text
  planner: general, security, research-rules
  coder: general, security, typescript
  ```

- [ ] `maw-cli prompt:list <workflow>` falls back to embedded defaults when `.maw/graphs/<workflow>/config.json` is missing or invalid, and invalid files emit a `Warning:` to stderr
- [ ] `maw-cli prompt:preview coding planner` and `maw-cli prompt:preview coding coder` print only the rendered prompt body to stdout
- [ ] `maw-cli prompt:preview` falls back to the default project config when `maw.json` is missing, but fails loudly when an existing `maw.json` is invalid
- [ ] `maw-cli prompt:preview` retries once with embedded defaults when a configured snippet cannot be resolved, and emits a `Warning:` to stderr when that fallback happens
- [ ] A custom override in `.maw/templates/security.njk` is visible in prompt preview output and outranks the embedded `security.njk`
- [ ] `bun run typecheck && bun run build && bun run lint && bun run test` pass in `maw-cli`
- [ ] `bun run smoke:init`, `bun run smoke:dev`, `bun run smoke:prompt-list`, and `bun run smoke:prompt-preview` all pass in `maw-smoke/maw-smoke-1`
