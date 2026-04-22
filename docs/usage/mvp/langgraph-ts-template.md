# langgraph-ts-template MVP Usage

This guide shows how a workflow author uses `langgraph-ts-template` to build a MAW-compatible workflow package for the Phase 4 MVP.

> Status
>
> This page reflects the current workflow-package contract through Phase 4.
> Workflow packages own workflow-specific runtime assets, `maw-cli dev <workflow>` remains the workflow runner, and OpenViking runtime execution lives in target-project `package.json` scripts.

## Goal

By the end of this guide, a workflow package author will:

1. Publish the right package surface for `maw-cli` discovery.
2. Scaffold only workflow-owned target-project files.
3. Ship embedded default prompt snippets.
4. Load `maw.json` and `.maw/graphs/<workflow>/config.json` at runtime.
5. Install the package into a target project.
6. Run the workflow end to end through `maw-cli`.

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
| embedded default snippets | workflow package |
| `.maw/graphs/<workflow>/graph.ts` scaffold content | workflow package |
| `.maw/graphs/<workflow>/config.json` scaffold content | workflow package |
| template metadata needed by prompt preview | workflow package |

The workflow package does not own project-level MAW infrastructure.

| Concern | Owner |
| --- | --- |
| `maw.json` | `maw-cli` |
| `.maw/ov.conf` | `maw-cli` |
| `.maw/ovcli.conf` | `maw-cli` |
| `.maw/graphs/<workflow>/langgraph.json` | `maw-cli` |
| `package.json#scripts.maw:ov:server` | `maw-cli` seeds it, target project owns the final value |
| `package.json#scripts.maw:ov:index` | `maw-cli` seeds it, target project owns the final value |
| `maw-cli` installation and command execution | target project |

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

In this example:

- package name: `@acme/coding`
- workflow id: `coding`

## 2. Publish The Right `package.json` Surface

The workflow package should publish runtime code, scaffold assets, and embedded templates.

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
        "./config": {
            "import": "./dist/config.js",
            "types": "./dist/config.d.ts"
        },
        "./scaffold": {
            "import": "./dist/scaffold/index.js",
            "types": "./dist/scaffold/index.d.ts"
        },
        "./package.json": "./package.json"
    },
    "files": [
        "dist",
        "src/scaffold/assets",
        "src/templates/defaults",
        "README.md"
    ]
}
```

MVP packaging rules:

- do not depend on `maw-cli`
- do not expose a `bin` command that proxies to `maw-cli`
- make sure the published package includes built `dist/` files and the source assets needed by scaffold and prompt preview

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
    'config.json': '{\n    "prompts": {\n        "global": ["general", "security"],\n        "agents": {\n            "planner": ["research-rules"],\n            "coder": ["typescript"]\n        }\n    }\n}\n',
});
```

Requirements:

- `createScaffoldFiles()` returns exactly two files: `graph.ts` and `config.json`
- `graph.ts` imports `createGraph` from the package name
- `graph.ts` calls `createGraph({ workflow: '<workflow-id>' })`
- `config.json` uses the prompt-only workflow config shape
- `maw-cli` generates `langgraph.json`; the workflow package does not scaffold it

Expected generated target-project `graph.ts`:

```ts
import { createGraph } from '@acme/coding';

export const graph = createGraph({ workflow: 'coding' });
```

## 4. Ship Embedded Default Prompt Snippets

Keep embedded default snippets in `src/templates/defaults/`.

Finalized default snippet set for the base coding workflow:

- `general.njk`
- `security.njk`
- `research-rules.njk`
- `typescript.njk`

MVP prompt rules:

- embedded defaults live inside the workflow package
- target-project overrides live in `.maw/templates/`
- prompt composition order is deterministic: global snippets first, then agent-specific snippets
- the target project can override a snippet globally by creating `.maw/templates/<name>.njk`

The finalized MVP removes the older `project-context.njk` pattern. OpenViking owns project-context retrieval instead of a static prompt snippet.

## 5. Define The Default Workflow Config

The embedded scaffold `config.json` is the single source of truth for the workflow's default prompt configuration.

Finalized workflow config shape:

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

Use this file to derive `DEFAULT_WORKFLOW_CONFIG` so the scaffolded file and the embedded runtime default cannot drift.

Merge behavior at runtime:

- missing keys inherit defaults
- explicit empty arrays also inherit defaults
- non-empty arrays replace the inherited value for that slot
- unspecified agents keep their default arrays

## 6. Export Template Metadata For Prompt Preview

`maw-cli prompt:preview` needs access to the embedded template directory.

Expose `templateDir` from `./scaffold` alongside `scaffold` and `createScaffoldFiles`.

Example pattern:

```ts
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const resolveTemplateDir = (): string => {
    const local = fileURLToPath(new URL('../templates/defaults', import.meta.url));
    if (existsSync(local)) return local;
    return fileURLToPath(new URL('../../src/templates/defaults', import.meta.url));
};

export const templateDir = resolveTemplateDir();
```

Expected result:

