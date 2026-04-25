# Phase 6 Plan: Opencode Interactive Runtime

## Goal

Replace the old workflow-local `config.json` plus Nunjucks prompt surface with a raw workflow-local `opencode.json`, and make bundled opencode the primary interactive runtime behind `maw-cli dev <workflow>`. After this phase, the base workflow should default to visible primary `planner` and `manager` agents plus hidden `coder`, start on `planner`, auto-handoff to `manager` on explicit execute, validate edited workflow-local `opencode.json` files before launch, and keep the direct LangGraph `/runs/wait` path alive only as a separate compatibility and smoke surface.

## Scope

- `langgraph-ts-template/package.json`, `src/scaffold/**`, `src/index.ts`, and any adjacent runtime helpers under `src/` that still assume workflow-local `config.json`, Nunjucks prompt composition, or prompt inspection exports - replace the workflow config surface with raw `opencode.json` plus a workflow-owned validator.
- `langgraph-ts-template/src/agent/**` and related runtime helpers - keep the retained LangGraph compatibility runtime runnable after the scaffold reset without depending on the retired prompt-template surface.
- `langgraph-ts-template/tests/{unit,integration}/**` - cover the new workflow-local `opencode.json` scaffold asset, validation contract, and retained compatibility path.
- `maw-cli/package.json`, `src/commands/{init,dev}.ts`, `src/index.ts`, `src/utils/**`, and any new opencode launch helper - bundle the opencode runtime, remove the remaining `maw.json` dependency from the active contract, scaffold workflow-local `opencode.json`, retire prompt commands, validate workflow config, and launch planner-first interactive or server-only runtime flows.
- `maw-cli/tests/**` - cover init/dev/runtime behavior, prompt-command retirement, and retained compatibility generation.
- `README.md`, `docs/usage/mvp/{maw-cli,langgraph-ts-template}.md`, and `docs/agents/initiatives/active/init/init-plan.md` - align active docs with raw workflow-local `opencode.json`, planner/manager/coder defaults, and prompt-command retirement.
- `../maw-smoke/docs/agents/smoke-logs/phase6-opencode-interactive-runtime.md` - record final interactive, server-only, and direct LangGraph compatibility smoke results.

## Out of Scope

- Live OpenViking retrieval inside the interactive workflow or the retained LangGraph compatibility path; that lands in Phase 7.
- Reworking the retained LangGraph compatibility path into full `planner -> manager -> coder` parity. In Phase 6 it only needs to stay runnable and smokeable.
- Shared project-wide opencode config spanning multiple installed workflows.
- Additional helper-agent topologies beyond the default visible `planner` / `manager` plus hidden `coder` workflow.
- Broad cleanup of archived `complete/` phase docs beyond narrow wording needed in active docs.

## Decisions Cleared

- `.maw/graphs/<workflow>/opencode.json` is the workflow runtime config authority and uses raw opencode schema.
- There is no project-root `maw.json` in the active contract after Phase 6; MAW scope resolves from the nearest ancestor containing `.maw/`.
- `.maw/graphs/<workflow>/config.json`, Nunjucks prompt composition, `.maw/templates/`, and `maw-cli prompt:list` / `maw-cli prompt:preview` are retired from the active MVP contract.
- Workflow packages ship both the default scaffolded `opencode.json` asset and a validator or schema export for the workflow-required `opencode.json` shape. `maw-cli` uses that validator during `init` and `dev`.
- The scaffolded `planner` / `manager` / `coder` descriptions, modes, hidden flags, and permission baselines come from `.opencode/agents/{planner,manager,coder}.md` frontmatter in the workflow package. If the SDK needs explicit deny/default entries, update those agent files and the scaffold contract together instead of introducing a separate baseline config surface.
- The base workflow default visible primary agents are exactly `planner` and `manager`, with hidden subagent `coder` and `default_agent: "planner"`.
- `maw-cli dev <workflow>` launches bundled opencode directly in TTY mode and starts on `planner`.
- A non-TTY `maw-cli dev <workflow>` run launches the same bundled opencode workflow in server-only mode so SDK harness tests can drive planner and manager interactions headlessly.
- An explicit execute request hands the active workflow off from `planner` to `manager`.
- `manager` auto-commits clean results as part of the interactive workflow contract. This is an explicit exception to the usual repo-wide preference to avoid auto-committing without user direction.
- The direct LangGraph `/runs/wait` path remains separate from `maw-cli dev <workflow>` and is exercised through direct `@langchain/langgraph-cli` invocation only for compatibility and smoke.

