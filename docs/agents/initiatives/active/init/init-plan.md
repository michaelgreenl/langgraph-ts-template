# MAW (Model Accelerated Workflow) — Initialization Plan

## Status Reset

This plan supersedes the earlier Phase 6 assumption that opencode would only sit behind the Phase 5 LangGraph `planner -> coder` graph as a tool provider.

The current direction is now:

- `maw-cli dev <workflow>` is the primary interactive workflow runner.
- Interactive workflow execution uses bundled opencode directly, not LangGraph.
- The default base workflow agent set is visible primary `planner` and `manager`, plus hidden subagent `coder`.
- `planner` starts the interactive session and may only write plan documents after explicit user approval plus an explicit repo-relative destination path.
- An explicit execute request hands the approved plan off from `planner` to `manager`.
- `manager` executes clean phase steps through `coder` subagents and auto-commits clean results as part of the interactive workflow contract.
- `.maw/graphs/<workflow>/opencode.json` replaces `.maw/graphs/<workflow>/config.json`.
- Nunjucks, `.maw/templates/`, and `maw-cli prompt:*` are retired from the active MVP contract.
- `.maw/graphs/<workflow>/graph.ts` and `.maw/graphs/<workflow>/langgraph.json` remain only for the retained headless LangGraph compatibility and smoke path; they are no longer the primary interactive UX.
- `maw-cli` bundles the opencode runtime dependency needed for `dev`; target projects do not install `opencode` separately.

Still valid from earlier work:

- Bun migration
- Vitest migration
- Changesets and versioning workflow
- Workflow packages being installable npm/git packages
- `maw-cli` remaining a standalone bootstrap and runtime wrapper tool
- Project-scoped OpenViking bootstrap and runtime wrappers

The remaining alignment work is now:

- replacing the old workflow-local `config.json` / Nunjucks prompt surface with raw workflow-local `opencode.json`
- landing the `planner -> manager -> coder` interactive runtime in Phase 6
- wiring shared OpenViking retrieval into the shipped workflow runtime in Phase 7

## Finalized Decisions

- `maw-cli` is installed and invoked separately from workflow packages.
- Workflow packages do not carry `maw-cli` as a dependency.
- A target-project `package.json` is required at the MAW scope root because `maw-cli init` discovers installed workflow packages there.
- There is no project-root `maw.json` file in the active MVP contract.
- MAW scope is defined by the nearest ancestor containing `.maw/`.
- Phase 6 removes the runtime OpenViking retrieval toggle entirely instead of relocating it.
- OpenViking remains per-project, not per-workflow.
- `.maw/openviking/` is the project-local OpenViking storage location for that MAW scope.
- `.maw/ov.conf` is the project-local OpenViking server config authority.
- `.maw/ovcli.conf` is the project-local OpenViking client/runtime URL authority and stores no secrets.
- The target project's workflow runtime files live under `.maw/graphs/<workflow>/`.
- Each workflow directory contains `graph.ts`, `opencode.json`, and `langgraph.json`.
- `.maw/graphs/<workflow>/opencode.json` is the workflow runtime config authority and uses raw opencode schema.
- `.maw/graphs/<workflow>/config.json` is retired.
- Nunjucks prompt composition and `.maw/templates/` are retired from the active MVP contract. `maw-cli init` stops creating `.maw/templates/`; if an older directory already exists, reruns preserve it but MAW ignores it.
- Workflow packages ship both the default scaffolded `opencode.json` asset and the validation schema or validator for the workflow-required `opencode.json` shape.
- `maw-cli init` materializes `.maw/graphs/<workflow>/opencode.json` if it is missing, and preserves existing files on rerun.
- Workflow validation must require visible primary `planner` and `manager`, hidden subagent `coder`, and `default_agent: "planner"`. Invalid edited `opencode.json` files fail execution instead of silently falling back.
- A workflow is treated as interactive when its workflow-local `opencode.json` contains any agent with `hidden !== true`.
- The shipped base workflow defaults to visible primary `planner` and `manager`, plus hidden `coder`.
- `maw-cli dev <workflow>` launches bundled opencode directly in TTY mode and starts on `planner`.
- `planner` may write plan docs only after explicit user approval plus an explicit repo-relative path.
- An explicit execute request hands the active workflow off from `planner` to `manager`.
- `manager` executes approved `tasks.md` work through `coder` subagents and auto-commits clean results. This is an explicit workflow contract, even though the repo-wide default elsewhere is to avoid auto-committing without user direction.
- `maw-cli dev <workflow>` launches bundled opencode in server-only mode when no TTY is present so SDK harnesses can exercise the same interactive workflow headlessly.
- The retained LangGraph `/runs/wait` path stays separate from interactive opencode execution and remains a compatibility and smoke surface only.
- `maw-cli` exposes `ov:server` and `ov:index`, but not `ov:init`, `start`, `prompt:list`, or `prompt:preview`, in the active MVP command surface.
- `maw-cli` bundles the opencode runtime dependency required for `dev`; target projects do not install opencode separately.
- Runtime-backed skills are post-MVP and tracked in a separate queued initiative.

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│ REPO: maw-cli                                            │
│ Standalone bootstrap / workflow runner /                 │
│ OpenViking runtime-wrapper package                       │
│ Owns: init, dev, ov:*                                    │
│ Seeds: .maw/ov.conf, .maw/ovcli.conf,                    │
│        .maw/graphs/<workflow>/{graph.ts,opencode.json,   │
│        langgraph.json}                                   │
└──────────────────────────────┬───────────────────────────┘
                               │ bootstraps target-project MAW files
                               ▼
