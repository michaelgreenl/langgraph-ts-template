# MAW (Model Accelerated Workflow) — Initialization Plan

## Status Reset

This plan supersedes the brief Phase 4 detour that tried to keep OpenViking runtime execution on the target-project script surface.

The current direction is now:

- `maw-cli` is a standalone bootstrap, inspection, and OpenViking runtime-wrapper tool, not a transitive workflow dependency.
- `maw-cli` owns project-level MAW bootstrap, `.maw/ov.conf` placeholder resolution, and OpenViking runtime execution.
- Workflow packages built from this template only own workflow-specific runtime assets.
- Phase 4 keeps project-scoped `.maw/ov.conf` / `.maw/ovcli.conf`, but moves `ov:server` and `ov:index` back into `maw-cli` instead of relying on target-project `package.json` scripts.
- `maw-cli dev <workflow>` remains the current workflow runner.
- OpenViking is configured once per target project and shared by every installed workflow.
- Skills and prompts are configured deterministically, not discovered by autoloading at runtime.
- MAW scope is defined by the directory containing `maw.json`; it is not redirected through a configurable workspace path.
- `maw-cli` seeds both the project-local OpenViking server config (`.maw/ov.conf`) and the project-local OpenViking CLI config (`.maw/ovcli.conf`).
- `maw-cli` exposes `ov:server` and `ov:index` for runtime execution; `ov:init` stays retired.
- Phase 4 stops at OpenViking bootstrap, `maw-cli`-owned runtime wrappers, indexing, and shared-database verification. Live graph-time retrieval lands after the base-workflow and opencode SDK phases.
- Downstream sequencing is now: Phase 5 base workflow foundation, Phase 6 opencode SDK integration, and Phase 7 runtime OpenViking retrieval.

Still valid from earlier work:

- Bun migration
- Vitest migration
- Changesets and versioning workflow
- Workflow packages being installable npm/git packages
- Nunjucks-based prompt composition inside workflows

The earlier reset items above are now resolved through Phase 4.

The remaining alignment work is now:

- replacing the current hardcoded graph stub with the Phase 5 base workflow
- integrating opencode-backed codebase actions in Phase 6
- landing live graph-time OpenViking retrieval in Phase 7

## Finalized Decisions

- `maw-cli` is installed and invoked separately from workflow packages.
- Workflow packages do not carry `maw-cli` as a dependency.
- A target-project `package.json` is required at the MAW scope root because `maw-cli init` discovers installed workflow packages there.
- The target project root config file is `maw.json`.
- `maw.json` contains literal project settings only; it does not support env var interpolation.
- MAW scope is the directory containing `maw.json`.
- `maw.json` does not contain a `workspace` field.
- `maw.json.openviking` is a boolean toggle for graph-time retrieval only.
- `maw.json` does not carry OpenViking host or port settings.
- OpenViking remains per-project, not per-workflow.
- `.maw/openviking/` is the project-local OpenViking storage location for that MAW scope.
- `.maw/ov.conf` is the project-local OpenViking server config authority.
- `.maw/ov.conf` seeds OpenAI-backed dense-embedding and VLM defaults, and the scaffold keeps `${OPENAI_API_KEY}` literal for `maw-cli ov:server` to resolve at runtime.
- `.maw/ovcli.conf` is the project-local OpenViking client/runtime URL authority and stores no secrets.
- `maw-cli init` seeds matching default OpenViking files once, but reruns do not reconcile later drift between `maw.json`, `.maw/ov.conf`, or `.maw/ovcli.conf`.
- `maw-cli init` does not mutate the target project's `package.json` for OpenViking runtime wiring.
- `maw-cli` exposes these OpenViking runtime commands:
  - `maw-cli ov:server`
