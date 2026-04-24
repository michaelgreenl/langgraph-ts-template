# Phase 5 Plan: Base Workflow Foundation

## Goal

Replace the current hardcoded greeting stub with a real LLM-backed base workflow that executes a clean `planner` → `coder` handoff through the installed workflow package runtime. This phase must keep prompt composition customizable through `.maw/graphs/<workflow>/config.json` plus `.maw/templates/*.njk`, inject runtime template context into both agent prompts, and remain runnable through the existing `maw-cli dev <workflow>` surface even though file/shell/git tools still wait for Phase 6.

## Scope

- `langgraph-ts-template/package.json` - add the Phase 5 model runtime dependency and keep the shipped package surface aligned with the new graph runtime.
- `langgraph-ts-template/src/agent/{graph.ts,state.ts}` plus any new adjacent helper under `src/agent/` - replace the greeting stub with a real planner/coder runtime, capture rendered prompts plus handoff state, and keep the graph manually built with `StateGraph`.
- `langgraph-ts-template/src/index.ts` - export any narrow public runtime type changes needed for the Phase 5 graph contract.
- `langgraph-ts-template/src/templates/engine.ts` - keep runtime template-var injection aligned with the live planner/coder prompt contract if a narrow engine change is required.
- `langgraph-ts-template/tests/unit/{graph.spec.ts,public-api.spec.ts,templates.spec.ts}` and `tests/integration/graph.test.ts` - cover the Phase 5 runtime contract, fake-model execution, prompt selection, runtime context injection, and clean planner/coder handoff.
- `langgraph-ts-template/README.md` and `docs/agents/initiatives/active/init/init-plan.md` - align active docs/plans outside `complete/` with the real Phase 5 runtime contract.
- `../maw-smoke/docs/agents/smoke-logs/phase5-base-workflow-foundation.md` - record the final installed-package smoke results for runtime prompt/context injection.

## Out of Scope

- File, shell, git, or other codebase-action tools; the controlled tool loop lands in Phase 6 with opencode integration.
- Graph-time OpenViking retrieval, `.maw/ovcli.conf` consumption inside agent nodes, or any shared-context lookup during execution; that lands in Phase 7.
- Per-agent or workflow-local model/provider settings in `maw.json` or `.maw/graphs/<workflow>/config.json`; Phase 5 uses one shared package-owned model path.
- `createReactAgent`, `ToolNode`, loop-back tool execution, or any other prebuilt agent abstraction.
- `../maw-cli/src/**` product-code changes; Phase 5 reuses the existing `maw-cli dev <workflow>` runner for smoke verification.
- Rewriting the target-state MVP usage guides under `docs/usage/mvp/`; those pages already carry a target-state note and are not the current active-code contract.

## Decisions Cleared

- `planner` and `coder` are real sequential runtime nodes in Phase 5, not just prompt labels on one stub node.
- Phase 5 builds the graph manually with `StateGraph`; do not use `createReactAgent`.
- The initial shared model path is OpenAI `gpt-4.1-mini`.
- Phase 5 uses one shared package-owned model path for both nodes. Workflow-local or per-agent model overrides are deferred to a post-MVP follow-on after opencode integration clarifies the workflow config contract.
- `src/scaffold/assets/config.json` already ships `planner` / `coder` defaults. Phase 5 does not reopen scaffold prompt defaults as unfinished work.
- Runtime prompt selection continues to resolve in this order: embedded workflow defaults -> `.maw/graphs/<workflow>/config.json` -> `.maw/templates/<name>.njk`, with the existing missing/invalid-config fallback rules unchanged.
- Runtime template vars must reach both live agent nodes. At minimum, both nodes keep `workspacePath='.'` from the MAW scope root and merge `GraphConfig.vars`; coder prompt composition additionally receives the resolved planner handoff string.
- Final graph state must expose `plannerPrompt`, `coderPrompt`, and `handoff` so tests and smoke can inspect live prompt/context injection without depending on model paraphrase.
- Phase 5 smoke verification must prove runtime prompt/context injection through `maw-cli dev <workflow>` plus a LangGraph API run, not only through `prompt:list` / `prompt:preview`.

## Execution Notes

### Graph topology and handoff contract

Phase 5 must replace the greeting stub with a real sequential planner/coder runtime:

```text
__start__ -> planner -> coder -> __end__
```

Required behavior:

- planner renders the `planner` prompt from the resolved workflow config and runtime vars
- planner stores the exact rendered planner prompt in `plannerPrompt`
- planner invokes the shared model once and derives a non-empty `handoff` string from that planner result
- coder renders the `coder` prompt from the resolved workflow config, the shared runtime vars, and `handoff`
- coder stores the exact rendered coder prompt in `coderPrompt`
- coder invokes the shared model once and returns the final assistant response
- no tool nodes, no tool loop, no OpenViking retrieval, and no loop-back edges land in this phase

