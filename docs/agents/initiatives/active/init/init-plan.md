# MAW (Model Accelerated Workflow) — Initialization Plan

## Status Reset

This plan supersedes earlier architecture decisions that over-centered `maw-cli` as the OpenViking runtime surface.

The current direction is now:

- `maw-cli` is a standalone bootstrap and inspection tool, not a transitive workflow dependency.
- `maw-cli` owns project-level MAW bootstrap plus seeding target-project runtime scripts.
- Workflow packages built from this template only own workflow-specific runtime assets.
- Target-project `package.json` scripts are the primary OpenViking runtime surface in Phase 4.
- `maw-cli dev <workflow>` remains the current workflow runner through Phase 4; broader workflow-execution realignment is deferred to Phase 5.
- OpenViking is configured once per target project and shared by every installed workflow.
- Skills and prompts are configured deterministically, not discovered by autoloading at runtime.
- MAW scope is defined by the directory containing `maw.json`; it is not redirected through a configurable workspace path.
- `maw-cli` seeds both the project-local OpenViking server config (`.maw/ov.conf`) and the project-local OpenViking CLI config (`.maw/ovcli.conf`).
- `maw-cli` no longer exposes `ov:init` or `ov:index` in the MVP command surface; target projects run `maw:ov:server` and `maw:ov:index` directly.
- Phase 4 stops at OpenViking bootstrap, target-project runtime scripts, indexing, and shared-database verification. Live graph-time retrieval lands in Phase 5.

Still valid from earlier work:

- Bun migration
- Vitest migration
- Changesets and versioning workflow
- Workflow packages being installable npm/git packages
- Nunjucks-based prompt composition inside workflows

The earlier reset items above are now largely resolved by Phases 1-3.

The remaining alignment work is now:

- removing `maw.json.workspace` plus `maw.json.openviking.host/port` from the live contract
- replacing placeholder `ov:*` commands with the Phase 4 target-project script model
- adding project-local `.maw/ovcli.conf` and seeded `package.json` MAW scripts
- replacing template-side OpenViking stubs and the graph stub during Phases 4-5

## Finalized Decisions

- `maw-cli` is installed and invoked separately from workflow packages.
- Workflow packages do not carry `maw-cli` as a dependency.
- A target-project `package.json` is required at the MAW scope root because `maw-cli init` seeds project-local runtime scripts there.
- The target project root config file is `maw.json`.
- `maw.json` contains literal project settings only; it does not support env var interpolation.
- MAW scope is the directory containing `maw.json`.
- `maw.json` does not contain a `workspace` field.
- `maw.json.openviking` is a boolean toggle for graph-time retrieval only.
- `maw.json` does not carry OpenViking host or port settings.
- OpenViking remains per-project, not per-workflow.
- `.maw/openviking/` is the project-local OpenViking storage location for that MAW scope.
- `.maw/ov.conf` is the project-local OpenViking server config authority.
- `.maw/ov.conf` seeds OpenAI-backed dense-embedding and VLM defaults, and the scaffold keeps `${OPENAI_API_KEY}` literal for OpenViking to resolve.
- `.maw/ovcli.conf` is the project-local OpenViking client/runtime URL authority and stores no secrets.
- `maw-cli init` seeds missing `package.json` scripts `maw:ov:server` and `maw:ov:index`; if either script already exists with different content, it warns and preserves the existing value.
- `maw-cli init` seeds matching default OpenViking files once, but reruns do not reconcile later drift between `maw.json`, `.maw/ov.conf`, `.maw/ovcli.conf`, or target-project script entries.
- The exact seeded OpenViking script values are:
  - `maw:ov:server` → `openviking-server --config .maw/ov.conf`
  - `maw:ov:index` → `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource`
