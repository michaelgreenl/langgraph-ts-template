# maw-cli MVP Usage

> Planning note
>
> This is a target-state MVP usage guide, not a statement of the currently implemented surface in the active codebase.
> It describes what usage should look like once the MAW MVP is complete.

This guide shows how a target project uses `maw-cli` in the Phase 6 MAW MVP.

> Status
>
> This page reflects the current Phase 6 contract.
> `maw-cli init` scaffolds `.maw/` plus workflow-local `opencode.json` files.
> `maw-cli dev <workflow>` launches bundled opencode directly: planner-first in TTY mode, server-only in non-TTY mode.
> The direct LangGraph path remains a separate compatibility and smoke surface only.

## Goal

By the end of this guide, a target project will:

1. Install one or more workflow packages.
2. Bootstrap project-local MAW files with `maw-cli init`.
3. Review or edit `.maw/graphs/<workflow>/opencode.json`.
4. Start and index shared project context with OpenViking.
5. Run one workflow through `maw-cli dev <workflow>`.
6. Optionally exercise the retained direct LangGraph compatibility path.

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
| `maw-cli init` | Bootstrap `.maw/` and workflow-local scaffolds |
| `maw-cli dev <workflow>` | Launch bundled opencode from `.maw/graphs/<workflow>/opencode.json` |
| `maw-cli ov:server` | Start the project-scoped OpenViking server after resolving `.maw/ov.conf` placeholders |
| `maw-cli ov:index [target-path] [openviking args...]` | Index the current working directory by default, or one explicit path, with the project-local `.maw/ovcli.conf` |

There is no active `maw-cli start`, `maw-cli prompt:list`, or `maw-cli prompt:preview` surface in the Phase 6 contract.

`maw-cli` bundles the opencode runtime needed for `dev`; target projects do not install opencode separately.

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

On success, `maw-cli` creates `.maw/` in the current working directory and then creates one workflow directory under `.maw/graphs/` for each discovered workflow.

Expected target-project layout:

```text
package.json
.maw/
  graphs/
    coding/
      graph.ts
      opencode.json
      langgraph.json
  ov.conf
  ovcli.conf
```

Ownership split:

| Path | Owner |
| --- | --- |
| `package.json` | target project; `maw-cli init` requires it for workflow discovery and leaves OpenViking runtime wiring untouched |
| `.maw/ov.conf` | `maw-cli` seeds it if missing, target project owns later edits |
| `.maw/ovcli.conf` | `maw-cli` seeds it if missing, target project owns later edits |
| `.maw/graphs/<workflow>/graph.ts` | workflow package |
| `.maw/graphs/<workflow>/opencode.json` | workflow package seeds the default file; target project owns later edits subject to workflow validation |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |

Important behavior:

- `maw-cli init` defines MAW scope by creating `.maw/` in the current working directory
- later commands resolve the nearest ancestor containing `.maw/`
- rerunning `maw-cli init` preserves existing files
- if no workflow packages are installed yet, `maw-cli init` still creates `.maw/graphs/`, `.maw/ov.conf`, and `.maw/ovcli.conf`, then warns instead of failing
- `maw-cli init` does not create a project-root `maw.json`
- `maw-cli init` does not create `.maw/templates/`
- `maw-cli init` does not add OpenViking runtime scripts or otherwise mutate `package.json` for OpenViking runtime wiring
- `maw-cli init` appends only `.maw/openviking/` to `.gitignore`

## 3. Review Workflow Configuration In `.maw/graphs/<workflow>/opencode.json`

Each workflow gets its own local runtime config file under `.maw/graphs/<workflow>/opencode.json`.

Conceptual base-workflow shape:

```json
{
    "$schema": "https://opencode.ai/config.json",
    "default_agent": "planner",
    "agent": {
        "planner": {
            "mode": "primary",
            "prompt": "<planner system prompt>"
        },
        "manager": {
            "mode": "primary",
            "prompt": "<manager system prompt>"
        },
        "coder": {
            "mode": "subagent",
            "hidden": true,
            "prompt": "<coder system prompt>"
        }
    }
}
```

Rules:

- `opencode.json` is the single workflow-local prompt, context, permission, and model/provider surface
- target projects may edit prompts, context, permissions, and model/provider settings directly in this file so long as the workflow validator still passes
- the workflow validator requires visible primary `planner` and `manager`, hidden `coder`, `default_agent: "planner"`, and the packaged permission baselines
- invalid edited `opencode.json` fails before any TTY or non-TTY `maw-cli dev <workflow>` runtime starts
- `graph.ts` and `langgraph.json` remain only for the separate direct LangGraph compatibility and smoke path
- older `.maw/graphs/<workflow>/config.json` and `.maw/templates/` customization patterns are superseded by `opencode.json`; if those files still exist in an older repo, MAW ignores them

## 4. Start And Index OpenViking

Start the project-scoped OpenViking server:

```bash
bunx maw-cli ov:server
```

