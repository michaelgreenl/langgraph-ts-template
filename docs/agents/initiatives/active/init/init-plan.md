# MAW (Model Accelerated Workflow) — Initialization Plan

## Status Reset

This plan supersedes earlier architecture decisions that blurred the boundary between `maw-cli` and workflow packages.

The current direction is now:

- `maw-cli` is a standalone tool, not a transitive workflow dependency.
- `maw-cli` owns project-level MAW infrastructure.
- Workflow packages built from this template only own workflow-specific runtime assets.
- OpenViking is configured once per target project and shared by every installed workflow.
- Skills and prompts are configured deterministically, not discovered by autoloading at runtime.

Still valid from earlier work:

- Bun migration
- Vitest migration
- Changesets and versioning workflow
- Workflow packages being installable npm/git packages
- Nunjucks-based prompt composition inside workflows

Needs targeted refactor from the current implementation:

- `langgraph-ts-template` depending on `maw-cli`
- Root-level shared `langgraph.json`
- `.maw/config.json` as the main project config
- Workflow packages scaffolding `ov.conf` and project config
- `maw-cli dev` and `maw-cli start` without a workflow argument

## Finalized Decisions

- `maw-cli` is installed and invoked separately from workflow packages.
- Workflow packages do not carry `maw-cli` as a dependency.
- The target project root config file is `maw.json`.
- OpenViking remains per-project, not per-workflow.
- The target project's workflow runtime files live under `.maw/graphs/<workflow>/`.
- Each workflow directory contains its own `graph.ts`, `config.json`, and `langgraph.json`.
- `maw-cli` intentionally generates each workflow's `langgraph.json` because it owns the target-project scaffold conventions and LangGraph CLI invocation.
- Workflow packages scaffold only workflow-specific files.
- `maw-cli dev <workflow>` and `maw-cli start <workflow>` execute a single workflow in isolation.
- Agent skill selection lives in each workflow's `.maw/graphs/<workflow>/config.json`.
- The base workflow template must be able to work on the target project's codebase before MVP is considered complete.
- The default base workflow agents are `planner` and `coder`.
- Shell execution for the base codebase workflow is restricted to an allow-list.
- Custom template overrides live in `.maw/templates/` at the project level.
- Prompt/skill injection must be deterministic and inspectable before execution.
- Runtime-backed skills are post-MVP and tracked in a separate queued initiative.

## Architecture

```
┌──────────────────────────────────────────┐
│  REPO: maw-cli                           │
│  Standalone CLI/tooling package          │
│  Owns: init, dev, start, prompt:*, ov:*  │
│  Owns: maw.json, ov.conf, langgraph.json │
└──────────────────────────────────────────┘
                 │
                 │ manages target project infrastructure
                 ▼
┌──────────────────────────────────────────┐
│  TARGET PROJECT                          │
│  maw.json                                │
│  .maw/templates/                         │
│  .maw/graphs/<workflow>/                 │
│    graph.ts                              │
│    config.json                           │
│    langgraph.json                        │
│  .maw/ov.conf                            │
└──────────────────────────────────────────┘
                 ▲
                 │ installed workflows contribute their own runtime entrypoints
                 │
┌──────────────────────────────────────────┐
│  REPO: langgraph-ts-template             │
│  Template for workflow packages          │
│  Owns: graph runtime, prompt engine,     │
│  embedded default snippets, scaffold     │
│  files for one workflow                  │
└──────────────────────────────────────────┘
```

## Responsibility Split

| Concern                                       | Owner                                                  |
| --------------------------------------------- | ------------------------------------------------------ |
| `maw.json`                                    | `maw-cli`                                              |
| `.maw/ov.conf`                                | `maw-cli`                                              |
| `.maw/templates/` directory                   | `maw-cli` creates it, target project owns its contents |
| `.maw/graphs/<workflow>/langgraph.json`       | `maw-cli`                                              |
| `.maw/graphs/<workflow>/graph.ts`             | workflow package                                       |
| `.maw/graphs/<workflow>/config.json`          | workflow package                                       |
| Embedded default snippets                     | workflow package                                       |
| Prompt list / prompt preview commands         | `maw-cli`                                              |
| OpenViking indexing and lifecycle commands    | `maw-cli`                                              |
| Agent model/provider wiring                   | workflow package                                       |
| OpenViking context retrieval inside the graph | workflow package                                       |