┌──────────────────────────────────────────────────────────┐
│ TARGET PROJECT                                           │
│ package.json                                             │
│ .maw/graphs/<workflow>/                                  │
│   graph.ts                                               │
│   opencode.json                                          │
│   langgraph.json                                         │
│ .maw/ov.conf                                             │
│ .maw/ovcli.conf                                          │
│ .maw/openviking/                                         │
└───────────────┬─────────────────────────────┬────────────┘
                │                             │
                │ interactive `maw-cli dev`   │ retained direct LangGraph smoke
                ▼                             ▼
┌────────────────────────────────┐   ┌──────────────────────────────────┐
│ Bundled opencode runtime       │   │ bunx @langchain/langgraph-cli   │
│ planner (primary)              │   │   dev --config .maw/graphs/...  │
│   └─ explicit execute ──▶      │   │                                  │
│ manager (primary)              │   │ /runs/wait compatibility path    │
│   └─ task ───────────────▶     │   └──────────────────────────────────┘
│ coder (hidden subagent)        │
└────────────────┬───────────────┘
                 │ project-scoped OpenViking remains shared
                 ▼
      ┌──────────────────────────────┐
      │ openviking-server            │
      │ openviking add-resource      │
      └──────────────────────────────┘
```

## Responsibility Split

| Concern | Owner |
| --- | --- |
| target-project `package.json` | target project |
| `.maw/ov.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/ovcli.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/graphs/<workflow>/graph.ts` | workflow package |
| `.maw/graphs/<workflow>/opencode.json` default asset | workflow package |
| `.maw/graphs/<workflow>/opencode.json` later edits | target project, subject to workflow validation |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |
| workflow-local `opencode.json` validation schema / validator | workflow package |
| opencode runtime bundling and launch | `maw-cli` |
| interactive session bootstrap (`planner` first, non-TTY server-only launch) | `maw-cli` |
| default `planner` / `manager` / `coder` prompts and role contract | workflow package |
| OpenViking config parsing / `${VAR}` placeholder resolution | `maw-cli` |
| OpenViking server launch and indexing execution | `maw-cli` |
| retained LangGraph compatibility runtime implementation | workflow package |
| retained LangGraph compatibility launch file generation | `maw-cli` |
| OpenViking retrieval inside the shipped workflow runtime | workflow package |

## Target Project Scaffold

`maw-cli init` should converge on this target-project layout:

```text
package.json
.maw/
  graphs/
    coding/
      graph.ts
      opencode.json
      langgraph.json
    code-agent/
      graph.ts
      opencode.json
      langgraph.json
  ov.conf
  ovcli.conf
  openviking/   # created by OpenViking on first successful index
