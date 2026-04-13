# MAW (Model Accelerated Workflow) — Initialization Plan

## Architecture

```
┌──────────────────────────────────────────┐
│  THIS REPO: langgraph-ts-template        │
│  Template for building maw-cli-compatible│
│  workflow packages                       │
├──────────────────────────────────────────┤
│  NEW REPO: maw-cli (CLI package)         │
│  Published separately, workflows depend  │
│  on it. Wraps langgraph-cli + adds:      │
│  init, ov:init, ov:index commands        │
└──────────────────────────────────────────┘
         │ Developer derives workflows from template
         ▼
┌──────────────────────────────────────────┐
│  WORKFLOW PACKAGE (e.g. docs-agent)      │
│  Built from this template                │
│  Installed into target projects via:     │
│  bun add docs-agent@git+https://...      │
└──────────────────────────────────────────┘
         │ Installed into target project
         ▼
┌──────────────────────────────────────────┐
│  TARGET PROJECT                          │
│  .maw/config.json  (workflow config)     │
│  .maw/templates/   (custom snippets)     │
│  .maw/ov.conf      (OpenViking config)   │
│  npx maw-cli init   → scaffold .maw/     │
│  npx maw-cli dev    → start dev server   │
│  npx maw-cli ov:init→ setup OpenViking   │
│  npx maw-cli ov:index→ index project     │
└──────────────────────────────────────────┘
```

## Naming

- **CLI**: `maw-cli`
- **Package name**: workflow-specific (e.g. `docs-agent`), set by developer
- **Package scope**: workflow/agent being installed into the target project
- **Config directory**: `.maw/`

## Phase 1: Tooling Migration

### 1a. Migrate to Bun

- [x] complete

- Replace all yarn scripts with bun equivalents in `package.json`
- Update `packageManager` field
- Update CI workflows (`yarn install --immutable` → `bun install --frozen-lockfile`)
- Replace `bun.lock` with fresh lockfile from `bun install`

### 1b. Migrate Jest → Vitest

- [x] complete

- Install `vitest`, remove `jest`, `ts-jest`, `@types/jest`
- Create `vitest.config.ts` (ESM-native, no moduleNameMapper)
- Update test files for Vitest API compatibility
- Remove `jest.config.js`
- Remove `jest` from `tsconfig.json` types
- Update `package.json` scripts
- Update CI workflows

### 1c. Add Changesets + VERSIONING doc

- [x] complete

- Install `@changesets/cli`, init changesets
- Add `version` and `publish` scripts to `package.json`
- Write `VERSIONING.md` explaining the workflow

## Phase 2: Package Restructuring

Refactor this template so workflows derived from it are installable npm packages.

### 2a. Directory structure

- [x] complete

```
src/
  index.ts                    # Public API: createGraph, createConfig, etc.
  agent/
    graph.ts                  # Graph factory: createGraph(config) → compiled graph
    state.ts                  # StateAnnotation (shared)
  templates/
    engine.ts                 # Nunjucks template engine
    composition.ts            # Snippet composition logic (global + per-agent)
    defaults/                 # Embedded default snippet templates
      general-coding.njk
      typescript.njk
      python.njk
      project-context.njk
      research-rules.njk
      security.njk
  openviking/
    client.ts                 # HTTP client for OV server API
    scanner.ts                # Pre-index incompatible file type scanner
    config.ts                 # ov.conf generation
```

### 2b. `package.json` updates

- [x] complete

- `name`: workflow-specific (set by developer)
- Add `bin` field pointing to CLI entry
- Add `exports` field for programmatic use
- Add `files` field to control published contents
- Add `maw-cli` as a dependency
- Fix stale `main` field (currently points to `my_app/graph.ts`)

### 2c. Target project scaffold

- [x] complete

`npx maw-cli init` creates in the target project:

```
.maw/
  config.json                 # Workflow + template configuration
  ov.conf                     # OpenViking config (pre-configured for OpenAI, needs API key)
  templates/                  # Custom snippet overrides (empty, ready for use)
  graph.ts                    # Entry point: re-exports compiled graph from installed workflow
.gitignore                    # Adds .maw/ov.conf (contains API keys)
```