- `maw-cli ov:index [target-path] [openviking args...]`
- `maw-cli ov:index` defaults to the current working directory when `target-path` is omitted; if the caller passes additional OpenViking flags, the target path must come before those flags, for example `bunx maw-cli ov:index . --wait` or `bunx maw-cli ov:index src --wait`.
- `maw-cli ov:server` resolves `${VAR}` placeholders in `.maw/ov.conf` from the current process environment first and the MAW-scope local `.env` as fallback, loads that `.env` file explicitly instead of relying on Bun auto-loading, uses the resolved values only for the temp config passed to upstream `openviking-server`, and fails clearly when required placeholders are unresolved.
- `maw-cli ov:index` points upstream `openviking add-resource` at `.maw/ovcli.conf`, defaults to the current working directory when `target-path` is omitted, and passes any additional caller-supplied flags straight through.
- `openviking: false` in `maw.json` disables graph-time retrieval only; it does not block `maw-cli ov:index`.
- The target project's workflow runtime files live under `.maw/graphs/<workflow>/`.
- Each workflow directory contains its own `graph.ts`, `config.json`, and `langgraph.json`.
- `maw-cli` intentionally generates each workflow's `langgraph.json` because it owns the target-project scaffold conventions and LangGraph CLI invocation.
- Workflow packages scaffold only workflow-specific files.
- `maw-cli dev <workflow>` executes a single workflow in isolation through Phase 4.
- `maw-cli` exposes `ov:server` and `ov:index`, but not `ov:init` or `start`, in the MVP command surface.
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
│  Standalone bootstrap / inspection /         │
│  OpenViking runtime-wrapper package          │
│  Owns: init, dev, prompt:*, ov:*             │
│  Seeds: maw.json, ov.conf, ovcli.conf,       │
│         langgraph.json                       │
└──────────────────────────────────────────────┘
                    │
                    │ bootstraps target-project MAW files
                    ▼
┌──────────────────────────────────────────────┐
│  TARGET PROJECT                              │
│  package.json                                │
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
               │ runs `maw-cli ov:*`   │ installed workflows contribute
               │ commands              │ their own runtime entrypoints
               ▼                       ▲
┌──────────────────────────────────┐  ┌──────────────────────────────────────────┐
│  maw-cli ov:server / ov:index    │  │  REPO: langgraph-ts-template             │
│  resolves ov.conf placeholders   │  │  Template for workflow packages          │
│  launches upstream OpenViking    │  │  Owns: graph runtime, prompt engine,     │
└───────────────┬──────────────────┘  │  embedded default snippets, scaffold     │
                ▼                     │  files for one workflow                  │
┌──────────────────────────────┐      └──────────────────────────────────────────┘
│  openviking-server           │
│  openviking add-resource     │
└──────────────────────────────┘
```

## Responsibility Split

| Concern | Owner |
| --- | --- |
| target-project `package.json` | target project |
| `maw.json` | `maw-cli` creates it, target project owns later edits |
| `.maw/ov.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/ovcli.conf` | `maw-cli` creates it, target project owns later edits |
| `.maw/templates/` directory | `maw-cli` creates it, target project owns its contents |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |
| `.maw/graphs/<workflow>/graph.ts` | workflow package |
| `.maw/graphs/<workflow>/config.json` | workflow package |
| embedded default snippets | workflow package |
| prompt list / prompt preview commands | `maw-cli` |
| OpenViking config parsing / `${VAR}` placeholder resolution | `maw-cli` |
| OpenViking server launch and indexing execution | `maw-cli` |
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
- Relative MAW paths (`.maw/templates`, `.maw/graphs/<workflow>/`, `.maw/ov.conf`, `.maw/ovcli.conf`) and `maw-cli ov:*` runtime commands resolve from that same scope root.
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
- it includes the server bind settings used by `maw-cli ov:server`
- it seeds the restored OpenAI-backed dense-embedding and VLM defaults used by the Phase 4 scaffold
- every installed workflow uses the same indexed project context
- it may use environment variable placeholders like `${OPENAI_API_KEY}` or any other `${VAR}` name supported by MAW's runtime resolver
- the scaffold keeps `${OPENAI_API_KEY}` literal and lets `maw-cli ov:server` resolve it at runtime from the current process environment first and the MAW-scope local `.env` as fallback
- `maw-cli` loads that `.env` file explicitly for placeholder resolution instead of relying on Bun auto-loading, and writes the resolved values only to the ephemeral temp config outside the project tree
- unresolved placeholders should fail clearly at runtime instead of being passed through literally to the upstream provider
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

### OpenViking runtime commands

Phase 4 uses `maw-cli` for live OpenViking execution rather than target-project `package.json` scripts.

Command surface:

```text
maw-cli ov:server
maw-cli ov:index [target-path] [openviking args...]
```

Rules:

- `maw-cli ov:server` is the explicit Phase 4 server start path
- `maw-cli ov:index` defaults to the current working directory when the caller omits `target-path`
- additional OpenViking flags are passed through by the caller; when flags are present, provide the target first, for example `bunx maw-cli ov:index . --wait`
- `.maw/ov.conf` placeholder resolution happens inside `maw-cli ov:server`, using process env first and MAW-scope local `.env` fallback, not inside the scaffolded file itself
- `.maw/ovcli.conf` remains the client/runtime URL authority used by `maw-cli ov:index`
- `maw-cli init` requires a target-project `package.json`, but it does not seed `maw:ov:*` scripts because the runtime surface is direct `maw-cli` execution
- `maw-cli ov:index` does not consult `maw.json.openviking`; setting `"openviking": false` only affects later graph-time retrieval

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

The MVP command surface now lives entirely on `maw-cli`; target projects no longer need MAW-owned OpenViking wrapper scripts in `package.json`.

### `maw-cli`

```text
maw-cli init
maw-cli dev <workflow>
maw-cli ov:server
maw-cli ov:index [target-path] [openviking args...]
maw-cli prompt:list <workflow>
maw-cli prompt:preview <workflow> <agent>
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
- read the target project's existing `package.json` for workflow discovery only; do not mutate it for OpenViking runtime wiring
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