- `maw:ov:index` requires an explicit target path at invocation time, for example `bun run maw:ov:index -- .` or `bun run maw:ov:index -- src`.
- `maw:ov:index` relies on upstream OpenViking defaults: it does not pass `--strict`, so unsupported files are skipped by upstream non-strict behavior.
- `openviking: false` in `maw.json` disables graph-time retrieval only; it does not block target-project indexing scripts.
- The target project's workflow runtime files live under `.maw/graphs/<workflow>/`.
- Each workflow directory contains its own `graph.ts`, `config.json`, and `langgraph.json`.
- `maw-cli` intentionally generates each workflow's `langgraph.json` because it owns the target-project scaffold conventions and LangGraph CLI invocation.
- Workflow packages scaffold only workflow-specific files.
- `maw-cli dev <workflow>` executes a single workflow in isolation through Phase 4.
- `maw-cli` does not expose `ov:init`, `ov:index`, or `start` in the MVP command surface.
- Docker-backed LangGraph launch is out of scope for this initiative's MVP.
- `maw-cli init` bootstraps project-level MAW files even when no workflows are installed yet and warns instead of failing.
- `maw-cli init` only appends `.maw/openviking/` to `.gitignore`.
- Agent skill selection lives in each workflow's `.maw/graphs/<workflow>/config.json`.
- The base workflow template must be able to work on the target project's codebase before MVP is considered complete.
- The default base workflow agents are `planner` and `coder`.
- Shell execution for the base codebase workflow is restricted to an allow-list.
- Custom template overrides live in `.maw/templates/` at the project level.
- Prompt/skill injection must be deterministic and inspectable before execution.
- Runtime-backed skills are post-MVP and tracked in a separate queued initiative.

## Architecture

```
┌──────────────────────────────────────────────┐
│  REPO: maw-cli                               │
│  Standalone bootstrap / inspection package   │
│  Owns: init, dev, prompt:*                   │
│  Seeds: maw.json, ov.conf, ovcli.conf,       │
│         langgraph.json, package.json scripts │
└──────────────────────────────────────────────┘
                    │
                    │ bootstraps target-project MAW files
                    ▼
┌──────────────────────────────────────────────┐
│  TARGET PROJECT                              │
│  package.json                                │
│    scripts: maw:ov:server, maw:ov:index      │
│  maw.json                                    │
│  .maw/templates/                             │
│  .maw/graphs/<workflow>/                     │
│    graph.ts                                  │
│    config.json                               │
│    langgraph.json                            │
│  .maw/ov.conf                                │
│  .maw/ovcli.conf                             │
│  .maw/openviking/                            │
└──────────────┬───────────────────────┬───────┘
               │                       │
               │ runs upstream         │ installed workflows contribute
               │ OpenViking commands   │ their own runtime entrypoints
               ▼                       ▲
┌──────────────────────────────┐  ┌──────────────────────────────────────────┐
│  openviking-server           │  │  REPO: langgraph-ts-template             │
│  openviking add-resource     │  │  Template for workflow packages          │
└──────────────────────────────┘  │  Owns: graph runtime, prompt engine,     │
                                  │  embedded default snippets, scaffold     │
                                  │  files for one workflow                  │
                                  └──────────────────────────────────────────┘
```

## Responsibility Split

| Concern | Owner |
| --- | --- |
| target-project `package.json` | target project |
| `package.json#scripts.maw:ov:server` | `maw-cli` seeds it, target project owns final contents |
| `package.json#scripts.maw:ov:index` | `maw-cli` seeds it, target project owns final contents |
| `maw.json` | `maw-cli` creates it, target project owns later edits |
| `.maw/ov.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/ovcli.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/templates/` directory | `maw-cli` creates it, target project owns its contents |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |
| `.maw/graphs/<workflow>/graph.ts` | workflow package |
| `.maw/graphs/<workflow>/config.json` | workflow package |
| embedded default snippets | workflow package |
| prompt list / prompt preview commands | `maw-cli` |
| OpenViking server launch and indexing execution | target-project `package.json` scripts |
| agent model/provider wiring | workflow package |
| OpenViking context retrieval inside the graph | workflow package |

## Target Project Scaffold

`maw-cli init` should converge on this target-project layout:

```text
package.json
maw.json
.maw/
  templates/
  graphs/
    coding/
      graph.ts
      config.json
      langgraph.json
    code-agent/
      graph.ts
      config.json
      langgraph.json
  ov.conf
  ovcli.conf
  openviking/   # created by OpenViking on first successful index
```

### MAW scope

MAW scope is defined by the directory containing `maw.json`.

- Running `maw-cli init` at a monorepo root creates one MAW/OpenViking scope for that root.
- Running `maw-cli init` inside `packages/app` creates a workspace-local MAW/OpenViking scope inside that workspace.
- Relative MAW paths (`.maw/templates`, `.maw/graphs/<workflow>/`, `.maw/ov.conf`, `.maw/ovcli.conf`) and target-project package scripts resolve from that same scope root.
- Runtime/template callers that still pass a `workspacePath` variable to custom snippets derive `'.'` from the MAW scope root; it is no longer user-configurable in `maw.json`.

### `maw.json`

`maw.json` is the project-level MAW config.