## Target Project Scaffold

`maw-cli init` should converge on this target-project layout:

```text
maw.json
.maw/
  templates/
  graphs/
    docs-agent/
      graph.ts
      config.json
      langgraph.json
    code-agent/
      graph.ts
      config.json
      langgraph.json
  ov.conf
```

### `maw.json`

`maw.json` is the project-level MAW config.

It should stay small and only carry per-project settings:

- workspace root
- OpenViking host/port/enabled toggle
- custom templates path

It should not carry:

- workflow agent skill lists
- workflow prompt composition rules
- per-agent model/provider configuration

Proposed shape:

```json
{
    "workspace": ".",
    "openviking": {
        "enabled": true,
        "host": "localhost",
        "port": 1933
    },
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

### `.maw/ov.conf`

`.maw/ov.conf` is generated by `maw-cli` and configured once per target project.

- it configures the shared OpenViking database for the project
- every installed workflow uses the same indexed project context
- it uses environment variable placeholders like `${OPENAI_API_KEY}`
- it should move out of the workflow template and into `maw-cli`

### `.maw/graphs/<workflow>/graph.ts`

This file is generated from the workflow package's scaffold export.

It is the workflow-specific LangGraph entry point in the target project.

Example shape:

```ts
import { createGraph } from 'docs-agent';

export const graph = createGraph();
```

### `.maw/graphs/<workflow>/config.json`

This file is generated from the workflow package's scaffold export.

It is the workflow-specific agent/skill config and should contain no secrets.

Proposed shape:

```json
{
    "agents": {
        "planner": {
            "skills": ["general-coding", "security", "project-context", "research-rules"]
        },
        "coder": {
            "skills": ["general-coding", "security", "project-context", "typescript"]
        }
    }
}
```

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
        "<workflow>": "<path-to-.maw/graphs/<workflow>/graph.ts:graph>"
    },
    "env": ".env",
    "dependencies": ["."]
}
```

Path semantics inside `langgraph.json` must be verified against `@langchain/langgraph-cli` during implementation so the generated file uses the correct relative paths.

## Workflow Package Contract

Workflow packages built from `langgraph-ts-template` should expose:

- the workflow runtime API, including `createGraph`
- embedded default Nunjucks snippets
- a `./scaffold` export that describes only workflow-owned target-project files

The scaffold contract should be revised so the workflow package contributes:

- `.maw/graphs/<workflow>/graph.ts`
- `.maw/graphs/<workflow>/config.json`
- a published path to its embedded default templates for prompt preview / prompt composition tooling

The workflow package should not contribute:

- `maw.json`
- `.maw/ov.conf`
- `.maw/graphs/<workflow>/langgraph.json`
- any direct dependency on `maw-cli`

## `maw-cli` Command Surface

Target command surface:

```text
maw-cli init
maw-cli dev <workflow>
maw-cli start <workflow>
maw-cli prompt:list <workflow>
maw-cli prompt:preview <workflow> <agent>
maw-cli ov:init
maw-cli ov:index
```

### `maw-cli init`

`maw-cli init` should:

- create `maw.json` if missing
- create `.maw/templates/`
- create `.maw/graphs/`
- create `.maw/ov.conf` if missing
- discover installed workflow packages via the `./scaffold` export contract
- create `.maw/graphs/<workflow>/graph.ts` for each discovered workflow if missing
- create `.maw/graphs/<workflow>/config.json` for each discovered workflow if missing
- generate `.maw/graphs/<workflow>/langgraph.json` for each discovered workflow if missing
- preserve existing files on rerun

### `maw-cli dev <workflow>` and `maw-cli start <workflow>`

These commands should:

- require a workflow argument
- validate that `maw.json` exists
- validate that `.maw/graphs/<workflow>/` exists
- validate that the workflow-specific `graph.ts`, `config.json`, and `langgraph.json` exist
- invoke `langgraphjs dev --config .maw/graphs/<workflow>` or `langgraphjs start --config .maw/graphs/<workflow>`

This gives each workflow its own isolated LangGraph server config.

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

Concretely, the base workflow must be able to operate on the target project's codebase in the same broad class of tasks as a coding agent:

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

