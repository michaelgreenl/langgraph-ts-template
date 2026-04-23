# maw-cli MVP Usage

This guide shows how a target project uses `maw-cli` in the Phase 4 MAW MVP.

> Status
>
> This page reflects the current Phase 4 MVP usage model.
> `maw-cli init` bootstraps MAW files, `maw-cli dev <workflow>` remains the workflow runner, and OpenViking runtime execution stays on direct `maw-cli ov:*` commands.

## Goal

By the end of this guide, a target project will:

1. Install one or more workflow packages.
2. Bootstrap project-level MAW files with `maw-cli`.
3. Configure project settings in `maw.json`.
4. Configure workflow prompt selection in `.maw/graphs/<workflow>/config.json`.
5. Override embedded prompt snippets through `.maw/templates/`.
6. Start and index shared project context with OpenViking.
7. Run one workflow in isolation with `maw-cli dev <workflow>`.

## Before You Start

This guide assumes:

- the target project already has a `package.json`
- Bun is available for package install and command execution
- at least one workflow package is available for install
- `maw-cli` is treated as a standalone tool, not as a transitive dependency of the workflow package

Example workflow name used throughout this guide: `coding`.

## MVP Command Surface

| Surface | Purpose |
| --- | --- |
| `maw-cli init` | Bootstrap MAW project files and workflow-local scaffolds |
| `maw-cli dev <workflow>` | Run one workflow through LangGraph dev using its local config |
| `maw-cli ov:server` | Start the project-scoped OpenViking server after resolving `.maw/ov.conf` placeholders |
| `maw-cli ov:index <target-path> [openviking args...]` | Index one explicit path with the project-local `.maw/ovcli.conf` |

There is no `maw-cli start` command in the MVP.

`maw-cli dev <workflow>` remains the workflow runner through Phase 4. OpenViking runtime execution is intentionally separate and runs through direct `maw-cli ov:*` commands; `maw-cli init` does not wire target-project `package.json` scripts for it.

## 1. Install `maw-cli` And A Workflow Package

Install the workflow package into the target project first. `maw-cli init` discovers installed workflow packages through their `./scaffold` export.

Example:

```bash
bun add coding@git+https://github.com/org/coding.git
```

Run `maw-cli` in one of two ways.

Use `bunx` without adding it to the project:

```bash
bunx maw-cli init
```

Or install it as a separate tool dependency and still invoke it through `bunx`:

```bash
bun add -D maw-cli
bunx maw-cli init
```

Expected result:

- the workflow package is present in the target project's installed dependencies
- `maw-cli` can discover the package's `./scaffold` export during `init`

## 2. Bootstrap The Target Project

Run:

```bash
bunx maw-cli init
```

On success, `maw-cli` creates project-owned files first and then creates one workflow directory under `.maw/graphs/` for each discovered workflow.

Expected target-project layout:

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
  ov.conf
  ovcli.conf
