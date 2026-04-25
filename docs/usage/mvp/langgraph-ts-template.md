# langgraph-ts-template MVP Usage

> Planning note
>
> This is a target-state MVP usage guide, not a statement of the currently implemented surface in the active codebase.
> It describes what usage should look like once the MAW MVP is complete.

This guide shows how a workflow author uses `langgraph-ts-template` to build a MAW-compatible workflow package for the Phase 6 MVP.

> Status
>
> This page reflects the current Phase 6 workflow-package contract.
> Workflow packages ship a workflow-local `opencode.json` scaffold asset plus a validator, packaged `planner` / `manager` / hidden `coder` prompts, and a retained `createGraph()` compatibility runtime.
> `maw-cli dev <workflow>` launches bundled opencode directly, while direct LangGraph remains a separate compatibility and smoke surface.

## Goal

By the end of this guide, a workflow package author will:

1. Publish the right package surface for `maw-cli` discovery.
2. Scaffold only workflow-owned target-project files.
3. Ship a default raw `opencode.json` contract for the interactive runtime.
4. Export a validator or schema for edited workflow-local `opencode.json` files.
5. Keep the retained `createGraph()` compatibility runtime runnable.
6. Install the package into a target project and run it through `maw-cli`.

## Before You Start

This guide assumes:

- Bun is used for install, build, and test commands
- runtime code under `src/` stays Node-compatible
- `maw-cli` is a separate tool and must not be a dependency of the workflow package
- the workflow package is intended to be installed into other projects through npm or a git URL

Example workflow name used throughout this guide: `coding`.

## Final Package Responsibilities

The workflow package owns only workflow-specific assets.

| Concern | Owner |
| --- | --- |
| runtime API such as `createGraph` | workflow package |
| packaged `.opencode/agents/{planner,manager,coder}.md` prompts and frontmatter baselines | workflow package |
| `.maw/graphs/<workflow>/graph.ts` scaffold content | workflow package |
| `.maw/graphs/<workflow>/opencode.json` scaffold content | workflow package |
| workflow-local `opencode.json` validator or schema export | workflow package |

The workflow package does not own project-level MAW infrastructure.

| Concern | Owner |
| --- | --- |
| target-project `package.json` | target project; `maw-cli init` requires it for workflow discovery and leaves OpenViking runtime wiring untouched |
| `.maw/ov.conf` | `maw-cli` |
| `.maw/ovcli.conf` | `maw-cli` |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |
| opencode runtime bundling and launch | `maw-cli` |
| `maw-cli` installation and command execution | target project |

The active contract does not include a project-root `maw.json`, `.maw/templates/`, or `maw-cli prompt:*` commands.

## 1. Name The Package And Workflow

Pick a package name and a workflow id.

Rules:

- `scaffold.packageName` is the npm package name used in the generated import
- `scaffold.workflow` is the short workflow id used by `maw-cli init` for the directory name and by `maw-cli dev <workflow>` for runtime selection
- for scoped packages, derive the workflow id by stripping the scope

Example:

```ts
const WORKFLOW_PACKAGE_NAME = '@acme/coding';
const WORKFLOW_ID = WORKFLOW_PACKAGE_NAME.replace(/^@[^/]+\//, '');
```

## 2. Publish The Right `package.json` Surface

The workflow package should publish runtime code, scaffold assets, packaged agent prompts, and the `./scaffold` entrypoint used by `maw-cli init`.

Target `package.json` shape:

```json
{
    "name": "@acme/coding",
    "type": "module",
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/index.js",
            "types": "./dist/index.d.ts"
        },
        "./scaffold": {
            "import": "./dist/scaffold/index.js",
            "types": "./dist/scaffold/index.d.ts"
        },
        "./package.json": "./package.json"
    },
    "files": [
        "dist",
        ".opencode/agents",
        "src/scaffold/assets",
        "README.md"
    ]
}
```

Packaging rules:

- do not depend on `maw-cli`
- do not expose a `bin` command that proxies to `maw-cli`
- make sure the published package includes the built `dist/` files and the source assets needed by scaffold materialization
- do not make target projects install opencode separately; `maw-cli` owns runtime bundling for `dev`

## 3. Implement The `./scaffold` Export

`maw-cli init` discovers installed workflow packages through `./scaffold`.

Final scaffold contract:

```ts
export const scaffold = {
    packageName: '@acme/coding',
    workflow: 'coding',
};

export const createScaffoldFiles = () => ({
    'graph.ts': "import { createGraph } from '@acme/coding';\n\nexport const graph = createGraph({ workflow: 'coding' });\n",
    'opencode.json': '{\n  "$schema": "https://opencode.ai/config.json",\n  "default_agent": "planner",\n  "agent": {\n    "planner": { "mode": "primary", "prompt": "<planner>" },\n    "manager": { "mode": "primary", "prompt": "<manager>" },\n    "coder": { "mode": "subagent", "hidden": true, "prompt": "<coder>" }\n  }\n}\n',
});

export { workflowOpencodeSchema, parseWorkflowOpencode, loadWorkflowOpencode };
```

Requirements:

