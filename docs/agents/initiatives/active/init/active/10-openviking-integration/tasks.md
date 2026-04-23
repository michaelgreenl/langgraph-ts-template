# Phase 4 Plan: OpenViking Integration

## Goal

Implement project-scoped OpenViking bootstrap plus `maw-cli`-owned runtime wrappers for MAW. After this phase, `maw-cli init` requires a target-project `package.json`, creates `.maw/ov.conf` and `.maw/ovcli.conf`, leaves the target project's `package.json` untouched for OpenViking runtime wiring, `maw-cli` exposes `ov:server` and `ov:index`, `maw-cli ov:server` resolves `.maw/ov.conf` placeholders before launching upstream OpenViking, and `langgraph-ts-template` continues to expose non-stub OpenViking toggle/url plumbing without wiring live graph-time retrieval into the graph loop yet.

## Status Reset

- Already complete and still valid:
  - simplified `maw.json` contract (`openviking: boolean` plus `templates.customPath`)
  - project-local `.maw/ov.conf` / `.maw/ovcli.conf` bootstrap
  - template-side OpenViking toggle/url plumbing for later runtime retrieval
  - public docs alignment for the simplified project-config surface
- Superseded assumption:
  - target-project `maw:ov:*` scripts are not the right ownership boundary once `.maw/ov.conf` placeholder resolution moves back into `maw-cli`
- Remaining Phase 4 work:
  - move OpenViking runtime responsibility fully back into `maw-cli`
  - stop mutating target-project `package.json` for OpenViking runtime wiring
  - reprove the smoke flow end to end with direct `maw-cli ov:*` commands

## Scope

- `maw-cli/src/commands/ov-server.ts` and `src/commands/ov-index.ts` - implement OpenViking runtime wrappers
- `maw-cli/src/index.ts` - expose `ov:server` and `ov:index` while keeping `ov:init` retired
- `maw-cli/src/utils/openviking.ts` (or equivalent) - parse `.maw/ov.conf`, resolve `${VAR}` placeholders, manage the resolved temp config used by `ov:server`, and centralize `.maw/ovcli.conf` path handling
- `maw-cli/src/commands/init.ts` - keep the package requirement, stop seeding `maw:ov:*` scripts, and preserve project-local OpenViking file bootstrap behavior
- `maw-cli/tests/{cli,init,ov-server,ov-index}.test.ts` and support fixtures - cover wrapper behavior, explicit target path handling, placeholder resolution, no-script init behavior, and rerun preservation
- `docs/usage/mvp/maw-cli.md`, `docs/usage/mvp/langgraph-ts-template.md`, and `docs/agents/initiatives/active/init/init-plan.md` - align the written contract to `maw-cli`-owned runtime execution
- `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md` - record final end-to-end smoke results against local repo checkouts

## Out of Scope

- Live graph-time OpenViking retrieval or tool-loop consumption inside `createGraph()` (deferred to Phase 7)
- Replacing `maw-cli dev <workflow>` or finalizing the broader workflow-execution surface (deferred until after the opencode SDK phase)
- Change-aware reindex heuristics, watch-mode indexing, or prepare-script automation
- Docker install/provisioning flows for OpenViking itself; Phase 4 still assumes `openviking-server` and `openviking` are already available
- Automatic drift reconciliation across `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf`
- A single root MAW config managing multiple child workspaces

## Decisions Cleared

- A target-project `package.json` is required at the MAW scope root because `maw-cli init` discovers installed workflow packages there.
- `maw-cli init` no longer seeds or maintains target-project `maw:ov:*` scripts.
- `maw-cli` exposes `ov:server` and `ov:index`; `ov:init` remains retired.
- The runtime commands are:
  - `maw-cli ov:server`
  - `maw-cli ov:index <target-path> [openviking args...]`
- `maw-cli ov:index` requires an explicit target path supplied by the caller, for example `bunx maw-cli ov:index .` or `bunx maw-cli ov:index src --wait`.
- `maw-cli ov:server` resolves `${VAR}` placeholders in `.maw/ov.conf` against the current process environment, launches upstream `openviking-server` with a resolved temp config, and fails clearly when required placeholders are unresolved.
- `maw-cli ov:index` sets `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf`, forwards the target path plus any caller-supplied flags to `openviking add-resource`, and does not read `maw.json.openviking`.
- `maw.json` remains `{ "openviking": boolean, "templates": { "customPath": ".maw/templates" } }`.
- `maw.json.openviking` toggles graph-time retrieval only. It does not gate or prompt indexing.
- `.maw/ov.conf` remains the server-config authority. `.maw/ovcli.conf` remains the client/runtime URL authority.
- `maw-cli init` creates `.maw/ov.conf` and `.maw/ovcli.conf` if missing, but reruns do not reconcile later drift between those files.
- The seeded `.maw/ov.conf` keeps loopback server defaults plus OpenAI-backed dense-embedding and VLM defaults, and it keeps `${OPENAI_API_KEY}` literal for `maw-cli ov:server` to resolve at runtime.
- `prompt:preview` and `src/agent/graph.ts` must not read `workspace` from `maw.json`. If custom snippet rendering still passes `workspacePath`, derive `'.'` from the MAW scope root.