## Execution Notes

### Workflow-local scaffold contract

Phase 6 changes the workflow-local target-project contract to this shape:

```text
.maw/graphs/<workflow>/
  graph.ts
  opencode.json
  langgraph.json
```

Rules:

- `graph.ts` remains the retained LangGraph compatibility entry point only.
- `opencode.json` is the single project-local prompt, context, permission, and model/provider surface.
- `langgraph.json` remains generated by `maw-cli` for direct compatibility smoke only.
- `maw-cli init` no longer creates `.maw/templates/`, does not scaffold `config.json`, and does not create a project-root `maw.json`.

### MAW scope after `maw.json` removal

Phase 6 removes the old project-root scope marker.

Required behavior:

- `maw-cli init` creates `.maw/` in the current working directory after confirming that directory is a valid target project root
- commands that need an initialized MAW scope resolve it from the nearest ancestor containing `.maw/`
- commands fail clearly when no ancestor contains `.maw/`
- Phase 6 does not reintroduce a runtime OpenViking retrieval toggle anywhere else; Phase 7 may revisit that only through a custom install option or workflow-local configuration if the later runtime contract needs it

### Workflow validator contract

The workflow package, not `maw-cli`, owns validation of the workflow-required `opencode.json` shape.

Required behavior:

- the workflow package exports a validator or schema alongside the scaffold contract
- the validator must enforce the required `planner` / `manager` / hidden `coder` topology plus the per-agent permission baselines sourced from `.opencode/agents/{planner,manager,coder}.md` frontmatter
- if the SDK needs explicit deny/default fields beyond the current frontmatter, make that a single contract update in those agent files and the scaffolded `opencode.json`, not a separate config layer
- `maw-cli init` uses the workflow package's default `opencode.json` asset when materializing missing workflow files
- `maw-cli dev` loads the same validator before runtime launch
- invalid edited `opencode.json` fails clearly before any interactive or server-only runtime starts

### `maw-cli dev <workflow>` launch rules

Phase 6 uses these exact runtime-selection rules:

```text
TTY      -> bunx maw-cli dev <workflow> -> bundled opencode interactive runtime, initial agent planner
non-TTY  -> bunx maw-cli dev <workflow> -> bundled opencode server-only runtime for SDK harnesses
compat   -> bunx @langchain/langgraph-cli dev --config .maw/graphs/<workflow>
```

Implications:

- `maw-cli dev <workflow>` no longer shells to LangGraph for the interactive base workflow
- retained LangGraph smoke stays direct and separate
- the compatibility path does not need planner/manager parity in Phase 6

### Step boundary for scaffold contract changes

When a step changes the workflow-owned scaffold contract, that same step must keep the scaffold-facing integration handoff green enough for the repo hooks to pass.

Required behavior:

- do not defer `tests/integration/scaffold.test.ts` updates to a later compatibility-only step when the scaffold contract itself changed earlier
- later steps may still own compatibility-runtime behavior, but the public scaffold handoff must stay independently committable at the end of the step that changed it

### Manager auto-commit contract

The shipped manager workflow should preserve the clean-step commit rule from the existing repo-local opencode setup.

Exact rule:

- a step is clean only when all tasks for that step are complete, required verification passed, and no unresolved issue remains
- if the step is clean, `manager` commits each modified repo separately using the same Conventional Commit message derived from the executed step and its step log
- if any issue remains, `manager` stops and does not commit anything