#### `.maw/config.json`

```json
{
    "workspace": ".",
    "graph": {
        "name": "agent"
    },
    "openviking": {
        "enabled": true,
        "host": "localhost",
        "port": 1933
    },
    "llm": {
        "provider": "openai",
        "apiKey": "${OPENAI_API_KEY}"
    },
    "templates": {
        "sources": ["embedded", "custom"],
        "customPath": ".maw/templates",
        "gitRepos": [],
        "globalSnippets": ["general-coding", "security", "project-context"],
        "agents": {
            "researcher": {
                "snippets": ["research-rules", "python"]
            },
            "coder": {
                "snippets": ["typescript", "coding-rules"]
            }
        }
    }
}
```

#### Environment variable support for secrets

Any field in `.maw/config.json` that holds a secret (API keys, tokens, passwords) supports environment variable interpolation using the `${VAR_NAME}` syntax:

- `"apiKey": "${OPENAI_API_KEY}"` — resolved from the process environment at runtime
- `"apiKey": "sk-abc123"` — also works as a plain value, but strongly discouraged (devs should prefer env vars)

The config loader resolves these before any code accesses them:

```ts
// config/loader.ts
function resolveEnvVars(obj: Record<string, unknown>): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            resolved[key] = value.replace(/\$\{(\w+)\}/g, (_, varName) => {
                const envVal = process.env[varName];
                if (envVal === undefined) {
                    throw new Error(`Environment variable ${varName} is not set but referenced in .maw/config.json`);
                }
                return envVal;
            });
        } else if (typeof value === 'object' && value !== null) {
            resolved[key] = resolveEnvVars(value as Record<string, unknown>);
        } else {
            resolved[key] = value;
        }
    }
    return resolved;
}
```

The `.gitignore` generated by `maw-cli init` should include `.maw/ov.conf` and `.maw/config.json` entries that contain secrets, or at minimum alert the user that these files may contain sensitive values and should not be committed.

### 2d. System prompt composition in the graph

- [x] complete

The graph uses Nunjucks to render each agent's system prompt from composed snippets. The system prompt is a `SystemMessage` placed as the first message in the conversation state. It's composed once when the graph initializes, then persists through the conversation.

Snippet rendering order is determined by array order in the config:

```
system_prompt(researcher) = general-coding + security + project-context + research-rules + python
system_prompt(coder)      = general-coding + security + project-context + typescript + coding-rules
```

Template resolution priority (higher wins on name collision):

1. `.maw/templates/` (local custom) — highest priority
2. `.maw/template-repos/` (cloned git repos) — medium priority
3. Package embedded defaults — fallback, always available

```ts
// Agent-specific prompt composition
const systemPrompt = await engine.compose('researcher', {
    projectType: 'typescript',
    workspacePath: config.workspace,
    openvikingContext: gatheredContext, // from OV if enabled
});
```

### 2e. Generated langgraph.json in target project

- [x] complete

```json
{
    "node_version": "20",
    "graphs": {
        "agent": "./.maw/graph.ts:graph"
    },
    "env": ".env",
    "dependencies": ["."]
}
```

Where `.maw/graph.ts` is a minimal entry point:

```ts
import { createGraph } from 'docs-agent';
export const graph = createGraph();
```

## Phase 3: `maw-cli` CLI Package (Separate Repo)

- [ ] complete

```
maw-cli/
  src/
    index.ts                  # CLI entry point
    commands/
      init.ts                 # maw-cli init - scaffold .maw/ in target project
      dev.ts                  # maw-cli dev - wrapper around langgraph-cli dev
      start.ts                # maw-cli start - wrapper around langgraph-cli for production
      ov-init.ts              # maw-cli ov:init - generate ov.conf, verify Python/OV available
      ov-index.ts             # maw-cli ov:index - scan incompatible files + run indexing
    utils/
      config.ts               # Read/validate .maw/config.json
      ov.ts                   # OpenViking helpers (check install, start server)
      scanner.ts              # File type scanner for incompatible OV files
  package.json                # name: "maw-cli", bin: { "maw-cli": "./bin/maw-cli.js" }
```