## Execution Notes

### `package.json` rules

`maw-cli init` still requires the target project's existing `package.json`, but Phase 4 no longer mutates it for OpenViking runtime wiring.

- It may read the file to confirm the MAW scope is a real package-managed project and to discover installed workflows.
- It must preserve the file untouched.
- It must not add, update, or remove OpenViking runtime scripts.

### `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf`

`maw.json` remains:

```json
{
    "openviking": true,
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

Relevant generated OpenViking defaults remain:

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

Phase 4 seeds these loopback and OpenAI-backed defaults once. The `${OPENAI_API_KEY}` placeholders stay literal in the scaffolded `.maw/ov.conf`; `maw-cli ov:server` resolves them before launch. If a user later changes the server bind settings, provider/model settings, placeholders, or client URL, rerunning `maw-cli init` preserves those edits instead of reconciling them.

### OpenViking runtime command contract

The corrected Phase 4 runtime surface is:

```text
bunx maw-cli ov:server
bunx maw-cli ov:index <target-path> [openviking args...]
```

Implications:

- Start the server explicitly with `bunx maw-cli ov:server`.
- Index explicitly with `bunx maw-cli ov:index <target-path>`.
- For deterministic verification, pass `--wait` at invocation time, for example `bunx maw-cli ov:index . --wait`.
- Do not hide the target path behind MAW-specific defaults.
- `maw-cli ov:index` continues to rely on upstream non-strict unsupported-file handling unless the caller opts into stricter flags.

### Runtime OpenViking config contract for `langgraph-ts-template`

Phase 4 still stops short of live retrieval, but the exported OpenViking helpers should keep the same ownership model:

- `maw.json` contributes only the retrieval toggle.
- `.maw/ovcli.conf` contributes the client URL used by future retrieval code.
- Missing `maw.json` falls back to the same default toggle that `maw-cli init` seeds.
- Existing but invalid `maw.json` fails loudly.
- Missing or invalid `.maw/ovcli.conf` is an OpenViking-specific configuration error from the OpenViking loader; it must not become a graph-construction error in Phase 4 because retrieval is still deferred.

## Work Plan

### Completed foundation

- [x] simplify `maw.json` to the Phase 4 boolean toggle contract and remove `workspace` / host / port from live runtime readers
- [x] seed project-local `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf` from `maw-cli init`
- [x] replace template-side OpenViking stubs with toggle/url plumbing for later runtime retrieval
- [x] align the public MVP docs to the simplified project-config surface

### 1. Restore `maw-cli` OpenViking runtime wrappers

- [x] add `maw-cli/src/commands/ov-server.ts` and `src/commands/ov-index.ts`
- [x] add a `maw-cli` utility to parse `.maw/ov.conf`, resolve `${VAR}` placeholders, and create/clean up the resolved temp config used by `ov:server`
- [x] wire `maw-cli/src/index.ts` so `ov:server` and `ov:index` are back in the command registry/help surface while `ov:init` stays retired
- [x] add CLI/tests coverage for explicit target path handling, placeholder-resolution failures, and wrapper passthrough behavior

Verify:

- [x] `bun run test -- tests/cli.test.ts tests/ov-server.test.ts tests/ov-index.test.ts` in `maw-cli/`

### 2. Stop mutating target-project `package.json` for OpenViking runtime wiring

- [ ] `maw-cli/src/commands/init.ts`: keep the package requirement for workflow discovery, but stop seeding any `maw:ov:*` runtime scripts
- [ ] preserve `.maw/ov.conf` / `.maw/ovcli.conf` bootstrap and rerun behavior unchanged
- [ ] `maw-cli/tests/init.test.ts` and support fixtures: align expectations so `package.json` stays untouched for OpenViking runtime wiring

Verify:

- [ ] `bun run test -- tests/init.test.ts` in `maw-cli/`
- [ ] `bun run build` in `maw-cli/`

### 3. Align docs to direct `maw-cli` runtime execution

- [ ] `docs/usage/mvp/maw-cli.md`: document `maw-cli ov:server` / `maw-cli ov:index` and that `maw-cli ov:server` resolves `.maw/ov.conf` placeholders before launch
- [ ] `docs/usage/mvp/langgraph-ts-template.md`: align the workflow-package usage guide with the direct-`maw-cli` runtime model
- [ ] `docs/agents/initiatives/active/init/init-plan.md`: keep the master init plan consistent with the corrected Phase 4 runtime ownership

Verify:

- [ ] `rg "maw-cli ov:server|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md`
- [ ] `! rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md`