### Retained LangGraph compatibility smoke request

Use this exact `/runs/wait` request when proving the separate direct LangGraph compatibility path:

```bash
curl --silent --show-error --fail \
    --request POST \
    --url http://localhost:2024/runs/wait \
    --header 'Content-Type: application/json' \
    --data '{
        "assistant_id": "langgraph-ts-template",
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": "Phase 6 compatibility smoke request."
                }
            ]
        }
    }'
```

## Work Plan

### 1. Replace the workflow-local config surface with raw `opencode.json`

This step resets the workflow package contract before any CLI launch changes land. It owns the new scaffolded `opencode.json` asset, the workflow-owned validator, retirement of package exports that only existed for the old `config.json` plus Nunjucks prompt surface, and the scaffold-facing integration handoff needed to keep the step independently committable. It must not yet change `maw-cli` runtime launch behavior.

- [x] `langgraph-ts-template/src/scaffold/**` and related package exports: replace the scaffolded `config.json` asset with a default raw `opencode.json` that ships the base `planner` / `manager` / hidden `coder` contract and exposes the workflow validator
- [x] `langgraph-ts-template/src/{config.ts,templates/**,index.ts}` and any adjacent helper that only served `config.json`, Nunjucks composition, or prompt inspection: retire or replace that surface so the public package contract matches the new scaffold model
- [x] `langgraph-ts-template/tests/unit/{config.spec.ts,templates.spec.ts,scaffold.spec.ts,public-api.spec.ts,package-metadata.spec.ts}` and related fixtures: replace old prompt-config expectations with `opencode.json` scaffold and validator coverage
- [x] `langgraph-ts-template/tests/integration/scaffold.test.ts` and any adjacent fixtures: replace the old workflow-owned scaffold handoff expectations so the new `opencode.json` contract stays independently verifiable under repo hooks

Verify:

- [x] `bun run build`
- [x] `bun run lint`
- [x] `bun run typecheck`
- [x] `bun run test`
- [x] `bun run test:int -- tests/integration/scaffold.test.ts`

### 2. Keep the retained LangGraph compatibility runtime runnable after the reset

This step owns the headless compatibility path only. It must remove the retained runtime's dependency on the retired workflow-local `config.json` and Nunjucks surface while keeping direct LangGraph smoke working. It must not try to force planner/manager parity into the compatibility path.

- [x] `langgraph-ts-template/src/agent/**` and any adjacent runtime helper: replace runtime assumptions that still read `.maw/graphs/<workflow>/config.json` or Nunjucks-driven prompt data so the direct LangGraph compatibility path still runs from the new scaffold contract
- [x] `langgraph-ts-template/src/index.ts`: keep the retained `createGraph` compatibility API aligned with the new workflow contract after config/template retirement
- [x] `langgraph-ts-template/tests/integration/graph.test.ts` and `tests/unit/{graph.spec.ts,agent.spec.ts}`: prove the retained direct LangGraph compatibility runtime still compiles and runs without the old prompt surface

Verify:

- [x] `bun run build`
- [x] `bun run test:int -- tests/integration/graph.test.ts`

### 3. Teach `maw-cli` to scaffold and launch the interactive opencode runtime

This step owns the CLI/runtime transition. It must bundle the opencode runtime dependency, scaffold workflow-local `opencode.json`, retire prompt commands, validate workflow config through the workflow package validator, and launch the bundled planner-first runtime in TTY or server-only mode. It must not yet do the final smoke proof.