Workflow-local or per-agent model/provider overrides are also deferred to post-MVP work because the right config shape depends on how opencode integration lands in the workflow runtime.

They are tracked separately in:

- `docs/agents/initiatives/queued/runtime-backed-skills/plan.md`

## Current State Assessment

The earlier Phase 4 OpenViking contract conflicts are now resolved by the completed wrapper, init, docs, and smoke work.

The remaining implementation gap called out by this plan is:

- the current graph is still a stub that returns a hardcoded greeting

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

- [x] complete

- keep OpenViking configuration project-wide in `.maw/ov.conf` and `.maw/ovcli.conf`
- shrink `maw.json.openviking` to a boolean retrieval toggle and remove `workspace`, host, and port from the live project config contract
- keep `ov:init` retired, but move `ov:server` and `ov:index` runtime responsibility back into `maw-cli`
- stop seeding target-project OpenViking runtime scripts; target projects should invoke `maw-cli ov:*` directly
- default `maw-cli ov:index` to the current working directory when no target path is supplied and pass any additional flags straight through to upstream `openviking add-resource`
- resolve `.maw/ov.conf` `${VAR}` placeholders inside `maw-cli` before launching upstream OpenViking processes
- verify that all workflows in one MAW scope continue to share the same project-level OpenViking storage and config
- keep OpenViking model/provider config out of workflow-specific config
- keep live graph-time OpenViking retrieval out of Phase 4 and land it in Phase 7
- keep change-aware reindex heuristics, advanced server orchestration helpers, or prepare-script automation out of MVP scope, but preserve them as future OpenViking optimizations if the wrapper-based surface proves insufficient

### Phase 5: Base workflow foundation

- [x] complete

- replace the current hardcoded graph stub with a real LLM-backed `planner` -> `coder` base workflow that captures `plannerPrompt`, `coderPrompt`, and a non-empty `handoff`
- wire OpenAI `gpt-4.1-mini` as the initial shared package-owned model provider for both nodes
- build the graph manually with `StateGraph` instead of using `createReactAgent`
- prove that edited `.maw/graphs/<workflow>/config.json.prompts` plus runtime context (`workspacePath` for both nodes and planner `handoff` for coder) drive live prompt injection during smoke verification, and do not treat planner/coder scaffold defaults as unfinished Phase 5 work

### Phase 6: Opencode SDK integration

- [ ] complete