It should stay small and only carry per-project settings:

- OpenViking retrieval enable/disable toggle
- custom templates path
- literal values only; no `${VAR}` interpolation

It should not carry:

- OpenViking host or port values
- workflow agent skill lists
- workflow prompt composition rules
- per-agent model/provider configuration

Proposed shape:

```json
{
    "openviking": true,
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

Workflow runtimes may fall back to built-in project defaults only when `maw.json` is missing. If `maw.json` exists but is unreadable, malformed, or invalid, the workflow should fail loudly instead of silently replacing project settings with defaults.

### `.maw/ov.conf`

`.maw/ov.conf` is generated by `maw-cli` and configured once per target project.

- it configures the shared OpenViking database for the project
- it includes the server bind settings used by `maw:ov:server`
- it seeds the restored OpenAI-backed dense-embedding and VLM defaults used by the Phase 4 scaffold
- every installed workflow uses the same indexed project context
- it may use environment variable placeholders like `${OPENAI_API_KEY}` or any other `${VAR}` name supported by upstream config expansion
- the scaffold keeps `${OPENAI_API_KEY}` literal and lets OpenViking resolve it during config loading
- it should move out of the workflow template and into `maw-cli`

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

### `package.json` MAW scripts

`maw-cli init` seeds these missing scripts into the target project's `package.json`:

```json
{
    "scripts": {
        "maw:ov:server": "openviking-server --config .maw/ov.conf",
        "maw:ov:index": "OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource"
    }
}
```

Rules:

- `maw:ov:server` is the explicit Phase 4 server start path
- `maw:ov:index` requires an explicit target path at invocation time
- additional OpenViking flags are passed through by the caller, for example `bun run maw:ov:index -- . --wait`
- if either script already exists with different content, `maw-cli init` emits a `Warning:` and preserves the existing value

### `.maw/graphs/<workflow>/graph.ts`

This file is generated from the workflow package's scaffold export.

It is the workflow-specific LangGraph entry point in the target project.

Example shape:

```ts
import { createGraph } from 'coding';