- [x] `maw-cli/package.json` and any new runtime utility: add the bundled opencode runtime dependency needed for `dev`
- [x] `maw-cli/src/commands/{init,dev}.ts`, `src/index.ts`, `src/utils/**`, and workflow-resolution helpers: remove the active `maw.json` dependency, scaffold `.maw/graphs/<workflow>/opencode.json`, stop creating `.maw/templates/`, retire `prompt:list` and `prompt:preview`, validate the workflow-local `opencode.json`, and launch bundled opencode with `OPENCODE_CONFIG` in TTY and non-TTY modes
- [x] `maw-cli/tests/{init.test.ts,dev.test.ts,cli.test.ts,langgraph.test.ts,package-metadata.test.ts,bin.test.ts}` and any prompt-command tests or fixtures that must be replaced: cover prompt-command retirement, workflow validation failures, TTY planner-first launch, non-TTY server-only launch, and retained compatibility file generation

Verify:

- [x] `bun run build`
- [x] `bun run test`

### 4. Align active docs to the raw `opencode.json` contract

This step keeps the active docs honest. It owns current contract wording only. It must replace active references to workflow-local `config.json`, Nunjucks, `.maw/templates/`, and `maw-cli prompt:*` with the new workflow-local `opencode.json` and `planner` / `manager` / hidden `coder` workflow model.

- [x] `docs/agents/initiatives/active/init/init-plan.md`: align the active initiative contract with raw workflow-local `opencode.json`, bundled opencode runtime launch, `maw.json` removal, prompt-command retirement, and retained LangGraph compatibility smoke
- [x] `README.md` and `docs/usage/mvp/{maw-cli,langgraph-ts-template}.md`: replace old prompt-composition guidance with workflow-local `opencode.json` and the interactive planner-to-manager execution flow
- [x] Any active doc outside `complete/` that still describes `.maw/templates/`, workflow-local `config.json`, Nunjucks prompt composition, or `maw-cli prompt:*`: either align it or mark it as explicitly historical

Verify:

- [x] `rg "opencode.json|planner|manager|coder|maw-cli dev" README.md docs/usage/mvp docs/agents/initiatives/active/init/init-plan.md`
- [x] Manual review: any remaining mentions of `.maw/templates/`, workflow-local `config.json`, Nunjucks, or `maw-cli prompt:*` in active docs are clearly labeled as superseded history rather than active contract

### 5. Prove planner and manager interactive flows plus retained LangGraph smoke

This step owns the end-to-end proof. It must show the bundled opencode runtime works in TTY and non-TTY modes, that planner starts first, that execute hands off to manager, and that the retained direct LangGraph compatibility path still serves `/runs/wait`. It must log the final evidence in `../maw-smoke/`.

- [x] `../maw-smoke`: run `bun smoke-init phase6-opencode-interactive-runtime` and then `bunx maw-cli init` inside `tests/smoke-phase6-opencode-interactive-runtime/`
- [x] In TTY mode inside that smoke project: run `bunx maw-cli dev langgraph-ts-template`, confirm planner is the initial agent, explicitly request execution, and record the handoff to manager plus coder-backed step execution and auto-commit behavior
- [x] In non-TTY mode for the same smoke project: run `bunx maw-cli dev langgraph-ts-template` through the new SDK harness and capture planner plus manager interactions through the server-only runtime path
- [x] In that same smoke project: run `bunx @langchain/langgraph-cli dev --config .maw/graphs/langgraph-ts-template` and then the exact compatibility `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`
- [x] `../maw-smoke/docs/agents/smoke-logs/phase6-opencode-interactive-runtime.md`: record interactive TTY, server-only harness, and direct LangGraph compatibility results, plus any issues and fixes

Verify:

- [x] `bun smoke-init phase6-opencode-interactive-runtime` in `../maw-smoke/`
- [x] In `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx maw-cli init`
- [x] In TTY mode inside `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx maw-cli dev langgraph-ts-template`
- [x] In `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx @langchain/langgraph-cli dev --config .maw/graphs/langgraph-ts-template`
- [x] In a second terminal for that same smoke project, run the exact `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`
- [x] Manual check: the new SDK harness can drive the non-TTY `bunx maw-cli dev langgraph-ts-template` server-only path and captures planner plus manager evidence

## Verification

### Per-step verification