- integrate the opencode SDK into the graph so codebase actions can rely on it instead of bespoke MAW-managed tool implementations where practical
- use the opencode SDK as the primary path for file inspection, editing, shell execution, and git-adjacent codebase actions inside the base workflow
- add verification coverage that proves the opencode-backed workflow can inspect and act on the target project's codebase

### Phase 7: Runtime OpenViking retrieval MVP

- **NOTE:** treat this phase as the MVP gate for the combined `maw-cli` + workflow-template system

- [ ] complete

- consume the shared Phase 4 OpenViking index from graph runtime code at agent-node runtime
- wire runtime context retrieval into the agent nodes after the base workflow and opencode SDK phases are in place
- add verification coverage proving the workflow can combine opencode-backed codebase actions with shared OpenViking retrieval
- add smoke coverage proving the full runtime path works end to end in a target project

## Verification Gates

### `maw-cli`

- `bun run build`
- `bun run lint`
- `bun run test`
- manual smoke via `maw-smoke/README.md` covering `init`, `dev <workflow>`, `prompt:list`, `prompt:preview`, `ov:server`, and `ov:index`

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
- from that disposable target project, run `bunx maw-cli init` and the relevant `bunx maw-cli ...` verification commands manually
- log results, issues, and fixes to `../maw-smoke/docs/agents/smoke-logs/<test-slug>.md`

### Cross-repo acceptance checks

- `maw-cli init` requires a target-project `package.json`; if it is missing, the command fails loudly instead of guessing where installed workflows should be discovered
- `maw-cli init` with no installed workflows still creates `maw.json`, `.maw/templates/`, `.maw/graphs/`, `.maw/ov.conf`, and `.maw/ovcli.conf`, then warns
- `.maw/ov.conf` is seeded with loopback host/port plus the restored OpenAI-backed dense-embedding and VLM defaults, and it keeps `${OPENAI_API_KEY}` literal for `maw-cli ov:server` to resolve at runtime
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
- `maw-cli` help advertises `ov:server` and `ov:index`, but not `ov:init`
- `maw-cli init` does not mutate the target project's `package.json` for OpenViking runtime wiring
- `bunx maw-cli ov:server` resolves `.maw/ov.conf` placeholders from the current process environment first and the MAW-scope local `.env` as fallback, loaded explicitly rather than through Bun auto-loading, before launching upstream OpenViking
- `bunx maw-cli ov:index . --wait` and `bunx maw-cli ov:index package.json --wait` use the project-local `.maw/ovcli.conf` instead of the operator's global OpenViking CLI config
- setting `"openviking": false` in `maw.json` disables retrieval only; `maw-cli ov:index` still runs unchanged
- all workflows in one MAW scope share the same `.maw/openviking/` storage, `.maw/ov.conf`, and `.maw/ovcli.conf`; live graph retrieval is verified in Phase 7
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
               → Phase 5 (base workflow foundation)
                  → Phase 6 (opencode SDK integration)
                     → Phase 7 (runtime OpenViking retrieval MVP)
```

After the targeted refactors land, follow-on implementation can run in parallel where safe, but planning and sequencing should still begin with `maw-cli` and move into the workflow template.

Runtime-backed skills are planned separately as a post-MVP initiative.

## Installation Model

The location where `maw-cli init` runs defines MAW scope.

- Run `maw-cli init` at a monorepo root when every workflow should share one root-scoped `.maw/` + OpenViking database.
- Run `maw-cli init` inside a specific workspace when MAW/OpenViking should stay local to that workspace.
- A single root config managing multiple child workspaces is out of scope for this MVP.
- The MAW scope root must already contain a target-project `package.json` because `maw-cli init` discovers installed workflow packages there.

Workflow packages are installed into target projects via git URL or other standard package distribution mechanisms.

Example:

```bash
bun add coding@git+https://github.com/org/coding.git
```

`maw-cli` is installed separately and is not a workflow dependency.

Examples:

```bash
bunx maw-cli init
bunx maw-cli ov:server
bunx maw-cli ov:index . --wait
bunx maw-cli dev coding
```

or install it explicitly in the target project as a separate tool dependency if preferred.