### Model loading and deterministic tests

The installed-package runtime should default to OpenAI `gpt-4.1-mini`, but Phase 5 tests must stay deterministic and must not require a real model call.

Required rules:

- the default installed-package path instantiates the shared OpenAI model internally
- Phase 5 tests stay deterministic by mocking or stubbing that shared model path rather than by adding workflow-local runtime model configuration
- the workflow package must not add a second on-disk model config layer for Phase 5

### Runtime prompt/context smoke contract

The manual smoke flow must prove that live runtime prompt injection follows the installed workflow config rather than only the static preview commands.

Use this exact smoke prompt config inside the disposable smoke project:

```json
{
    "prompts": {
        "global": ["general", "runtime-note"],
        "agents": {
            "planner": ["planner-note"],
            "coder": ["coder-note"]
        }
    }
}
```

And use these exact snippet bodies:

```text
.maw/templates/runtime-note.njk
Workspace path: {{ workspacePath }}

.maw/templates/planner-note.njk
Planner snippet active.

.maw/templates/coder-note.njk
Coder snippet active.
Planner handoff: {{ handoff }}
```

Run the live stateless request against the `maw-cli dev` server with:

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
                    "content": "Phase 5 smoke request."
                }
            ]
        }
    }'
```

The smoke result must show:

- `plannerPrompt` contains `Workspace path: .` and `Planner snippet active.`
- `coderPrompt` contains `Workspace path: .`, `Coder snippet active.`, and a non-empty rendered `Planner handoff:` line
- `handoff` is non-empty

### Smoke runtime env assumption

Manual smoke may use a real OpenAI call through the shared `gpt-4.1-mini` path.

Rules:

- the operator must provide a valid `OPENAI_API_KEY` through the current shell environment or the disposable target project's root `.env`
- smoke logs may note which source was used only at the level of `shell env` vs `root .env`
- smoke logs must never read, print, copy, or inspect secret values

## Work Plan

### 1. Add the Phase 5 runtime contract and model seam

This step locks the public/testable runtime surface before the stub is removed. It owns the shared model dependency and graph-visible prompt/handoff fields while keeping tests deterministic without real model calls. It must not add tools, file actions, or retrieval behavior.

- [x] `langgraph-ts-template/package.json`: add the shared OpenAI runtime dependency needed for the Phase 5 model path
- [x] `langgraph-ts-template/src/agent/state.ts` and `src/index.ts`: extend the exported graph/runtime types so state can expose `plannerPrompt`, `coderPrompt`, and `handoff`, and export any narrow state/public API types needed to inspect them cleanly in tests
- [x] `langgraph-ts-template/tests/unit/{graph.spec.ts,public-api.spec.ts}`: cover the new runtime contract without requiring a real model call

Verify:

- [x] `bun run typecheck`
- [x] `bun run test -- tests/unit/graph.spec.ts tests/unit/public-api.spec.ts`

### 2. Replace the greeting stub with a clean planner -> coder runtime

This step owns the live graph behavior. It must remove the hardcoded greeting, render planner/coder prompts from the resolved workflow config, execute one planner model call followed by one coder model call, and pass the planner handoff into coder prompt composition. It must not add `createReactAgent`, `ToolNode`, or loop-back execution.

- [x] `langgraph-ts-template/src/agent/graph.ts`: replace the greeting stub with a manual `StateGraph` flow that executes `planner` before `coder`
- [x] `langgraph-ts-template/src/agent/graph.ts` and `src/templates/engine.ts`: keep runtime template-var injection aligned so both nodes receive `workspacePath='.'`, shared `GraphConfig.vars`, and coder-only `handoff`
- [x] `langgraph-ts-template/tests/integration/graph.test.ts` and `tests/unit/templates.spec.ts`: cover planner/coder ordering, non-empty `handoff`, live prompt capture, runtime `workspacePath` injection, custom snippet overrides, and the existing missing/invalid-config fallback rules

Verify:

- [x] `bun run test -- tests/unit/templates.spec.ts`
- [x] `bun run test:int -- tests/integration/graph.test.ts`

### 3. Align active docs and plans to the real Phase 5 contract

This step keeps non-archived docs/plans aligned with the runtime that Phase 5 actually lands. It stays narrow: update current contract wording only, not later-phase MVP promises.

- [x] `docs/agents/initiatives/active/init/init-plan.md`: replace the stale Phase 5 bullet that reopens planner/coder default config with the actual planner/coder handoff and runtime-context scope
- [x] `README.md`: stop describing the package as a placeholder greeting chatbot and describe the Phase 5 planner/coder OpenAI foundation while making clear that file/shell/git tools wait for Phase 6
- [x] Keep the wording aligned with the already-added target-state note on `docs/usage/mvp/*.md`; do not rewrite those guides as current-status docs in this phase

Verify:

- [x] Manual check: `docs/agents/initiatives/active/init/init-plan.md` Phase 5 bullets match this tasks doc and do not treat planner/coder scaffold defaults as unfinished work
- [x] Manual check: `README.md` no longer says the runtime is a placeholder greeting chatbot or simple placeholder response

### 4. Prove installed-package runtime prompt injection in smoke

This step owns the manual end-to-end proof in a disposable target project. It must prove that live runtime prompt injection follows edited `.maw/graphs/<workflow>/config.json` plus `.maw/templates/*.njk`, not only the static prompt-preview path.

- [ ] `../maw-smoke`: run `bun smoke-init phase5-base-workflow-foundation` and then `bunx maw-cli init` inside `tests/smoke-phase5-base-workflow-foundation/`
- [ ] In `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`: set `.maw/graphs/langgraph-ts-template/config.json` to the exact `runtime-note` / `planner-note` / `coder-note` prompt shape from `Execution Notes`
- [ ] In that same smoke project: create `.maw/templates/runtime-note.njk`, `.maw/templates/planner-note.njk`, and `.maw/templates/coder-note.njk` with the exact bodies from `Execution Notes`
- [ ] In terminal A inside that smoke project: run `bunx maw-cli dev langgraph-ts-template`
- [ ] In terminal B inside that smoke project: run the exact `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase5-base-workflow-foundation.md`: record the returned `plannerPrompt`, `coderPrompt`, and `handoff` fields, confirm runtime `workspacePath` injection plus prompt-list selection, and log any issues/fixes plus the runtime-env assumption without reading secret values

Verify:

- [ ] `bun smoke-init phase5-base-workflow-foundation` in `../maw-smoke/`
- [ ] In `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli init`
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli dev langgraph-ts-template`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run the `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`

## Verification

### Per-step verification

- [x] Step 1: `bun run typecheck`
- [x] Step 1: `bun run test -- tests/unit/graph.spec.ts tests/unit/public-api.spec.ts`
- [x] Step 2: `bun run test -- tests/unit/templates.spec.ts`
- [x] Step 2: `bun run test:int -- tests/integration/graph.test.ts`
- [x] Step 3: manual review of `docs/agents/initiatives/active/init/init-plan.md` and `README.md`
- [ ] Step 4: `bun smoke-init phase5-base-workflow-foundation` in `../maw-smoke/`
- [ ] Step 4: in `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli init`
- [ ] Step 4: in terminal A inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli dev langgraph-ts-template`
- [ ] Step 4: in terminal B inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run the `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`

### Phase completion

- [ ] `langgraph-ts-template`: `bun run build`
- [ ] `langgraph-ts-template`: `bun run typecheck`
- [ ] `langgraph-ts-template`: `bun run test`
- [ ] `langgraph-ts-template`: `bun run test:int`
- [ ] `../maw-smoke`: `bun smoke-init phase5-base-workflow-foundation`
- [ ] In `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli init`
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run `bunx maw-cli dev langgraph-ts-template`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase5-base-workflow-foundation/`, run the `curl --silent --show-error --fail --request POST --url http://localhost:2024/runs/wait ...` command from `Execution Notes`
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase5-base-workflow-foundation.md`: log the final results/issues/fixes and runtime-env assumption

## Exit Criteria

- [ ] `createGraph()` no longer returns a hardcoded greeting; Phase 5 executes a real OpenAI-backed `planner` -> `coder` runtime path
- [ ] Planner and coder prompt selection still comes from embedded workflow defaults plus `.maw/graphs/<workflow>/config.json` and `.maw/templates/` overrides, with the existing fallback rules intact
- [ ] Both live nodes receive the expected runtime template vars; at minimum `workspacePath='.'` reaches both nodes and coder prompt composition receives a non-empty planner handoff string
- [ ] Final graph state exposes `plannerPrompt`, `coderPrompt`, and `handoff` for deterministic tests and smoke inspection
- [ ] `maw-cli dev <workflow>` can execute a complete stateless run cleanly against the installed workflow package even though no file/shell/git tools land yet
- [ ] Active docs/plans outside `complete/` no longer describe the runtime as a placeholder greeting chatbot or reopen already-landed planner/coder scaffold defaults
- [ ] Smoke proof shows that edited `.maw/graphs/langgraph-ts-template/config.json.prompts` and custom `.maw/templates/*.njk` snippets affect live runtime prompt injection, not just static prompt preview