- [x] Step 1: `bun run build`
- [x] Step 1: `bun run lint`
- [x] Step 1: `bun run typecheck`
- [x] Step 1: `bun run test`
- [x] Step 1: `bun run test:int -- tests/integration/scaffold.test.ts`
- [x] Step 2: `bun run build`
- [x] Step 2: `bun run test:int -- tests/integration/graph.test.ts`
- [x] Step 3: `bun run build`
- [x] Step 3: `bun run test`
- [x] Step 4: `rg "opencode.json|planner|manager|coder|maw-cli dev" README.md docs/usage/mvp docs/agents/initiatives/active/init/init-plan.md`
- [x] Step 4: manual review of active docs for superseded references
- [x] Step 5: `bun smoke-init phase6-opencode-interactive-runtime` in `../maw-smoke/`
- [x] Step 5: in `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx maw-cli init`
- [x] Step 5: in TTY mode inside `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx maw-cli dev langgraph-ts-template`
- [x] Step 5: in `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`, run `bunx @langchain/langgraph-cli dev --config .maw/graphs/langgraph-ts-template`
- [x] Step 5: in a second terminal for that same smoke project, run the exact compatibility `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`
- [x] Step 5: manual check that the SDK harness drives the non-TTY server-only `bunx maw-cli dev langgraph-ts-template` path and captures planner plus manager evidence

### Phase completion

- [ ] `langgraph-ts-template`: `bun run build`
- [ ] `langgraph-ts-template`: `bun run typecheck`
- [ ] `langgraph-ts-template`: `bun run test`
- [ ] `langgraph-ts-template`: `bun run test:int`
- [ ] `maw-cli`: `bun run build`
- [ ] `maw-cli`: `bun run lint`
- [ ] `maw-cli`: `bun run test`
- [ ] `../maw-smoke`: `bun smoke-init phase6-opencode-interactive-runtime`
- [ ] `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`: run `bunx maw-cli init`
- [ ] `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`: prove the TTY `bunx maw-cli dev langgraph-ts-template` planner-to-manager flow
- [ ] `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`: prove the SDK-harnessed non-TTY `bunx maw-cli dev langgraph-ts-template` server-only flow
- [ ] `../maw-smoke/tests/smoke-phase6-opencode-interactive-runtime/`: run `bunx @langchain/langgraph-cli dev --config .maw/graphs/langgraph-ts-template` plus the exact compatibility `curl` request from `Execution Notes`
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase6-opencode-interactive-runtime.md`: log the final results, issues, and fixes

## Exit Criteria

- [ ] `.maw/graphs/<workflow>/config.json`, `.maw/templates/`, Nunjucks prompt composition, and `maw-cli prompt:list` / `prompt:preview` are retired from the active workflow contract
- [ ] `maw-cli init` scaffolds `.maw/graphs/<workflow>/opencode.json` and no longer creates `.maw/templates/`
- [ ] The workflow package ships a default raw `opencode.json` scaffold asset plus a validator or schema export, and invalid edited workflow-local `opencode.json` files fail before runtime launch
- [ ] `maw-cli dev <workflow>` launches bundled opencode directly, starts on `planner` in TTY mode, and exposes the same workflow in server-only mode when no TTY is present
- [ ] The default interactive base workflow exposes visible primary `planner` and `manager` agents plus hidden `coder`, and an explicit execute request hands control from `planner` to `manager`
- [ ] `manager` can execute clean step work through `coder` and auto-commit clean results under the Phase 6 workflow contract
- [ ] The separate direct LangGraph `/runs/wait` compatibility path still runs through generated `graph.ts` and `langgraph.json`
- [ ] Active docs outside `complete/` no longer describe the workflow contract through `maw.json`, `config.json`, `.maw/templates/`, Nunjucks composition, or `maw-cli prompt:*`
- [ ] Smoke proof covers interactive TTY planner and manager behavior, the non-TTY server-only SDK harness path, and the retained direct LangGraph compatibility path