- `langgraph-ts-template/package.json` currently depends on `maw-cli`
- the workflow template currently scaffolds `.maw/config.json`
- the workflow template currently scaffolds `.maw/ov.conf`
- the workflow template currently scaffolds `langgraph.json`
- the current target scaffold uses `.maw/graph.ts` instead of `.maw/graphs/<workflow>/graph.ts`
- the current `maw-cli dev` and `maw-cli start` do not require a workflow argument
- the current plan/task docs assume a single shared workflow config at `.maw/config.json`
- the current graph is still a stub that returns a hardcoded greeting
- the current workflow template exposes no file, shell, or git tools for working on a target project codebase
- no model provider package is wired for the base workflow yet

## Execution Plan

### Phase 0: Plan Realignment

- [x] complete

- finalize the architecture decisions in this document
- treat conflicting older phase notes as superseded by this plan
- regenerate downstream task docs from this plan before starting broad implementation

### Phase 1: `maw-cli` targeted refactor

- [ ] complete

- move project-level config handling from `.maw/config.json` to `maw.json`
- move `ov.conf` ownership into `maw-cli`
- revise `init` to create the new target-project scaffold
- revise `dev` and `start` to require a workflow argument
- generate workflow-local `langgraph.json` files from `maw-cli`
- add test coverage for multi-workflow scaffolding and isolated execution
- update smoke tests to exercise the standalone `maw-cli` flow

### Phase 2: `langgraph-ts-template` targeted refactor

- [ ] complete

- remove the `maw-cli` dependency from the workflow template
- shrink the scaffold contract to workflow-owned files only
- add a workflow-local `config.json` scaffold asset for agent/skill declarations
- update runtime config loading to read `maw.json` plus the workflow-local graph config
- expose whatever metadata `maw-cli prompt:preview` needs to locate embedded templates
- update tests to reflect the new scaffold contract

### Phase 3: Prompt management commands

- [ ] complete

- implement `maw-cli prompt:list <workflow>`
- implement `maw-cli prompt:preview <workflow> <agent>`
- add smoke tests that prove prompt composition and custom template overrides are working
- ensure this verification path exists before further workflow/template expansion

### Phase 4: OpenViking integration

- [ ] complete

- keep OpenViking configuration project-wide in `.maw/ov.conf`
- implement `maw-cli ov:init`
- implement `maw-cli ov:index`
- verify that workflows retrieve context from the same project-level OpenViking database
- keep OpenViking model/provider config out of workflow-specific config

### Phase 5: Base codebase agent MVP

- [ ] complete

- replace the current hardcoded graph stub with a real LLM-backed coding workflow
- wire Anthropic as the initial model provider for the base template workflow
- build the graph loop manually instead of using `createReactAgent`
- add filesystem tools using MCP adapters plus the MCP filesystem server
- add shell execution using LangChain community tooling
- support git operations through the controlled shell tool set
- restrict shell and git execution to an allow-list suitable for local development workflows
- update the workflow-local default agent config to `planner` and `coder`
- add verification coverage for file creation, file updates, and targeted edits in the target project
- add verification coverage showing those edits are visible through allowed git commands
- add smoke coverage proving the base workflow can inspect and act on a target project's codebase
- treat this phase as the MVP gate for the combined `maw-cli` + workflow-template system

## Verification Gates

### `maw-cli`

- `bun run build`
- `bun run lint`
- `bun run test`
- smoke: `init`, `dev <workflow>`, `prompt:list`, `prompt:preview`

### `langgraph-ts-template`

- `bun run build`
- `bun run typecheck`
- `bun run test`
- `bun run test:int`
- scaffold tests covering workflow-local `graph.ts` and `config.json`

### Cross-repo acceptance checks

- a target project with two installed workflows gets two directories under `.maw/graphs/`
- `maw-cli dev docs-agent` only uses `.maw/graphs/docs-agent/langgraph.json`
- `maw-cli prompt:list docs-agent` shows the configured `planner` and `coder` skill order
- `maw-cli prompt:preview docs-agent planner` prints the expected composed prompt
- a custom override in `.maw/templates/security.njk` is reflected in prompt preview
- OpenViking is initialized once and both workflows can query the same indexed project context
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

Workflow packages are installed into target projects via git URL or other standard package distribution mechanisms.

Example:

```bash
bun add docs-agent@git+https://github.com/org/docs-agent.git
```

`maw-cli` is installed separately and is not a workflow dependency.

Examples:

```bash
bunx maw-cli init
bunx maw-cli dev docs-agent
```

or install it explicitly in the target project as a separate tool dependency if preferred.