### 4. Prove the direct `maw-cli` flow in a disposable smoke project

- [ ] `../maw-smoke`: run `bun smoke-init phase4-openviking` to create the disposable target project from local repo checkouts
- [ ] In `../maw-smoke/tests/smoke-phase4-openviking/`: run `bunx maw-cli init`, confirm `package.json`, `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf` contain the Phase 4 contract
- [ ] In terminal A inside that same smoke project: run `bunx maw-cli ov:server`; in terminal B: run `bunx maw-cli ov:index . --wait` and `bunx maw-cli ov:index package.json --wait`
- [ ] In that smoke project: set `"openviking": false` in `maw.json`, rerun `bunx maw-cli ov:index package.json --wait`, and record that indexing still works unchanged because the toggle affects retrieval only
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md`: record the final results, any issues/fixes, runtime-env assumptions, and whether the direct-`maw-cli` surface exposed any gaps worth carrying into the later retrieval phase

Verify:

- [ ] `bun smoke-init phase4-openviking` in `../maw-smoke/`
- [ ] In `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli init`
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:server`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:index . --wait`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:index package.json --wait`

## Verification

### Per-step verification

- [x] Step 1: `bun run test -- tests/cli.test.ts tests/ov-server.test.ts tests/ov-index.test.ts` in `maw-cli/`
- [ ] Step 2: `bun run test -- tests/init.test.ts` in `maw-cli/`
- [ ] Step 2: `bun run build` in `maw-cli/`
- [ ] Step 3: `rg "maw-cli ov:server|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md`
- [ ] Step 3: `! rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md docs/agents/initiatives/active/init/init-plan.md`
- [ ] Step 4: `bun smoke-init phase4-openviking` in `../maw-smoke/`
- [ ] Step 4: in `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli init`
- [ ] Step 4: in terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:server`
- [ ] Step 4: in terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:index . --wait`
- [ ] Step 4: in terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:index package.json --wait`

### Phase completion

- [ ] `maw-cli`: `bun run typecheck`
- [ ] `maw-cli`: `bun run build`
- [ ] `maw-cli`: `bun run lint`
- [ ] `maw-cli`: `bun run test`
- [ ] `langgraph-ts-template`: `bun run build`
- [ ] `langgraph-ts-template`: `bun run typecheck`
- [ ] `langgraph-ts-template`: `bun run test`
- [ ] `langgraph-ts-template`: `bun run test:int`
- [ ] `../maw-smoke`: `bun smoke-init phase4-openviking`
- [ ] `../maw-smoke/tests/smoke-phase4-openviking/`: run `bunx maw-cli init`
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:server`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli ov:index . --wait` and `bunx maw-cli ov:index package.json --wait`
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md`: log the final results/issues/fixes

## Exit Criteria

- [ ] `maw.json` no longer contains `workspace` or OpenViking host/port fields, and `openviking` is a boolean retrieval toggle
- [ ] `maw-cli` exposes `ov:server` and `ov:index`, but not `ov:init`
- [ ] `maw-cli init` requires a target-project `package.json`, creates `.maw/ovcli.conf` alongside `.maw/ov.conf`, and does not mutate `package.json` for OpenViking runtime wiring
- [ ] `maw-cli ov:server` is the explicit Phase 4 server launch path
- [ ] `maw-cli ov:index` requires the caller to supply an explicit target path
- [ ] `maw-cli ov:server` resolves `.maw/ov.conf` placeholders against the current process environment before launching upstream OpenViking
- [ ] `.maw/ov.conf` seeds the loopback server defaults plus the restored OpenAI-backed dense-embedding and VLM defaults with literal `${OPENAI_API_KEY}` placeholders
- [ ] rerunning `maw-cli init` preserves edited `.maw/ov.conf` and `.maw/ovcli.conf` instead of reconciling drift
- [ ] setting `"openviking": false` in `maw.json` disables retrieval only; `maw-cli ov:index` still runs unchanged
- [ ] the MAW scope still has one shared `.maw/openviking/`, `.maw/ov.conf`, and `.maw/ovcli.conf` rather than per-workflow OpenViking state
- [ ] `langgraph-ts-template` exports concrete OpenViking toggle/url-based plumbing against the simplified project config shape, while live graph-time retrieval remains explicitly deferred to Phase 7
- [ ] the MVP usage docs reflect the direct-`maw-cli` runtime model and the simplified `maw.json` shape
- [ ] the Phase 4 smoke log proves the real installed-local-checkout flow works end to end with `bunx maw-cli init`, `bunx maw-cli ov:server`, and `bunx maw-cli ov:index <target> --wait`