export const graph = createGraph({ workflow: 'coding' });
```

### `.maw/graphs/<workflow>/config.json`

This file is generated from the workflow package's scaffold export.

It is the workflow-specific agent/skill config and should contain no secrets.

Proposed shape:

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

This workflow-local prompt config is optional and may be partial:

- missing keys inherit the workflow package defaults
- explicit empty arrays also inherit the workflow package defaults
- invalid `config.json` or configured snippet names that cannot be resolved should trigger a loud warning and a fallback to the workflow package defaults rather than breaking execution

### `.maw/graphs/<workflow>/langgraph.json`

This file is generated by `maw-cli`, not by the workflow package.

This is intentional because:

- `maw-cli` owns the target-project path convention `.maw/graphs/<workflow>/`
- `maw-cli` is the tool invoking `langgraphjs`
- each workflow should be runnable in isolation via `--config .maw/graphs/<workflow>`

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

- the workflow runtime API, including `createGraph`
- embedded default Nunjucks snippets
- a `./scaffold` export that describes only workflow-owned target-project files and includes `scaffold.workflow` as the short workflow id used by `maw-cli dev <workflow>`

The scaffold contract should be revised so the workflow package contributes:

- `.maw/graphs/<workflow>/graph.ts`
- `.maw/graphs/<workflow>/config.json`
- a published path to its embedded default templates for prompt preview / prompt composition tooling

The workflow package should not contribute:

- `maw.json`
- `.maw/ov.conf`
- `.maw/graphs/<workflow>/langgraph.json`
- any direct dependency on `maw-cli`

## Command Surface

The MVP command surface is now split between `maw-cli` bootstrap/inspection commands and target-project runtime scripts.

### `maw-cli`

```text
maw-cli init
maw-cli dev <workflow>
maw-cli prompt:list <workflow>
maw-cli prompt:preview <workflow> <agent>
```

### target-project `package.json` scripts

```text
bun run maw:ov:server
bun run maw:ov:index -- <target-path> [openviking args...]
```

### `maw-cli init`

`maw-cli init` should:

- require a target-project `package.json` at the MAW scope root
- create `maw.json` if missing
- create `.maw/templates/`
- create `.maw/graphs/`
- create `.maw/ov.conf` if missing
- create `.maw/ovcli.conf` if missing
- append `.maw/openviking/` to `.gitignore` if missing
- add missing `package.json` scripts `maw:ov:server` and `maw:ov:index`
- warn and preserve existing `maw:ov:*` script values when they differ from the seeded defaults
- discover installed workflow packages via the `./scaffold` export contract
- if no workflow packages are installed yet, still create the project-level scaffold and warn
- create `.maw/graphs/<workflow>/graph.ts` for each discovered workflow if missing
- create `.maw/graphs/<workflow>/config.json` for each discovered workflow if missing
- generate `.maw/graphs/<workflow>/langgraph.json` for each discovered workflow if missing
- preserve existing files on rerun

### `maw-cli dev <workflow>`

This command should:

- require a workflow argument
- validate that `maw.json` exists
- validate that `.maw/graphs/<workflow>/` exists
- validate that the workflow-specific `graph.ts`, `config.json`, and `langgraph.json` exist
- invoke `langgraphjs dev --config .maw/graphs/<workflow>`

This remains the current workflow runner through Phase 4. Phase 5 may revisit the broader execution surface once the real codebase workflow exists.

### target-project OpenViking scripts

Phase 4 intentionally keeps OpenViking execution thin and direct.

`maw:ov:server` should:

- run `openviking-server --config .maw/ov.conf`
- be the explicit server-start path for the target project

`maw:ov:index` should:

- set `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf`
- invoke upstream `openviking add-resource`
- require the caller to provide an explicit target path
- rely on upstream defaults for env-placeholder resolution and non-strict unsupported-file handling
- accept additional caller-supplied flags such as `--wait`

Examples:

```text
bun run maw:ov:index -- .
bun run maw:ov:index -- src --wait
```

Phase 4 no longer gives `maw-cli` its own OpenViking runtime command. Server lifecycle, indexing flags, and any future advanced orchestration stay on the target-project script surface unless a later phase deliberately changes that.

### `maw-cli prompt:list <workflow>`

This command should:

- read `.maw/graphs/<workflow>/config.json`
- list each agent and its configured skills in order

### `maw-cli prompt:preview <workflow> <agent>`

This command should:

- read `maw.json`
- read `.maw/graphs/<workflow>/config.json`
- load the workflow package's embedded default snippets
- apply `.maw/templates/` overrides when a snippet with the same name exists
- render the composed system prompt for the requested agent
- print the final rendered prompt

This command is the primary inspection tool for verifying that prompt injection is working as intended.

## Prompt and Skill Model

The prompt model should now be:

- workflow-specific skill selection lives in `.maw/graphs/<workflow>/config.json`
- custom snippet overrides live in `.maw/templates/`
- embedded workflow defaults live inside the installed workflow package
- prompt composition order is deterministic and declared in config
- prompt composition happens before the workflow executes, not via autoloading decisions made by the model

This keeps prompts inspectable and predictable.

### Workflow isolation vs template sharing

The plan intentionally separates two concerns:

- which skills an agent gets is workflow-specific
- what a skill named `security` renders to can be globally overridden for the target project via `.maw/templates/security.njk`

If workflow-specific template-body overrides are needed later, that can be added as a follow-on feature. It is not required for this refactor.

## MVP Definition

The MVP for this initiative is not just scaffolding and prompt composition.

The MVP is reached when a workflow built from this template can be installed into a target project and then:

- inspect the target project's codebase
- retrieve shared OpenViking context for that project
- use deterministic planner/coder prompts
- run a controlled tool loop against the target project
- be manually exercised in a test project end-to-end

Concretely, the base workflow must be able to operate on the target project's codebase in the same broad class of tasks as a coding workflow:

- read files
- write files
- perform targeted edits
- list directories
- glob for files
- grep file contents
- run allowed shell commands
- run allowed git commands

Anything beyond that baseline is post-MVP.

## Post-MVP Follow-On

Runtime-backed skills are intentionally out of scope for this MVP plan.

They are tracked separately in:

- `docs/agents/initiatives/queued/runtime-backed-skills/plan.md`

## Current State Assessment

These parts of the current implementation conflict with the finalized architecture and need revision:

- `maw-cli init` still scaffolds `maw.json.workspace` and `maw.json.openviking.host/port` even though MAW scope is now defined by the directory containing `maw.json` and host/port authority moved into `.maw/ov.conf` + `.maw/ovcli.conf`
- `maw-cli init` does not yet scaffold `.maw/ovcli.conf` or seed target-project `package.json` scripts `maw:ov:server` and `maw:ov:index`
- `maw-cli` still exposes placeholder `ov:init` and `ov:index` commands instead of the finalized bootstrap-only CLI surface plus target-project OpenViking scripts
- `maw-cli prompt:preview` and `langgraph-ts-template/src/agent/graph.ts` still read `workspace` from `maw.json` instead of deriving scope-root semantics from the MAW scope itself
- `langgraph-ts-template/src/openviking/*` still contains stub contracts instead of concrete project-config and client plumbing for Phase 5 consumption
- the current graph is still a stub that returns a hardcoded greeting
- no project-local OpenViking smoke coverage proves the target-project `maw:ov:*` script flow against the current `maw-cli` scaffold

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

- remove the `maw-cli` dependency from the workflow template
- shrink the scaffold contract to workflow-owned files only
- add a workflow-local `config.json` scaffold asset for agent/skill declarations
- update runtime config loading to read `maw.json` plus the workflow-local graph config
- expose whatever metadata `maw-cli prompt:preview` needs to locate embedded templates
- remove template-side references to the retired `start` command
- update tests to reflect the new scaffold contract

### Phase 3: Prompt management commands

- [x] complete

- implement `maw-cli prompt:list <workflow>`
- implement `maw-cli prompt:preview <workflow> <agent>`
- add manual smoke verification via `maw-smoke/README.md` that proves prompt composition and custom template overrides are working against locally installed repo checkouts
- close any gap between fixture coverage and installed-package prompt-command behavior before marking the phase complete

### Phase 4: OpenViking integration

- [ ] complete

- keep OpenViking configuration project-wide in `.maw/ov.conf` and `.maw/ovcli.conf`
- shrink `maw.json.openviking` to a boolean retrieval toggle and remove `workspace`, host, and port from the live project config contract
- remove `maw-cli ov:init` and `maw-cli ov:index` from the command surface
- make `maw-cli init` seed target-project `package.json` scripts `maw:ov:server` and `maw:ov:index`
- require explicit target paths for `maw:ov:index` and pass any additional flags straight through to upstream `openviking add-resource`
- rely on upstream OpenViking config/env handling instead of wrapping indexing in extra `maw-cli` lifecycle logic
- verify that all workflows in one MAW scope continue to share the same project-level OpenViking storage and config
- keep OpenViking model/provider config out of workflow-specific config
- keep live graph-time OpenViking retrieval out of Phase 4 and land it in Phase 5
- keep change-aware reindex heuristics, server orchestration helpers, or prepare-script automation out of MVP scope, but preserve them as future OpenViking optimizations if the thin-script surface proves insufficient

### Phase 5: Base codebase workflow MVP

- **NOTE:** treat this phase as the MVP gate for the combined `maw-cli` + workflow-template system

- [ ] complete

- re-evaluate whether `maw-cli dev <workflow>` remains the right workflow-execution surface once the real codebase workflow exists, instead of assuming the current `langgraphjs dev` wrapper is the final runner
- replace the current hardcoded graph stub with a real LLM-backed coding workflow
- wire OpenAI as the initial model provider for the base template workflow
- build the graph loop manually instead of using `createReactAgent`
- add filesystem tools using MCP adapters plus the MCP filesystem server
- add shell execution using LangChain community tooling
- support git operations through the controlled shell tool set
- restrict shell and git execution to an allow-list suitable for local development workflows
- update the workflow-local default agent config to `planner` and `coder`
- consume the shared Phase 4 OpenViking index from graph runtime code
- add verification coverage for file creation, file updates, and targeted edits in the target project
- add verification coverage showing those edits are visible through allowed git commands
- add smoke coverage proving the base workflow can inspect and act on a target project's codebase

## Verification Gates

### `maw-cli`

- `bun run build`
- `bun run lint`
- `bun run test`
- manual smoke via `maw-smoke/README.md` covering `init`, `dev <workflow>`, `prompt:list`, `prompt:preview`, `maw:ov:server`, and `maw:ov:index`

### `langgraph-ts-template`

- `bun run build`
- `bun run typecheck`
- `bun run test`
- `bun run test:int`
- scaffold tests covering workflow-local `graph.ts` and `config.json`

### Smoke methodology

Smoke verification runs from `../maw-smoke/` following `README.md` and `docs/agents/smoke-tests.md`.

- run `bun smoke-init <test-slug>` to create `tests/smoke-<test-slug>/`
- the initializer must install local checkout paths for `../maw-cli` and workflow packages so uncommitted changes can be exercised without pushing
- from that disposable target project, run `bunx maw-cli init` and the relevant `bunx maw-cli ...` / `bun run maw:ov:* ...` verification commands manually
- log results, issues, and fixes to `../maw-smoke/docs/agents/smoke-logs/<test-slug>.md`

### Cross-repo acceptance checks

- `maw-cli init` requires a target-project `package.json`; if it is missing, the command fails loudly instead of guessing where MAW scripts should live
- `maw-cli init` with no installed workflows still creates `maw.json`, `.maw/templates/`, `.maw/graphs/`, `.maw/ov.conf`, `.maw/ovcli.conf`, and seeded `maw:ov:*` scripts, then warns
- `.maw/ov.conf` is seeded with loopback host/port plus the restored OpenAI-backed dense-embedding and VLM defaults, and it keeps `${OPENAI_API_KEY}` literal for OpenViking to resolve
- `.maw/ovcli.conf` is seeded with `http://localhost:1933` and preserved on rerun instead of being regenerated from `maw.json`
- a target project with two installed workflows gets two directories under `.maw/graphs/`
- `.gitignore` gets `.maw/openviking/` and does not add `maw.json`, `.maw/ov.conf`, or `.maw/ovcli.conf`
- `maw-cli dev coding` only uses `.maw/graphs/coding/langgraph.json`
- `.maw/graphs/coding/langgraph.json` points at `./graph.ts:graph` and `../../../.env`
- `.maw/graphs/coding/langgraph.json` omits `dependencies`
- `maw-cli prompt:list coding` shows the configured `planner` and `coder` skill order
- `maw-cli prompt:preview coding planner` prints the expected composed prompt
- a custom override in `.maw/templates/security.njk` is reflected in prompt preview
- `maw.json` no longer carries `workspace`, `openviking.host`, or `openviking.port`; `openviking` is a boolean retrieval toggle and MAW scope is defined by the directory containing the file
- `maw-cli` help no longer advertises `ov:init` or `ov:index`
- `package.json#scripts.maw:ov:server` is `openviking-server --config .maw/ov.conf`
- `package.json#scripts.maw:ov:index` is `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource`
- if `maw:ov:server` or `maw:ov:index` already exists with different content, `maw-cli init` emits `Warning:` and preserves the existing value
- `bun run maw:ov:index -- . --wait` and `bun run maw:ov:index -- package.json --wait` use the project-local `.maw/ovcli.conf` instead of the operator's global OpenViking CLI config
- setting `"openviking": false` in `maw.json` disables retrieval only; the target-project `maw:ov:index` script still runs unchanged
- all workflows in one MAW scope share the same `.maw/openviking/` storage, `.maw/ov.conf`, and `.maw/ovcli.conf`; live graph retrieval is verified in Phase 5
- the base workflow can list files in the target project through its tool loop
- the base workflow can read a target-project file and answer about it
- the base workflow can create a new file in the target project through its tool loop
- the base workflow can apply a targeted edit to an existing target-project file through its tool loop
- the base workflow can rewrite or update an existing target-project file through its tool loop
- the base workflow can execute an allowed shell or git command against the target project
- the base workflow can surface the resulting code changes through an allowed git status or diff command

## Execution Order

```text
Phase 0 (plan realignment)
   → Phase 1 (maw-cli targeted refactor)
      → Phase 2 (langgraph-ts-template targeted refactor)
         → Phase 3 (prompt management commands)
            → Phase 4 (OpenViking integration)
               → Phase 5 (base codebase agent MVP)
```

After the targeted refactors land, follow-on implementation can run in parallel where safe, but planning and sequencing should still begin with `maw-cli` and move into the workflow template.

Runtime-backed skills are planned separately as a post-MVP initiative.

## Installation Model

The location where `maw-cli init` runs defines MAW scope.

- Run `maw-cli init` at a monorepo root when every workflow should share one root-scoped `.maw/` + OpenViking database.
- Run `maw-cli init` inside a specific workspace when MAW/OpenViking should stay local to that workspace.
- A single root config managing multiple child workspaces is out of scope for this MVP.
- The MAW scope root must already contain a target-project `package.json` because `maw-cli init` seeds project-local runtime scripts there.

Workflow packages are installed into target projects via git URL or other standard package distribution mechanisms.

Example:

```bash
bun add coding@git+https://github.com/org/coding.git
```

`maw-cli` is installed separately and is not a workflow dependency.

Examples:

```bash
bunx maw-cli init
bun run maw:ov:server
bun run maw:ov:index -- . --wait
bunx maw-cli dev coding
```

or install it explicitly in the target project as a separate tool dependency if preferred.
