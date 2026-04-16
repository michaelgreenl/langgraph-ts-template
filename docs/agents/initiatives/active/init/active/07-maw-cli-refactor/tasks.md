# Phase 1 Plan: `maw-cli` Targeted Refactor

## Goal

Refactor `maw-cli` so it owns project-level MAW infrastructure and no longer assumes a single root-level workflow scaffold. After this phase, `maw-cli init` creates `maw.json`, `.maw/templates/`, `.maw/ov.conf`, and one `.maw/graphs/<workflow>/` directory per discovered workflow, while `maw-cli dev <workflow>` runs exactly one workflow via that workflow's local `langgraph.json`.

## Scope

- `maw-cli/src/commands/init.ts`
- `maw-cli/src/commands/dev.ts`
- `maw-cli/src/commands/start.ts` removal
- `maw-cli/src/commands/shared.ts`
- `maw-cli/src/utils/config.ts`
- `maw-cli/src/utils/langgraph.ts`
- `maw-cli/src/index.ts` help text, command registry, and command summaries
- `maw-cli/tests/*.test.ts` coverage for `init`, `dev`, config loading, CLI help, and `start` removal
- `maw-smoke/maw-smoke-1/` smoke coverage for standalone `maw-cli init` and `maw-cli dev <workflow>`
- `maw-cli`'s expected next scaffold contract, exercised with fixture workflow packages in tests

## Out of Scope

- `langgraph-ts-template` implementation changes to publish the new scaffold contract (Phase 2)
- Template-side cleanup of stale `start` references outside `maw-cli` (Phase 2)
- `maw-cli prompt:list` and `maw-cli prompt:preview` (Phase 3)
- `maw-cli ov:init` and `maw-cli ov:index` (Phase 4)
- Docker- or `up`-based LangGraph launch flows, or any replacement for the removed `start` command
- Base workflow runtime tools, model wiring, or tool-loop behavior (Phase 5)

## Execution Notes

- Workflow directory names come from `scaffold.workflow`, not the npm package name.
- Phase 1 should not add backward-compatibility code for the old scaffold contract. Use fixture workflow packages in `maw-cli` tests and smoke coverage, then land the real template-side contract in Phase 2.
- `maw.json` is literal-only project config; it does not support `${VAR}` interpolation.
- `maw-cli init` always bootstraps project-level scaffold files and warns, rather than failing, when no workflows are installed yet.
- `maw-cli init` only appends `.maw/openviking/` to `.gitignore`.
- `langgraphjs --config <dir>` resolves `langgraph.json` inside that directory, and graph and env paths are relative to that workflow directory. Phase 1 should therefore generate `./graph.ts:graph` and `../../../.env`.
- Workflow-local `langgraph.json` omits `dependencies` in Phase 1.
- `start` is removed from `maw-cli` in Phase 1; `dev <workflow>` is the only runtime command in scope.

## Work Plan

### 1. Narrow Project Config Handling to `maw.json`

- [x] Shrink the config type to project-level fields only; do not keep workflow-specific prompt, agent, graph, or model settings in `maw.json`
- [x] Replace the current `MawConfig` shape in `maw-cli/src/utils/config.ts` with the Phase 1 project config shape:

    ```ts
    export interface MawProjectConfig {
        workspace: string;
        openviking: {
            enabled: boolean;
            host: string;
            port: number;
        };
        templates: {
            customPath: string;
        };
    }
    ```

- [x] Drop env interpolation logic from the project config reader; `maw.json` should be parsed as literal JSON only
- [x] Update `ensureConfig(root)` or replace it with a clearer helper that validates `maw.json`
- [x] Update `maw-cli/tests/config.test.ts` for the new file path, reduced config shape, and literal-only parsing behavior
- [x] Update the public export from `maw-cli/src/index.ts` if the config type name changes

### 2. Move Project-Owned Scaffold Assets into `maw-cli`

- [ ] Add `maw-cli`-owned generators or constants for `maw.json` and `.maw/ov.conf`; these files should no longer come from the workflow package scaffold
- [ ] Generate `maw.json` with the new minimal project-level shape:

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