- `createScaffoldFiles()` returns exactly two files: `graph.ts` and `opencode.json`
- `graph.ts` imports `createGraph` from the package name
- `graph.ts` calls `createGraph({ workflow: '<workflow-id>' })`
- `opencode.json` uses raw opencode schema
- the validator rejects drift from the required visible `planner` and `manager`, hidden `coder`, `default_agent: "planner"`, and packaged permission baselines
- `maw-cli` generates `langgraph.json`; the workflow package does not scaffold it

## 4. Define The Default Workflow `opencode.json`

The embedded scaffold `opencode.json` is the single source of truth for the workflow's default interactive runtime contract.

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

- `opencode.json` is the workflow-local prompt, context, permission, and model/provider surface
- the workflow package validator enforces the required base-workflow topology and any permission baselines the workflow needs
- target projects may edit prompts, context, permissions, and model/provider settings directly in this file so long as validation still passes
- invalid edited `opencode.json` fails before `maw-cli dev <workflow>` launches

## 5. Ship Packaged Agent Prompts And Permission Baselines

Keep the packaged agent prompts in `.opencode/agents/`.

Required packaged agent set for the base workflow:

- `.opencode/agents/planner.md`
- `.opencode/agents/manager.md`
- `.opencode/agents/coder.md`

Rules:

- frontmatter is the source of truth for each agent's description, mode, hidden flag, and permission baseline
- prompt bodies from those files should be materialized into the scaffolded `opencode.json`
- if the runtime needs an explicit permission-baseline update, change the packaged agent frontmatter and the scaffolded `opencode.json` contract together

## 6. Keep The Retained `createGraph()` Compatibility Runtime

The package still exports `createGraph()` from its main entrypoint. The generated target-project `graph.ts` calls that function with the workflow id.

Generated target-project `graph.ts`:

```ts
import { createGraph } from '@acme/coding';

export const graph = createGraph({ workflow: 'coding' });
```

The retained direct LangGraph launch path remains:

```bash
bunx @langchain/langgraph-cli dev --config .maw/graphs/coding
```

Rules:

- this path stays available for compatibility tests and `/runs/wait` smoke only
- it is not the primary interactive UX after Phase 6
- it must remain runnable after the old prompt-template contract is retired
- it does not need full `planner` / `manager` parity in Phase 6; the primary interactive workflow now lives in bundled opencode behind `maw-cli dev <workflow>`

## 7. Verify The Package Locally

Run these commands in the workflow package repo:

```bash
bun install
bun run build
bun run typecheck
bun run lint
bun run test
bun run test:int
```

Acceptance checks for the workflow package:

| Check | Expected result |
| --- | --- |
| package exports `./scaffold` | `maw-cli init` can discover the package |
| `createScaffoldFiles()` returns only `graph.ts` and `opencode.json` | scaffold contract matches the finalized MVP |
| packaged `.opencode/agents/*.md` exist | default `planner` / `manager` / hidden `coder` prompts and baselines are available |
| validator rejects topology or permission drift | edited workflow config fails loudly before launch |
| `createGraph()` still runs | retained compatibility runtime stays available |

## 8. Install The Package Into A Target Project

From the target project:

```bash
bun add @acme/coding@git+https://github.com/acme/coding.git
bun add -D maw-cli
bunx maw-cli init
```

Expected generated target-project layout:

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

What happened during `init`:

- `maw-cli` read the package's `./scaffold` export
- `maw-cli` created `.maw/graphs/coding/`
- the workflow package supplied `graph.ts` and `opencode.json`
- `maw-cli` generated `langgraph.json`
- `maw-cli` created `.maw/ov.conf` and `.maw/ovcli.conf` if they were missing

## 9. Run The End-To-End MVP Flow

Use this sequence when you want to validate the full author-to-consumer flow.

1. Build and verify the workflow package.

```bash
bun run build
bun run typecheck
bun run lint
bun run test
bun run test:int
```

2. Publish the package or make it installable through a git URL.

3. Install it into a target project.

```bash
bun add @acme/coding@git+https://github.com/acme/coding.git
```

4. Bootstrap project MAW files.

```bash
bunx maw-cli init
```

5. Review the generated workflow files.

- `.maw/graphs/coding/graph.ts`
- `.maw/graphs/coding/opencode.json`
- `.maw/graphs/coding/langgraph.json`

6. Start the target project's OpenViking server.

```bash
bunx maw-cli ov:server
```

7. Index target project content.

```bash
bunx maw-cli ov:index
```

8. Run the primary interactive workflow.

```bash
bunx maw-cli dev coding
```

9. When you need the retained compatibility smoke path, run:

```bash
bunx @langchain/langgraph-cli dev --config .maw/graphs/coding
```

Expected result:

- the workflow package is discoverable by `maw-cli`
- the target project gets workflow-local `opencode.json` plus workflow-owned validation
- `maw-cli dev coding` launches the planner-first interactive runtime via bundled opencode
- the retained direct LangGraph path still runs separately for compatibility smoke

## Related Guide

For the target-project side of the same flow, see `docs/usage/mvp/maw-cli.md`.