```

Ownership split:

| Path | Owner |
| --- | --- |
| `package.json` | target project; `maw-cli init` requires it for workflow discovery and leaves OpenViking runtime wiring untouched |
| `maw.json` | `maw-cli` seeds it if missing, target project owns later edits |
| `.maw/templates/` | `maw-cli` creates it, target project owns overrides inside it |
| `.maw/ov.conf` | `maw-cli` seeds it if missing, target project owns later edits |
| `.maw/ovcli.conf` | `maw-cli` seeds it if missing, target project owns later edits |
| `.maw/graphs/<workflow>/graph.ts` | workflow package |
| `.maw/graphs/<workflow>/config.json` | workflow package |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |

Important behavior:

- rerunning `maw-cli init` preserves existing files
- if no workflow packages are installed yet, `maw-cli init` still creates `maw.json`, `.maw/templates/`, `.maw/graphs/`, `.maw/ov.conf`, and `.maw/ovcli.conf`, then warns instead of failing
- `maw-cli init` requires the target project's existing `package.json` for workflow discovery
- `maw-cli init` does not add OpenViking runtime scripts or otherwise mutate `package.json` for OpenViking runtime wiring
- `maw-cli init` appends only `.maw/openviking/` to `.gitignore`

## 3. Review Project Configuration In `maw.json`

`maw.json` is the project-level MAW config.

Generated default:

```json
{
    "openviking": true,
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

Field meanings:

| Field | Meaning |
| --- | --- |
| `openviking` | Boolean retrieval toggle carried by the workflow runtime; in Phase 4 it affects later retrieval only and does not gate `maw-cli ov:index` |
| `templates.customPath` | Directory for project-local prompt snippet overrides |

Rules:

- `maw.json` contains only literal project settings
- it does not support variable interpolation
- it does not contain `workspace` or OpenViking host/port fields
- it does not carry workflow-specific prompt lists, per-agent models, or secrets

## 4. Review Workflow Configuration In `.maw/graphs/<workflow>/config.json`

Each workflow gets its own local config file under `.maw/graphs/<workflow>/config.json`.

Finalized MVP shape:

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

How it works:

| Config slot | Meaning |
| --- | --- |
| `prompts.global` | Snippets applied to every agent |
| `prompts.agents.planner` | Planner-only snippets |
| `prompts.agents.coder` | Coder-only snippets |

Merge rules for the finalized MVP runtime:

- missing keys inherit workflow-package defaults
- explicit empty arrays also inherit workflow-package defaults
- non-empty arrays replace the inherited value for that slot
- invalid workflow config triggers a loud warning and falls back to the embedded defaults instead of breaking the run

## 5. Override Embedded Snippets In `.maw/templates/`

Workflow packages ship embedded default snippets. The target project can override any snippet globally by dropping a file with the same name into `.maw/templates/`.

Example override:

Path:

```text
.maw/templates/security.njk
```

Contents:

```njk
Never write secrets into tracked files.
Treat the current repository as the source of truth.
Prefer small, reversible edits.
```

Override rules:

- `.maw/templates/<name>.njk` wins over the embedded snippet with the same name
- overrides apply project-wide
- snippet selection remains workflow-specific through `.maw/graphs/<workflow>/config.json`

## 6. Inspect Prompt Composition

This is part of the finalized MVP command surface and lands in Phase 3.

List the configured prompt order for a workflow:

```bash
bunx maw-cli prompt:list coding
```

Preview the fully rendered planner prompt:

```bash
bunx maw-cli prompt:preview coding planner
```

Preview the fully rendered coder prompt:

```bash
bunx maw-cli prompt:preview coding coder
```

Use this flow when you want to verify that:

- the workflow-local config is selecting the expected snippet names
- global snippets render before agent-specific snippets
- a custom override in `.maw/templates/` is actually being applied

## 7. Start And Index OpenViking

This is part of the Phase 4 direct `maw-cli` runtime surface.

Start the project-scoped OpenViking server:

```bash
bunx maw-cli ov:server
```

`maw-cli ov:server` reads `.maw/ov.conf`, resolves `${VAR}` placeholders from the current process environment first and the MAW-scope local `.env` as fallback, loads that `.env` file explicitly instead of relying on Bun auto-loading, writes the resolved values only into an ephemeral temp config outside the project tree, and then invokes upstream `openviking-server`.

Index the whole project. The target path is always explicit:

```bash
bunx maw-cli ov:index .
```

Reindex only one subtree or file:

```bash
bunx maw-cli ov:index src
bunx maw-cli ov:index package.json
```

Pass extra upstream OpenViking flags after the target path when you need them:

```bash
bunx maw-cli ov:index . --wait
```

Important behavior:

- `maw-cli ov:index` requires an explicit target path and does not hide one behind MAW defaults
- `maw-cli ov:index` uses the project-local `.maw/ovcli.conf`
- `maw-cli ov:index` does not depend on `maw.json.openviking`; setting `"openviking": false` disables later retrieval only and does not block indexing
- `maw-cli init` creates `.maw/ov.conf` and `.maw/ovcli.conf` if missing, but it does not add target-project OpenViking runtime scripts

OpenViking is project-wide, not workflow-specific. Every installed workflow shares the same indexed project context through `.maw/ov.conf` and `.maw/ovcli.conf`.

Generated OpenViking config excerpts:

```json
// .maw/ov.conf
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

```json
// .maw/ovcli.conf
{
    "url": "http://localhost:1933"
}
```

The generated server binds to loopback (`127.0.0.1`) by default, and the generated client URL uses `localhost` to reach that same local listener.

The scaffolded `.maw/ov.conf` intentionally keeps `${OPENAI_API_KEY}` literal. `maw-cli ov:server` resolves that placeholder at launch time using the current process environment first and the MAW-scope local `.env` as fallback, so the generated config carries placeholders rather than copied secrets.

## 8. Run One Workflow In Isolation

Run:

```bash
bunx maw-cli dev coding
```

`maw-cli` validates that:

- `maw.json` exists
- `.maw/graphs/coding/` exists
- `.maw/graphs/coding/graph.ts` exists
- `.maw/graphs/coding/config.json` exists
- `.maw/graphs/coding/langgraph.json` exists

Then it launches:

```text
langgraphjs dev --config .maw/graphs/coding
```

Conceptual workflow-local `langgraph.json`:

```json
{
    "node_version": "20",
    "graphs": {
        "coding": "./graph.ts:graph"
    },
    "env": "<target-project root environment file>"
}
```

Important behavior:

- the workflow runs from `.maw/graphs/<workflow>/langgraph.json`
- root `langgraph.json` is not part of the MVP flow
- extra args after the workflow name are forwarded to `langgraphjs`

Example:

```bash
bunx maw-cli dev coding --port 3020
```

Through Phase 4, this remains the workflow runner. Starting and indexing OpenViking stays separate through `bunx maw-cli ov:server` and `bunx maw-cli ov:index <target-path>`.

## 9. End-To-End MVP Flow

Use this sequence when you want to exercise the full target-project workflow.

1. Install the workflow package.

```bash
bun add coding@git+https://github.com/org/coding.git
```

2. Bootstrap project MAW files.

```bash
bunx maw-cli init
```

3. Review `maw.json` and adjust project settings if needed.

4. Review `.maw/graphs/coding/config.json` and adjust prompt selection if needed.

5. Add any project-specific prompt overrides under `.maw/templates/`.

6. Inspect prompt composition.

```bash
bunx maw-cli prompt:list coding
bunx maw-cli prompt:preview coding planner
bunx maw-cli prompt:preview coding coder
```

7. Start the project-scoped OpenViking server.

```bash
bunx maw-cli ov:server
```

8. Index an explicit path into OpenViking.

```bash
bunx maw-cli ov:index .
```

9. Run the workflow.

```bash
bunx maw-cli dev coding
```

10. Exercise the planner/coder workflow against the target project.

In the current Phase 4 MVP surface, the base workflow can:

- inspect the target project's files
- use deterministic planner and coder prompts
- run a controlled file, shell, and git tool loop
- use direct `maw-cli ov:server` and `maw-cli ov:index` commands for shared project context management
- surface the resulting code changes back to the user

## 10. Acceptance Checks

Use these checks to confirm the target project matches the MVP contract.

| Check | Expected result |
| --- | --- |
| `maw.json` exists | project-level config was created |
| `.maw/templates/` exists | project-local prompt overrides are available |
| `.maw/ov.conf` exists | project-wide OpenViking config was created |
| `.maw/ovcli.conf` exists | project-local OpenViking client URL was created |
| target-project `package.json` exists before `maw-cli init` | MAW scope satisfies workflow discovery requirements |
| `bunx maw-cli ov:server` is the server start path | OpenViking runtime ownership stays in `maw-cli` |
| `bunx maw-cli ov:index .` requires an explicit target path | indexing uses the direct `maw-cli` surface |
| `.maw/graphs/coding/graph.ts` exists | workflow scaffold landed |
| `.maw/graphs/coding/config.json` exists | workflow-local prompt config landed |
| `.maw/graphs/coding/langgraph.json` exists | workflow-local LangGraph config was generated |
| `.gitignore` contains `.maw/openviking/` | OpenViking storage is ignored |
| workflow-local `langgraph.json` uses `./graph.ts:graph` | graph path is relative to the workflow directory |
| workflow-local `langgraph.json` points at the target-project root environment file | environment loading is wired to the project root |
| `maw-cli dev coding` runs with `--config .maw/graphs/coding` | workflow isolation is working |

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `maw-cli init` finds no workflows | confirm the package is installed and exports `./scaffold` |
| `maw-cli ov:server` fails before launch | confirm the required `.maw/ov.conf` placeholders are available in the current process environment or the MAW-scope local `.env`; process env wins when both define the same value |
| `bunx maw-cli ov:index` exits immediately | confirm you passed an explicit target path, for example `bunx maw-cli ov:index .` |
| `maw-cli dev <workflow>` says the workflow directory is missing | rerun `maw-cli init` after installing the workflow package |
| prompt preview does not show a custom override | confirm the override file name matches the snippet name exactly |
| workflow config is ignored | confirm `.maw/graphs/<workflow>/config.json` is valid JSON and uses the prompt-only shape |
| `langgraphjs` is not using the expected graph | confirm you are launching through `maw-cli dev <workflow>` and not through a root `langgraph.json` |

## Related Guide

For the workflow-package author side of this flow, see `docs/usage/mvp/langgraph-ts-template.md`.