```

### MAW scope

MAW scope is defined by the nearest ancestor containing `.maw/`.

- Running `maw-cli init` at a monorepo root creates one MAW/OpenViking scope for that root by creating `.maw/` there.
- Running `maw-cli init` inside `packages/app` creates a workspace-local MAW/OpenViking scope inside that workspace by creating `.maw/` there.
- Relative MAW paths (`.maw/graphs/<workflow>/`, `.maw/ov.conf`, `.maw/ovcli.conf`) resolve from that same scope root.
- Commands that require an initialized MAW scope fail clearly when no ancestor contains `.maw/`.
- `.maw/templates/` is no longer part of the active contract. If an older repo already has it, Phase 6 leaves it alone but MAW does not read it.

### `.maw/ov.conf`

`.maw/ov.conf` is generated by `maw-cli` and configured once per target project.

- it configures the shared OpenViking database for the project
- it includes the server bind settings used by `maw-cli ov:server`
- it seeds the OpenAI-backed dense-embedding and VLM defaults used by the Phase 4 scaffold
- every installed workflow uses the same indexed project context
- it may use environment variable placeholders like `${OPENAI_API_KEY}` or any other `${VAR}` name supported by MAW's runtime resolver
- the scaffold keeps `${OPENAI_API_KEY}` literal and lets `maw-cli ov:server` resolve it at runtime from the current process environment first and the MAW-scope local `.env` as fallback
- `maw-cli` loads that `.env` file explicitly for placeholder resolution instead of relying on Bun auto-loading, and writes the resolved values only to the ephemeral temp config outside the project tree
- unresolved placeholders fail clearly at runtime instead of being passed through literally to the upstream provider

Relevant generated fields:

```json
{
    "storage": {
        "workspace": "./.maw/openviking"
    },
    "server": {
        "host": "127.0.0.1",
        "port": 1933
    },
    "embedding": {
        "dense": {
            "provider": "openai",
            "api_base": "https://api.openai.com/v1",
            "api_key": "${OPENAI_API_KEY}",
            "model": "text-embedding-3-large",
            "dimension": 3072
        },
        "max_concurrent": 10
    },
    "vlm": {
        "provider": "openai",
        "api_base": "https://api.openai.com/v1",
        "api_key": "${OPENAI_API_KEY}",
        "model": "gpt-4o",
        "max_concurrent": 100
    }
}
```

### `.maw/ovcli.conf`

`.maw/ovcli.conf` is generated by `maw-cli` and kept project-local so `openviking add-resource ...` can target the same OpenViking server as the target project instead of falling back to the operator's global `~/.openviking/ovcli.conf`.

- it is seeded with the loopback default URL for the generated `.maw/ov.conf`
- it contains no secrets or API keys
- `maw-cli init` creates it if missing
- rerunning `maw-cli init` preserves it instead of reconciling drift

Minimal shape:

```json
{
    "url": "http://localhost:1933"
}
```

### `.maw/graphs/<workflow>/graph.ts`

This file is generated from the workflow package's scaffold export.

It remains the workflow-specific LangGraph entry point only for the retained headless compatibility and smoke path.

Example shape:

```ts
import { createGraph } from 'coding';