`maw-cli ov:server` reads `.maw/ov.conf`, resolves `${VAR}` placeholders from the current process environment first and the MAW-scope local `.env` as fallback, loads that `.env` file explicitly instead of relying on Bun auto-loading, writes the resolved values only into an ephemeral temp config outside the project tree, and then invokes upstream `openviking-server`.

Index the whole project. If you omit `target-path`, `maw-cli ov:index` defaults to the current working directory:

```bash
bunx maw-cli ov:index
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

- `maw-cli ov:index` defaults to the current working directory when you omit the target path
- when passing extra upstream flags, provide the target path before those flags, for example `bunx maw-cli ov:index . --wait`
- `maw-cli ov:index` uses the project-local `.maw/ovcli.conf`
- OpenViking remains project-wide, not workflow-specific; every installed workflow shares the same indexed project context for that MAW scope

## 5. Run One Workflow In Isolation

Run:

```bash
bunx maw-cli dev coding
```

`maw-cli` validates that:

- `.maw/graphs/coding/` exists
- `.maw/graphs/coding/opencode.json` exists
- `.maw/graphs/coding/opencode.json` passes the workflow package's validator

Runtime behavior:

- in TTY mode, `maw-cli dev coding` launches bundled opencode directly and starts on `planner`
- an explicit execute request hands the active workflow off from `planner` to `manager`
- `manager` delegates scoped implementation work to hidden `coder` subagents and auto-commits clean results
- in non-TTY mode, the same command launches the same workflow in server-only mode so SDK harnesses can drive it headlessly

The retained direct LangGraph compatibility path stays separate:

```bash
bunx @langchain/langgraph-cli dev --config .maw/graphs/coding
```

That command exists for compatibility and smoke only. It is not the primary interactive workflow UX after Phase 6.

## 6. End-To-End MVP Flow

Use this sequence when you want to exercise the full target-project workflow.

1. Install the workflow package.

```bash
bun add coding@git+https://github.com/org/coding.git
```

2. Bootstrap project MAW files.

```bash
bunx maw-cli init
```

3. Review `.maw/graphs/coding/opencode.json` and make any workflow-local prompt, context, or provider edits you need.

4. Start the project-scoped OpenViking server.

```bash
bunx maw-cli ov:server
```

5. Index project content into OpenViking. Omitting the path uses the current working directory.

```bash
bunx maw-cli ov:index
```

6. Run the workflow.

```bash
bunx maw-cli dev coding
```

7. When you need the retained compatibility smoke path, run:

```bash
bunx @langchain/langgraph-cli dev --config .maw/graphs/coding
```

## 7. Acceptance Checks

Use these checks to confirm the target project matches the Phase 6 MVP contract.

| Check | Expected result |
| --- | --- |
| target-project `package.json` exists before `maw-cli init` | MAW scope satisfies workflow discovery requirements |
| `.maw/graphs/coding/graph.ts` exists | retained LangGraph compatibility entry landed |
| `.maw/graphs/coding/opencode.json` exists | workflow-local interactive config landed |
| `.maw/graphs/coding/langgraph.json` exists | workflow-local LangGraph config was generated |
| `.maw/ov.conf` exists | project-wide OpenViking config was created |
| `.maw/ovcli.conf` exists | project-local OpenViking client URL was created |
| no project-root `maw.json` exists | retired project-root config surface stayed removed |
| `.maw/templates/` is not required | retired prompt-template overrides stayed retired |
| `bunx maw-cli dev coding` starts on `planner` in TTY mode | planner-first interactive launch is working |
| non-TTY `bunx maw-cli dev coding` exposes the same workflow in server-only mode | SDK harness path is available |
| `bunx @langchain/langgraph-cli dev --config .maw/graphs/coding` still runs | retained compatibility path is still available |

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `maw-cli init` finds no workflows | confirm the package is installed and exports `./scaffold` |
| `maw-cli ov:server` fails before launch | confirm the required `.maw/ov.conf` placeholders are available in the current process environment or the MAW-scope local `.env`; process env wins when both define the same value |
| `bunx maw-cli ov:index` exits immediately | if you passed upstream flags, confirm you also supplied the target path first, for example `bunx maw-cli ov:index . --wait` |
| `maw-cli dev <workflow>` says the workflow directory is missing | rerun `maw-cli init` after installing the workflow package |
| `maw-cli dev <workflow>` fails before launch on invalid config | confirm `.maw/graphs/<workflow>/opencode.json` still satisfies the workflow package validator |
| older `config.json` or `.maw/templates/` edits appear ignored | the active contract uses `.maw/graphs/<workflow>/opencode.json`; prompt-template overrides are retired |
| you need the retained compatibility path | launch `bunx @langchain/langgraph-cli dev --config .maw/graphs/<workflow>` directly |

## Related Guide

For the workflow-package author side of this flow, see `docs/usage/mvp/langgraph-ts-template.md`.