- [ ] Replace every `maw-cli` path assumption for `.maw/config.json` with the root-level `maw.json`
- [ ] Generate `.maw/ov.conf` from `maw-cli` with project-wide OpenViking placeholders and no workflow-specific content
- [ ] Create `.maw/templates/` and `.maw/graphs/` from `maw-cli init`
- [ ] Append `.maw/openviking/` to `.gitignore` if missing, and do not add any other MAW scaffold paths
- [ ] Remove the assumption that project-level directories come from workflow-owned `scaffold.directories`

### 3. Redesign Workflow Discovery Around the Next Scaffold Contract

- [ ] Replace `loadWorkflow()` in `maw-cli/src/commands/init.ts` with `loadWorkflows()` that returns every installed workflow package exposing `./scaffold`
- [ ] Update the `maw-cli`-side workflow module contract to use `scaffold.workflow` as the short workflow identifier, for example:

    ```ts
    interface WorkflowScaffold {
        packageName: string;
        workflow: string;
    }

    interface WorkflowModule {
        scaffold: WorkflowScaffold;
        createScaffoldFiles: () =>
            | Record<'graph.ts' | 'config.json', string>
            | Promise<Record<'graph.ts' | 'config.json', string>>;
    }
    ```

- [ ] Treat `workflow` as the directory name for `.maw/graphs/<workflow>/`
- [ ] Sort discovered workflows by `workflow` so `init` output is deterministic
- [ ] Return an empty workflow list when none are found; `init` handles bootstrap-and-warn behavior
- [ ] Fail when two workflow packages claim the same `workflow` name
- [ ] Add fixture workflow packages in `maw-cli/tests/` that implement the new contract so Phase 1 can be built and tested without waiting for Phase 2

### 4. Rewrite `maw-cli init` for Multi-Workflow Project Scaffolding

- [ ] Update `runInit()` so it creates `maw.json` if missing
- [ ] Update `runInit()` so it creates `.maw/templates/`, `.maw/graphs/`, and `.maw/ov.conf` if missing
- [ ] If no workflows are discovered, print a warning and return `0` after project-level scaffold creation completes
- [ ] For each discovered workflow, create `.maw/graphs/<workflow>/`
- [ ] Write workflow-owned `graph.ts` and `config.json` into `.maw/graphs/<workflow>/`
- [ ] Generate workflow-local `langgraph.json` from `maw-cli`, not from the workflow package
- [ ] Preserve existing files on rerun at every layer: `maw.json`, `.maw/ov.conf`, `.maw/templates/`, and per-workflow files
- [ ] Stop writing legacy files from `maw-cli init`: `.maw/config.json`, `.maw/graph.ts`, and root `langgraph.json`
- [ ] Update success and warning output so the command clearly distinguishes zero-workflow bootstrap from initialized workflows
- [ ] Update `maw-cli/tests/init.test.ts` to cover zero, one, and multiple workflow packages plus rerun preservation and `.gitignore` behavior

### 5. Generate Workflow-Local `langgraph.json`

- [ ] Replace the root-level `LANGGRAPH_JSON` constant with a generator that produces `.maw/graphs/<workflow>/langgraph.json`
- [ ] Key the `graphs` map by workflow name instead of the old hardcoded `agent` key
- [ ] Generate the graph entry relative to the workflow directory, pointing at `./graph.ts:graph`
- [ ] Generate `env` as `../../../.env` so each workflow uses the target project's root `.env`
- [ ] Omit `dependencies` from workflow-local `langgraph.json`
- [ ] Add regression coverage so the old root-level `['.']` value is not copied into the nested config
- [ ] Add a helper that validates required workflow-local files exist before `dev` launch

### 6. Require Workflow Arguments in `dev` and Remove `start`

- [ ] Update command summaries and help text in `maw-cli/src/index.ts` to show `maw-cli dev <workflow>` as the only runtime command
- [ ] Remove `start` from the command registry and delete `maw-cli/src/commands/start.ts`
- [ ] Simplify or replace the old shared `runLanggraph` abstraction so it no longer models both `dev` and `start`
- [ ] Parse the first positional arg as the workflow name and forward the remaining args to `langgraphjs`
- [ ] Missing workflow name returns exit code `1` with a clear usage error
- [ ] Validate that `maw.json` exists before launching
- [ ] Validate that `.maw/graphs/<workflow>/` exists before launching
- [ ] Validate that `.maw/graphs/<workflow>/graph.ts`, `config.json`, and `langgraph.json` all exist before launching
- [ ] Invoke `langgraphjs dev --config .maw/graphs/<workflow>`
- [ ] Stop calling the old root-level `ensureLanggraphJson(root)` path from `dev`
- [ ] Update `maw-cli/tests/dev.test.ts` and `maw-cli/tests/cli.test.ts` for the new argument contract and command surface