export const graph = createGraph({ workflow: 'coding' });
```

### `.maw/graphs/<workflow>/opencode.json`

This file is generated from the workflow package's scaffold export.

It is the workflow-specific interactive runtime config and user-editable prompt/context surface.

Rules:

- it uses raw opencode schema only; Phase 6 does not add a MAW-specific opencode extension layer
- it should contain no literal secrets; use opencode env/file substitution when provider auth needs external values
- target projects may edit prompts, context, permissions, and model/provider settings directly in this file so long as the workflow validator still passes
- the shipped base workflow validator must require visible primary `planner` and `manager`, hidden subagent `coder`, and `default_agent: "planner"`
- invalid edited `opencode.json` fails before runtime launch

Conceptual base-workflow shape:

```json
{
    "$schema": "https://opencode.ai/config.json",
    "default_agent": "planner",
    "agent": {
        "planner": {
            "mode": "primary",
            "description": "Planning-only agent that writes initiative plans and phase tasks docs after clearing assumptions",
            "prompt": "<planner system prompt>",
            "permission": {
                "edit": "ask",
                "bash": "deny",
                "task": {
                    "*": "deny",
                    "explore": "allow",
                    "general": "allow"
                }
            }
        },
        "manager": {
            "mode": "primary",
            "description": "Executes an approved phase tasks.md step by step using coder subagents",
            "prompt": "<manager system prompt>",
            "permission": {
                "edit": "allow",
                "bash": "allow",
                "task": {
                    "*": "deny",
                    "coder": "allow"
                }
            }
        },
        "coder": {
            "mode": "subagent",
            "hidden": true,
            "description": "TDD-focused implementor dispatched by the manager for a specific tasks.md step",
            "prompt": "<coder system prompt>",
            "permission": {
                "edit": "allow",
                "bash": "allow"
            }
        }
    }
}
```

### `.maw/graphs/<workflow>/langgraph.json`

This file is generated by `maw-cli`, not by the workflow package.

It exists only so the retained LangGraph compatibility path can still run the workflow package's `graph.ts` directly.

Conceptual shape:

```json
{
    "node_version": "20",
    "graphs": {
        "<workflow>": "./graph.ts:graph"
    },
    "env": "../../../.env"
}
```

Paths inside `langgraph.json` are relative to `.maw/graphs/<workflow>/`, so the generated file should use `./graph.ts:graph` and `../../../.env`.

The MVP generator should omit `dependencies` because Docker-backed LangGraph launch is not needed for this project.

## Workflow Package Contract

Workflow packages built from `langgraph-ts-template` should expose:

- the retained headless runtime API, including `createGraph`
- a default scaffolded `opencode.json` asset for the workflow's interactive runtime
- a workflow-local validator or schema export for `.maw/graphs/<workflow>/opencode.json`
- a `./scaffold` export that describes only workflow-owned target-project files and includes `scaffold.workflow` as the short workflow id used by `maw-cli dev <workflow>` and the retained direct LangGraph smoke path

The scaffold contract should be revised so the workflow package contributes:

- `.maw/graphs/<workflow>/graph.ts`
- `.maw/graphs/<workflow>/opencode.json`

The workflow package should not contribute:

- `.maw/ov.conf`
- `.maw/ovcli.conf`
- `.maw/graphs/<workflow>/langgraph.json`
- prompt preview metadata, Nunjucks snippet directories, or `.maw/templates/` overrides
- any direct dependency on `maw-cli`

## Command Surface

The active MVP command surface lives on `maw-cli`; target projects no longer need MAW-owned OpenViking wrapper scripts in `package.json`, and Phase 6 retires the old prompt inspection commands.

### `maw-cli`

```text
maw-cli init
maw-cli dev <workflow>
maw-cli ov:server
maw-cli ov:index [target-path] [openviking args...]
```

### `maw-cli init`

`maw-cli init` should:

- require a target-project `package.json` in the current working directory before initialization
- create `.maw/graphs/`
- create `.maw/ov.conf` if missing
- create `.maw/ovcli.conf` if missing
- append `.maw/openviking/` to `.gitignore` if missing
- read the target project's existing `package.json` for workflow discovery only; do not mutate it for OpenViking runtime wiring
- discover installed workflow packages via the `./scaffold` export contract
- if no workflow packages are installed yet, still create the project-level scaffold and warn
- create `.maw/graphs/<workflow>/graph.ts` for each discovered workflow if missing
- create `.maw/graphs/<workflow>/opencode.json` for each discovered workflow if missing
- generate `.maw/graphs/<workflow>/langgraph.json` for each discovered workflow if missing
- stop creating `.maw/templates/`
- preserve existing files on rerun

### `maw-cli dev <workflow>`

This command should:

- require a workflow argument
- resolve MAW scope from the nearest ancestor containing `.maw/`
- validate that `.maw/graphs/<workflow>/` exists
- validate that `.maw/graphs/<workflow>/opencode.json` exists and passes the workflow package's validator before runtime launch
- set `OPENCODE_CONFIG` to the workflow-local `opencode.json`
- in TTY mode, launch the bundled opencode runtime directly and start on `planner`
- in non-TTY mode, launch the same bundled opencode runtime in server-only mode so SDK harnesses can drive the workflow headlessly
- when the user explicitly asks the approved planner session to execute, hand the active workflow off to `manager`
- fail clearly if validation fails or the bundled runtime cannot start

### Retained headless LangGraph compatibility path

Phase 6 keeps one separate compatibility surface for direct LangGraph smoke and `/runs/wait` requests.

Command:

```text
bunx @langchain/langgraph-cli dev --config .maw/graphs/<workflow>
```

Rules:

- this path stays available for compatibility tests and smoke logs only
- it is not the primary interactive workflow UX after Phase 6
- it must remain runnable after `config.json` / Nunjucks retirement
- it does not need full planner/manager parity in Phase 6

### `maw-cli ov:server` and `maw-cli ov:index`

Phase 4 keeps live OpenViking execution inside `maw-cli` so MAW can resolve `.maw/ov.conf` placeholders before invoking upstream binaries.

`maw-cli ov:server` should:

- parse `.maw/ov.conf`
- resolve `${VAR}` placeholders from the current process environment first and the MAW-scope local `.env` as fallback
- load that `.env` file explicitly for placeholder resolution instead of relying on Bun auto-loading
- write a resolved temp config outside the checked-in project files
- invoke `openviking-server --config <resolved-temp-config>`
- fail clearly when required placeholders are unresolved

`maw-cli ov:index` should:

- set `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf`
- invoke upstream `openviking add-resource`
- default to the current working directory when the caller omits the target path
- pass through any additional caller-supplied flags such as `--wait`
- continue relying on upstream non-strict unsupported-file handling unless the caller opts into stricter flags

Examples:

```text
bunx maw-cli ov:server
bunx maw-cli ov:index
bunx maw-cli ov:index src --wait
```

## Interactive Workflow Model

### `planner` / `manager` / `coder`

The default Phase 6 interactive base workflow is:

- `planner` — primary interactive planning agent
- `manager` — primary interactive execution agent
- `coder` — hidden subagent used by `manager`

Required behavior:

- `planner` starts the workflow in planning mode
- `planner` may analyze and ask questions immediately, but may only write plan documents after explicit user approval plus an explicit repo-relative destination path
- an explicit execute request hands the approved plan off to `manager`
- `manager` executes one phase step at a time through `coder`
- `manager` auto-commits clean results only when the executed step is complete, verification passed, and no unresolved issue remains
- `coder` implements scoped step work, verifies it, writes step logs, and never commits

### Workflow-local opencode config model

The workflow config model is now:

- workflow-local prompt, context, permission, and model/provider configuration lives directly in `.maw/graphs/<workflow>/opencode.json`
- the file uses raw opencode schema only
- the workflow package validator enforces the required base-workflow topology and any permission baselines the workflow needs
- there is no project-level prompt-composition file anymore
- `.maw/templates/`, Nunjucks prompt composition, and `maw-cli prompt:*` are retired

This keeps the runtime inspectable by reading one workflow-local `opencode.json` file directly.

## MVP Definition

The MVP for this initiative is not just scaffolding and runtime launch.

The MVP is reached when a workflow built from this template can be installed into a target project and then:

- launch `maw-cli dev <workflow>` into the bundled opencode runtime on `planner`
- write initiative or phase plan documents only after explicit approval plus an explicit repo-relative path
- hand approved execution off from `planner` to `manager`
- have `manager` execute a clean `tasks.md` step through hidden `coder` subagents and auto-commit clean results
- inspect and modify the target project's codebase through opencode-backed file, shell, and git-adjacent actions under workflow permissions
- retrieve shared OpenViking context for that MAW scope
- be manually exercised in a disposable target project end to end and separately through the retained LangGraph compatibility smoke path

Concretely, the shipped base workflow must be able to operate on the target project's codebase in the same broad class of tasks as a coding workflow:

- list files and directories
- read target-project files
- create and edit files
- perform targeted updates
- search for files and text
- run allowed shell commands
- run allowed git commands
- surface resulting code changes through status or diff output
- execute a clean phase step and auto-commit it when the workflow contract says it is safe

Anything beyond that baseline is post-MVP.

## Post-MVP Follow-On

- runtime-backed skills remain tracked separately in `docs/agents/initiatives/queued/runtime-backed-skills/plan.md`
- additional helper-agent topologies beyond the default `planner` / `manager` / hidden `coder` workflow
- any return to shared prompt-template systems or workflow-local prompt-file hierarchies beyond raw `opencode.json`
- a shared project-wide opencode config spanning multiple workflows
- Phase 7 may reintroduce an OpenViking retrieval toggle only if the right contract emerges through a custom install option or workflow-local configuration instead of a project-root `maw.json`

## Current State Assessment

The earlier Phase 4 OpenViking contract conflicts are resolved by the completed wrapper, init, docs, and smoke work.

The remaining implementation gaps called out by this plan are now:

- the shipped workflow still assumes `.maw/graphs/<workflow>/config.json`, `.maw/templates/`, and Nunjucks prompt composition
- `maw-cli dev <workflow>` still shells only to LangGraph and cannot launch the bundled opencode interactive or server-only runtime
- the current base workflow still centers on a headless `planner -> coder` graph instead of the interactive `planner -> manager -> coder` contract
- target projects do not yet get a workflow-local raw `opencode.json` plus workflow-owned validation contract

## Execution Plan

### Phase 0: Plan Realignment

- [x] complete

- finalize the architecture decisions in this document
- treat conflicting older phase notes as superseded by this plan
- regenerate downstream task docs from this plan before starting broad implementation

### Phase 1: `maw-cli` targeted refactor

- [x] complete

- move project-level config handling from `.maw/config.json` to `maw.json`
- move `ov.conf` ownership into `maw-cli`
- revise `init` to create the new target-project scaffold
- revise `dev` to require a workflow argument
- remove `start` from the `maw-cli` command surface
- generate workflow-local `langgraph.json` files from `maw-cli`
- add test coverage for multi-workflow scaffolding and isolated execution
- update smoke tests to exercise the standalone `maw-cli` flow

### Phase 2: `langgraph-ts-template` targeted refactor

- [x] complete
- note: the Phase 2 `config.json` prompt surface shipped successfully at the time, but Phase 6 now supersedes it with raw workflow-local `opencode.json`

- remove the `maw-cli` dependency from the workflow template
- shrink the scaffold contract to workflow-owned files only
- add a workflow-local `config.json` scaffold asset for agent/skill declarations
- update runtime config loading to read `maw.json` plus the workflow-local graph config
- expose whatever metadata `maw-cli prompt:preview` needed to locate embedded templates
- remove template-side references to the retired `start` command
- update tests to reflect the new scaffold contract

### Phase 3: Prompt management commands

- [x] complete
- note: this phase landed under the older prompt-composition contract and is now retired by the Phase 6 runtime reset

- implement `maw-cli prompt:list <workflow>`
- implement `maw-cli prompt:preview <workflow> <agent>`
- add manual smoke verification via `maw-smoke/README.md` that proves prompt composition and custom template overrides are working against locally installed repo checkouts
- close any gap between fixture coverage and installed-package prompt-command behavior before marking the phase complete

### Phase 4: OpenViking integration

- [x] complete

- keep OpenViking configuration project-wide in `.maw/ov.conf` and `.maw/ovcli.conf`
- remove the old project-root config surface from the active contract while keeping OpenViking project-scoped
- keep `ov:init` retired, but move `ov:server` and `ov:index` runtime responsibility back into `maw-cli`
- stop seeding target-project OpenViking runtime scripts; target projects should invoke `maw-cli ov:*` directly
- default `maw-cli ov:index` to the current working directory when no target path is supplied and pass any additional flags straight through to upstream `openviking add-resource`
- resolve `.maw/ov.conf` `${VAR}` placeholders inside `maw-cli` before launching upstream OpenViking processes
- verify that all workflows in one MAW scope continue to share the same project-level OpenViking storage and config
- keep OpenViking model/provider config out of workflow-specific config
- keep live graph-time OpenViking retrieval out of Phase 4 and land it in Phase 7

### Phase 5: Base workflow foundation

- [x] complete
- note: Phase 5 remains the retained headless LangGraph compatibility foundation, but it is no longer the primary interactive runtime after Phase 6

- replace the current hardcoded graph stub with a real LLM-backed `planner` -> `coder` base workflow that captures `plannerPrompt`, `coderPrompt`, and a non-empty `handoff`
- wire OpenAI `gpt-4.1-mini` as the initial shared package-owned model provider for both nodes
- build the graph manually with `StateGraph` instead of using `createReactAgent`
- prove that edited `.maw/graphs/<workflow>/config.json.prompts` plus runtime context drove live prompt injection during smoke verification under the old contract

### Phase 6: Opencode interactive runtime

- [ ] complete

- replace workflow-local `config.json` and Nunjucks prompt composition with workflow-local raw `opencode.json`
- ship planner and manager as the default visible primary agents, plus hidden `coder`, in the base workflow
- bundle the opencode runtime via `maw-cli` and teach `maw-cli dev <workflow>` to launch planner-first interactive and server-only runtime flows from workflow-local `opencode.json`
- validate edited workflow-local `opencode.json` against the workflow package schema and fail clearly on invalid workflow config
- retire `maw-cli prompt:list`, `maw-cli prompt:preview`, and `.maw/templates/` from the active MVP contract
- keep `graph.ts` and `langgraph.json` as the separate retained LangGraph compatibility and smoke path
- add verification coverage that proves both planner and manager interactive flows plus the retained `/runs/wait` compatibility path

### Phase 7: Runtime OpenViking retrieval MVP

- **NOTE:** treat this phase as the MVP gate for the combined `maw-cli` + workflow-template system

- [ ] complete

- consume the shared Phase 4 OpenViking index from the shipped workflow runtime after the Phase 6 opencode contract lands
- wire runtime retrieval into the interactive workflow while keeping retained compatibility verification aligned where needed
- add verification coverage proving the workflow can combine opencode-backed codebase actions with shared OpenViking retrieval
- add smoke coverage proving the full runtime path works end to end in a target project

## Verification Gates

### `maw-cli`

- `bun run build`
- `bun run lint`
- `bun run test`
- manual smoke via `maw-smoke/README.md` covering `init`, `dev <workflow>` in TTY mode, `dev <workflow>` in non-TTY server-only mode, `ov:server`, and `ov:index`

### `langgraph-ts-template`

- `bun run build`
- `bun run typecheck`
- `bun run test`
- `bun run test:int`
- scaffold tests covering workflow-local `graph.ts` and `opencode.json`

### Smoke methodology

Smoke verification runs from `../maw-smoke/` following `README.md`.

- run `bun smoke-init <test-slug>` to create `tests/smoke-<test-slug>/`
- the initializer must install local checkout paths for `../maw-cli` and workflow packages so uncommitted changes can be exercised without pushing
- from that disposable target project, run `bunx maw-cli init` and the relevant `bunx maw-cli ...` verification commands manually
- for retained LangGraph compatibility smoke, run `bunx @langchain/langgraph-cli dev --config .maw/graphs/<workflow>` directly from the disposable target project
- log results, issues, and fixes to `../maw-smoke/docs/agents/smoke-logs/<test-slug>.md`

### Cross-repo acceptance checks

- `maw-cli init` requires a target-project `package.json`; if it is missing, the command fails loudly instead of guessing where installed workflows should be discovered
- `maw-cli init` with no installed workflows still creates `.maw/graphs/`, `.maw/ov.conf`, and `.maw/ovcli.conf`, then warns
- `maw-cli init` no longer creates `.maw/templates/`
- each installed workflow gets `.maw/graphs/<workflow>/graph.ts`, `.maw/graphs/<workflow>/opencode.json`, and `.maw/graphs/<workflow>/langgraph.json`
- `.maw/graphs/<workflow>/config.json` is no longer scaffolded
- `.maw/graphs/<workflow>/opencode.json` uses raw opencode schema and ships the default base-workflow topology: `planner` and `manager` visible, hidden `coder`, `default_agent: "planner"`
- invalid edited `.maw/graphs/<workflow>/opencode.json` fails before `maw-cli dev <workflow>` launches the runtime
- `maw-cli` help advertises `ov:server` and `ov:index`, but not `ov:init`, `prompt:list`, or `prompt:preview`
- `maw-cli dev <workflow>` launches bundled opencode with `OPENCODE_CONFIG` pointing at the workflow-local `opencode.json`
- an interactive TTY run starts on `planner`
- an explicit execute request hands the active workflow off to `manager`
- a non-TTY `maw-cli dev <workflow>` run exposes the same workflow through a server-only opencode path that an SDK question harness can drive
- `manager` can delegate work to hidden `coder` subagents and auto-commit clean results
- the retained direct LangGraph compatibility path still runs from `.maw/graphs/<workflow>/langgraph.json`
- `.maw/graphs/<workflow>/langgraph.json` points at `./graph.ts:graph` and `../../../.env`
- `.maw/graphs/<workflow>/langgraph.json` omits `dependencies`
- there is no project-root `maw.json`; MAW scope is detected from the nearest ancestor containing `.maw/`
- `.maw/ov.conf` is still seeded with loopback host/port plus the OpenAI-backed dense-embedding and VLM defaults, and it keeps `${OPENAI_API_KEY}` literal for `maw-cli ov:server` to resolve at runtime
- `.maw/ovcli.conf` is seeded with `http://localhost:1933` and preserved on rerun instead of being regenerated from any project-root config file
- `maw-cli init` still does not mutate the target project's `package.json` for OpenViking runtime wiring
- `bunx maw-cli ov:server` resolves `.maw/ov.conf` placeholders from the current process environment first and the MAW-scope local `.env` as fallback, loaded explicitly rather than through Bun auto-loading, before launching upstream OpenViking
- `bunx maw-cli ov:index . --wait` and `bunx maw-cli ov:index package.json --wait` use the project-local `.maw/ovcli.conf` instead of the operator's global OpenViking CLI config
- all workflows in one MAW scope share the same `.maw/openviking/` storage, `.maw/ov.conf`, and `.maw/ovcli.conf`; live retrieval is verified in Phase 7
- the interactive workflow can list, read, create, and edit files in the target project through opencode-backed actions under the workflow's permission rules
- the interactive workflow can execute allowed shell and git commands and surface resulting code changes through status or diff output