- local development and installed-package resolution both work
- `maw-cli prompt:preview` can find the embedded snippets in a published package

## 7. Load Project And Workflow Config At Runtime

The workflow runtime reads two config layers.

Project config from `maw.json`:

- if `maw.json` is missing, fall back to project defaults
- if `maw.json` exists but is invalid, throw instead of silently defaulting
- expect the Phase 4 project shape shown below; do not read `workspace` or OpenViking host/port fields from `maw.json`

Phase 4 project config shape:

```json
{
    "openviking": true,
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

OpenViking URL ownership lives in `.maw/ovcli.conf`, not in `maw.json`.

Workflow config from `.maw/graphs/<workflow>/config.json`:

- if the file is missing, use embedded defaults
- if the file exists but is invalid, warn and fall back to embedded defaults
- if a configured snippet name cannot be resolved, warn and retry once with embedded defaults

Runtime lookup order:

1. load project config from `maw.json`
2. resolve workflow config from `cfg.workflowConfig` or `.maw/graphs/<workflow>/config.json`
3. choose the active agent from `cfg.agent` or the first configured agent
4. compose the prompt from global snippets followed by agent-specific snippets

## 8. Implement The Graph Runtime

The package exports `createGraph()` from its main entrypoint. The generated target-project `graph.ts` calls that function with the workflow id.

Finalized graph usage:

```ts
import { createGraph } from '@acme/coding';

export const graph = createGraph({ workflow: 'coding' });
```

Graph naming rule:

```ts
graph.name = cfg.name ?? cfg.workflow ?? DEFAULT_GRAPH_NAME;
```

For the Phase 4 base coding workflow, the graph is expected to:

- use deterministic planner and coder prompts
- operate against the target project's codebase
- expose a controlled tool loop for file, shell, and git work
- stay compatible with the simplified OpenViking config surface in `maw.json` and `.maw/ovcli.conf`

Through Phase 4, live graph-time OpenViking retrieval stays deferred. `maw-cli dev <workflow>` is still the workflow runner, while target projects start and index OpenViking through `bun run maw:ov:server` and `bun run maw:ov:index -- <target-path>`.

Runtime constraint:

- use Bun for package management and test scripts
- keep shipped runtime code under `src/` Node-compatible so the installed package works under LangGraph and Node

## 9. Verify The Package Locally

Run these commands in the workflow package repo:

```bash
bun install
bun run build
bun run typecheck
bun run test
bun run test:int
```

Acceptance checks for the workflow package:

| Check | Expected result |
| --- | --- |
| package exports `./scaffold` | `maw-cli init` can discover the package |
| `createScaffoldFiles()` returns only `graph.ts` and `config.json` | scaffold contract matches the finalized MVP |
| `templateDir` resolves to embedded `.njk` files | prompt preview can find defaults |
| embedded config uses the prompt-only shape | runtime and scaffold defaults match |
| runtime throws on invalid `maw.json` | bad project config fails loudly |
| runtime warns and falls back on invalid workflow config | bad workflow config does not break the package |

## 10. Install The Package Into A Target Project

From the target project:

```bash
bun add @acme/coding@git+https://github.com/acme/coding.git
bun add -D maw-cli
bunx maw-cli init
```

Expected generated target-project layout:

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

What happened during `init`:

- `maw-cli` read the package's `./scaffold` export
- `maw-cli` created `.maw/graphs/coding/`
- the workflow package supplied `graph.ts` and `config.json`
- `maw-cli` generated `langgraph.json`
- `maw-cli` created `.maw/ov.conf` and `.maw/ovcli.conf` if they were missing
- `maw-cli` seeded missing `maw:ov:server` and `maw:ov:index` scripts into the target project's `package.json`

## 11. Run The End-To-End MVP Flow

Use this sequence when you want to validate the full author-to-consumer flow.

1. Build and verify the workflow package.

```bash
bun run build
bun run typecheck
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
- `.maw/graphs/coding/config.json`
- `.maw/graphs/coding/langgraph.json`

6. Preview prompts.

```bash
bunx maw-cli prompt:list coding
bunx maw-cli prompt:preview coding planner
bunx maw-cli prompt:preview coding coder
```

7. Start the target project's OpenViking server.

```bash
bun run maw:ov:server
```

8. Index an explicit target path.

```bash
bun run maw:ov:index -- .
```

9. Run the workflow.

```bash
bunx maw-cli dev coding
```

Through Phase 4, `bunx maw-cli dev coding` remains the workflow runner. The `maw:ov:*` scripts stay in the target project's `package.json`; the workflow package should not introduce a separate OpenViking wrapper command.

Expected result:

- the workflow package is discoverable by `maw-cli`
- prompt composition is deterministic and inspectable
- the workflow reads project config from `maw.json`
- the workflow reads workflow config from `.maw/graphs/coding/config.json`
- the target project starts and indexes OpenViking through `maw:ov:server` and `maw:ov:index`
- the workflow can operate on the target project's codebase through the finalized MVP tool loop

## Related Guide

For the target-project side of the same flow, see `docs/usage/mvp/maw-cli.md`.