The `dev` and `start` commands delegate to `@langchain/langgraph-cli` — they detect the installed workflow package, wire up the `langgraph.json`, and run the LangGraph server. No need to rebuild that functionality.

### CLI commands

```
maw-cli init       # Scaffold .maw/ config in target project
maw-cli dev        # Start LangGraph dev server (wraps langgraph-cli)
maw-cli start      # Start production server (wraps langgraph-cli)
maw-cli ov:init    # Generate .maw/ov.conf, verify Python/OV available
maw-cli ov:index   # Scan for incompatible files, then index project
```

### 3a. Package structure & CLI skeleton

- [x] complete

- Repository with `package.json` shape (`name`, `bin`, `exports`, `files`)
- `src/index.ts` — command routing, `parseCommandName`, `formatHelp`, `runCli`
- `bin/maw-cli.js` — published bin wrapper with dual-path resolution
- Placeholder stubs for all 5 commands registered in router
- Test suite: CLI routing, bin smoke test, package metadata validation
- TypeScript, Vitest, and Prettier config

### 3b. `maw-cli init`

- [x] complete

- Workflow auto-discovery via `./scaffold` export contract
- Scaffold directory + file creation (missing files only, idempotent)
- `.gitignore` merge (deduped, append-once)
- Integration tests against real temp filesystem

### 3c. `utils/config.ts`

- [x] complete

- Read and parse `.maw/config.json` from the target project root
- Resolve `${VAR_NAME}` env var interpolation recursively (matching the loader spec in 2c)
- Typed `MawConfig` schema matching the config shape defined in 2c
- Throw with a clear message if config file is missing or a referenced env var is unset
- Unit tests: happy path, missing config file, unset env var, nested interpolation

### 3d. `maw-cli dev` & `maw-cli start`

- [ ] complete

- Add `@langchain/langgraph-cli` as a runtime dependency
- Implement `dev`: read `.maw/config.json` via `utils/config`, generate/verify `langgraph.json` in target project root (matching spec in 2e), exec `langgraph-cli dev`
- Implement `start`: mirrors `dev` but invokes langgraph-cli production server mode
- Tests: config-not-found error path, correct `langgraph.json` shape generated, delegation to langgraph-cli

## Phase 4: OpenViking Integration

### 4a. `maw-cli ov:init`

- [ ] complete

- Checks for Python + pip availability
- Offers to install OpenViking (`pip install openviking`)
- Generates `.maw/ov.conf` with OpenAI embedding provider (API key via env var: `"api_key": "${OPENAI_API_KEY}"`)
- Validates the config

### 4b. `maw-cli ov:index`

- [ ] complete

- Scans target project for file types OpenViking can't parse
- Builds an exclusion list (binary formats, large files, etc.)
- Ensures OpenViking server is running (offers to start it)
- Executes `ov add-resource <workspace-path>` with ignore flags
- Reports indexing status

### 4c. Graph integration

- [ ] complete

A dedicated node in the graph calls OpenViking's HTTP API for context retrieval:

```ts
const context = await ovClient.find(userQuery, {
    targetUri: 'viking://resources/project',
});
```

Context gets injected into the Nunjucks template rendering for the `project-context` snippet.

## Execution Order

```
Phase 1a (bun)
   → Phase 1b (vitest)
      → Phase 1c (changesets + VERSIONING.md)
         → Phase 2 (restructure)
            → Phase 3 (maw-cli package — separate repo)
            → Phase 4 (OpenViking integration)
```

Phases 3 and 4 can be parallelized once Phase 2 is complete.

## Installation Model

Workflows are installed into target projects via git URL (no npm publishing required):

```bash
bun add docs-agent@git+https://github.com/org/docs-agent.git
# or SSH:
bun add docs-agent@git+ssh://git@github.com/org/docs-agent.git
```

The `maw-cli` package follows the same model — it can be installed globally or used via `npx`/`bunx` without publishing to npm.