## Execution Order

```text
Phase 0 (plan realignment)
   → Phase 1 (maw-cli targeted refactor)
      → Phase 2 (langgraph-ts-template targeted refactor)
         → Phase 3 (prompt management commands)
            → Phase 4 (OpenViking integration)
               → Phase 5 (base workflow foundation)
                  → Phase 6 (opencode interactive runtime)
                     → Phase 7 (runtime OpenViking retrieval MVP)
```

After the targeted refactors land, follow-on implementation can run in parallel where safe, but planning and sequencing should still begin with `maw-cli` and move into the workflow template.

Runtime-backed skills are planned separately as a post-MVP initiative.

## Installation Model

The location where `maw-cli init` runs defines MAW scope.

- Run `maw-cli init` at a monorepo root when every workflow should share one root-scoped `.maw/` plus OpenViking database.
- Run `maw-cli init` inside a specific workspace when MAW/OpenViking should stay local to that workspace.
- A single root config managing multiple child workspaces is out of scope for this MVP.
- The MAW scope root must already contain a target-project `package.json` because `maw-cli init` discovers installed workflow packages there.

Workflow packages are installed into target projects via git URL or other standard package distribution mechanisms.

Example:

```bash
bun add coding@git+https://github.com/org/coding.git
```

`maw-cli` is installed separately and bundles the opencode runtime dependency required for `dev`.

Examples:

```bash
bunx maw-cli init
bunx maw-cli dev coding
bunx maw-cli ov:server
bunx maw-cli ov:index . --wait
bunx @langchain/langgraph-cli dev --config .maw/graphs/coding
```

The final command above is retained only for the separate LangGraph compatibility and smoke path. It is not the primary interactive runtime surface after Phase 6.