### 7. Expand Unit Coverage for the Refactor

- [ ] `maw-cli/tests/init.test.ts` covers multi-workflow discovery, no-workflow bootstrap-and-warn behavior, workflow-name collisions, new project scaffold files, rerun preservation, and absence of legacy root files
- [ ] `maw-cli/tests/init.test.ts` also covers `.gitignore` appending `.maw/openviking/` exactly once and not adding `maw.json` or `.maw/ov.conf`
- [ ] `maw-cli/tests/dev.test.ts` covers missing workflow arg, missing `maw.json`, missing workflow dir, missing workflow-local files, and forwarded extra args
- [ ] `maw-cli/tests/config.test.ts` covers the new `maw.json` shape and literal-only parsing behavior
- [ ] `maw-cli/tests/cli.test.ts` covers updated help output and confirms `start` is no longer listed as a valid command
- [ ] Remove or replace any test file that exists only to cover the retired `start` command

### 8. Update Smoke Coverage for the Standalone `maw-cli` Flow

- [ ] Update `maw-smoke/maw-smoke-1/` so `maw-cli` is exercised as a standalone tool alongside fixture workflow packages that implement the next scaffold contract
- [ ] Add or replace a smoke script for `init` that proves `maw-cli init` creates:
    - `maw.json`
    - `.maw/templates/`
    - `.maw/ov.conf`
    - `.maw/graphs/docs-agent/graph.ts`
    - `.maw/graphs/docs-agent/config.json`
    - `.maw/graphs/docs-agent/langgraph.json`
    - `.maw/graphs/code-agent/...`

- [ ] The `init` smoke test also proves `.gitignore` only adds `.maw/openviking/`
- [ ] The `init` smoke test also proves workflow-local `langgraph.json` uses `./graph.ts:graph`, `../../../.env`, and omits `dependencies`
- [ ] The `init` smoke test reruns `maw-cli init` after editing one generated file and confirms the file is preserved
- [ ] Update `smoke:dev` so it exercises `maw-cli dev docs-agent`, not bare `maw-cli dev`
- [ ] The `dev` smoke test proves the command targets `.maw/graphs/docs-agent/langgraph.json` and does not depend on a shared root `langgraph.json`
- [ ] Keep smoke fixtures phase-local; do not block Phase 1 on the real `langgraph-ts-template` package contract landing first

## Verification

- [ ] `bun run build` in `maw-cli/`
- [ ] `bun run lint` in `maw-cli/`
- [ ] `bun run test` in `maw-cli/`
- [ ] Smoke: `bun run smoke:init` in `maw-smoke/maw-smoke-1/`
- [ ] Smoke: `bun run smoke:dev` in `maw-smoke/maw-smoke-1/`

## Exit Criteria

- [ ] `maw-cli init` creates `maw.json`, `.maw/templates/`, `.maw/ov.conf`, and one `.maw/graphs/<workflow>/` directory per discovered workflow
- [ ] `maw-cli init` still bootstraps `maw.json`, `.maw/templates/`, `.maw/graphs/`, and `.maw/ov.conf` when no workflows are installed, and warns instead of failing
- [ ] Workflow directory names come from `scaffold.workflow`, not npm package names
- [ ] Rerunning `maw-cli init` preserves existing project-owned and workflow-local files
- [ ] `.gitignore` only appends `.maw/openviking/`
- [ ] Workflow-local `langgraph.json` uses `./graph.ts:graph`, `../../../.env`, and omits `dependencies`
- [ ] `maw.json` is treated as literal-only project config with no env interpolation behavior
- [ ] `maw-cli dev <workflow>` fails fast when the workflow arg or required workflow-local files are missing
- [ ] `maw-cli dev docs-agent` launches `langgraphjs` with `--config .maw/graphs/docs-agent`
- [ ] `start` is no longer part of the `maw-cli` command surface
- [ ] Multi-workflow unit tests and standalone smoke coverage pass without relying on temporary backward-compatibility code for the old scaffold contract or any Docker-based launch path
