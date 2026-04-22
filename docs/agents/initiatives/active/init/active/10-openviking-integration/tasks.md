# Phase 4 Plan: OpenViking Integration

## Goal

Implement project-scoped OpenViking bootstrap and target-project runtime scripts for MAW. After this phase, `maw-cli init` requires a target-project `package.json`, creates `.maw/ov.conf` and `.maw/ovcli.conf`, seeds `maw:ov:server` and `maw:ov:index` into the target project's scripts, removes `ov:*` from the `maw-cli` command surface, and `langgraph-ts-template` exposes non-stub OpenViking toggle/url plumbing for Phase 5 without wiring live retrieval into the graph loop yet.

## Scope

- `maw-cli/src/commands/init.ts` - require `package.json`, generate the new `maw.json` shape, scaffold OpenViking files, and seed target-project `package.json` scripts
- `maw-cli/src/commands/ov-init.ts` and `maw-cli/src/commands/ov-index.ts` - delete the retired command files
- `maw-cli/src/index.ts` - remove `ov:*` from the command registry and help output
- `maw-cli/src/utils/config.ts` - simplify `maw.json` to the scope-root contract with `openviking: boolean`
- `maw-cli/tests/{cli,config,dev,init,prompt-preview}.test.ts` and `maw-cli/tests/support.ts` - align assertions and fixtures with the new project-config and script-seeding contract
- `langgraph-ts-template/src/agent/graph.ts` - stop reading `workspace` / OpenViking host-port settings from `maw.json` while preserving `workspacePath='.'` compatibility for custom templates
- `langgraph-ts-template/src/openviking/config.ts`, `src/openviking/client.ts`, `src/openviking/scanner.ts`, and `src/index.ts` - replace Phase 4 stubs with concrete toggle/url-based plumbing for Phase 5
- `langgraph-ts-template/tests/integration/graph.test.ts` and `tests/unit/openviking.spec.ts` - cover the new runtime contract
- `docs/usage/mvp/maw-cli.md` and `docs/usage/mvp/langgraph-ts-template.md` - align public MVP docs with target-project OpenViking scripts and the simplified `maw.json` shape
- `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md` - record manual Phase 4 verification against local repo checkouts

## Out of Scope

- Live graph-time OpenViking retrieval or tool-loop consumption inside `createGraph()` (Phase 5)
- Replacing `maw-cli dev <workflow>` or finalizing the broader workflow-execution surface (Phase 5)
- Extra server lifecycle orchestration, process inspection, or `maw-cli` wrappers around `openviking-server` / `openviking`
- Automatic drift reconciliation across `maw.json`, `.maw/ov.conf`, `.maw/ovcli.conf`, and seeded `package.json` scripts
- Docker install/provisioning flows for OpenViking itself; Phase 4 assumes `openviking-server` and `openviking` are already available
- Change-aware reindex heuristics, watch-mode indexing, or prepare-script automation
- A single root MAW config managing multiple child workspaces

## Decisions Cleared

- A target-project `package.json` is required at the MAW scope root. Missing file is a hard failure for `maw-cli init`.
- `maw-cli` no longer exposes `ov:init` or `ov:index`; OpenViking runtime execution lives in target-project `package.json` scripts.
- `maw-cli init` seeds missing `maw:ov:server` and `maw:ov:index` scripts. If either script already exists with different content, it emits `Warning:` and preserves the existing value.
- The exact seeded script values are:
  - `maw:ov:server` -> `openviking-server --config .maw/ov.conf`
  - `maw:ov:index` -> `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource`
- `maw:ov:index` requires an explicit target path supplied by the caller, for example `bun run maw:ov:index -- .` or `bun run maw:ov:index -- src`.
- `maw.json` becomes `{ "openviking": boolean, "templates": { "customPath": ".maw/templates" } }`.
- `maw.json.openviking` toggles graph-time retrieval only. It does not gate or prompt target-project indexing scripts.
- `.maw/ov.conf` is the server-config authority. `.maw/ovcli.conf` is the client/runtime URL authority.
- `maw-cli init` creates `.maw/ov.conf` and `.maw/ovcli.conf` if missing, but reruns do not reconcile later drift between those files or the seeded scripts.
- Upstream OpenViking now owns env-placeholder resolution and non-strict unsupported-file behavior. Phase 4 must not reintroduce `maw-cli` wrapper logic for those concerns.
- `prompt:preview` and `src/agent/graph.ts` must stop reading `workspace` from `maw.json`. If custom snippet rendering still passes `workspacePath`, derive `'.'` from the MAW scope root.

## Execution Notes

### `package.json` mutation rules

`maw-cli init` edits only the target project's existing `package.json`.

- It must parse the existing file and preserve unrelated fields.
- If `scripts` is missing, create it.
- Add only the missing `maw:ov:server` and `maw:ov:index` entries.
- If an existing `maw:ov:*` entry already matches the seeded value, leave it untouched.
- If an existing `maw:ov:*` entry differs, emit `Warning:` and keep the user value.

### `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf`

`maw.json` becomes:

```json
{
    "openviking": true,
    "templates": {
        "customPath": ".maw/templates"
    }
}
```

Relevant generated OpenViking defaults become:

```json
// .maw/ov.conf
{
    "storage": {
        "workspace": "./.maw/openviking"
    },
    "server": {
        "host": "0.0.0.0",
        "port": 1933
    }
}
```

```json
// .maw/ovcli.conf
{
    "url": "http://localhost:1933"
}
```

Phase 4 seeds matching defaults once. If a user later changes the server bind settings or client URL, rerunning `maw-cli init` preserves those edits instead of reconciling them.

### OpenViking runtime script contract

The Phase 4 runtime surface is intentionally thin:

```json
{
    "scripts": {
        "maw:ov:server": "openviking-server --config .maw/ov.conf",
        "maw:ov:index": "OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource"
    }
}
```

Implications:

- Start the server explicitly with `bun run maw:ov:server`.
- Index explicitly with `bun run maw:ov:index -- <target-path>`.
- For deterministic verification, pass `--wait` at invocation time, for example `bun run maw:ov:index -- . --wait`.
- Do not pass `--strict` in the seeded script. If users want stricter behavior later, they can add flags themselves.

### Runtime OpenViking config contract for `langgraph-ts-template`

Phase 4 still stops short of live retrieval, but the exported OpenViking helpers should match the new ownership model:

- `maw.json` contributes only the retrieval toggle.
- `.maw/ovcli.conf` contributes the client URL used by future retrieval code.
- Missing `maw.json` falls back to the same default toggle that `maw-cli init` seeds.
- Existing but invalid `maw.json` fails loudly.
- Missing or invalid `.maw/ovcli.conf` is an OpenViking-specific configuration error from the OpenViking loader; it must not become a graph-construction error in Phase 4 because retrieval is still deferred.

## Work Plan

### 1. Remove stale project-config and CLI-surface assumptions

Clear the old `workspace` / host-port config contract and remove the retired `ov:*` CLI surface first. Keep this step limited to parsing, CLI registration, and runtime callers that still assume the old `maw.json` shape. Do not seed new OpenViking files or package scripts yet.

- [x] `maw-cli/src/utils/config.ts`: replace the old `workspace` + `openviking.enabled/host/port` schema with the Phase 4 `openviking: boolean` project config shape and keep missing-file behavior aligned with current callers
- [x] `maw-cli/src/index.ts`, `maw-cli/src/commands/ov-init.ts`, and `maw-cli/src/commands/ov-index.ts`: remove `ov:init` and `ov:index` from the command registry/help surface and delete the retired placeholder commands
- [x] `maw-cli/tests/{cli,config,dev,prompt-preview}.test.ts`, `langgraph-ts-template/src/agent/graph.ts`, and `langgraph-ts-template/tests/integration/graph.test.ts`: stop reading `workspace` or OpenViking host/port from `maw.json` and preserve `workspacePath='.'` compatibility for custom templates

Verify:

- [x] `bun run test -- tests/config.test.ts tests/dev.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` in `maw-cli/`
- [x] `bun run test:int -- tests/integration/graph.test.ts` in `langgraph-ts-template/`

### 2. Teach `maw-cli init` to seed project-local OpenViking files and scripts

This step owns project bootstrap only. It should make OpenViking configuration and runtime scripts visible inside the target project without adding new wrapper behavior on top of upstream commands.

- [x] `maw-cli/src/commands/init.ts`: require a target-project `package.json`, generate `maw.json` with `openviking: true`, create `.maw/ov.conf` and `.maw/ovcli.conf` if missing, and keep `.gitignore` limited to `.maw/openviking/`
- [x] `maw-cli/src/commands/init.ts`: add missing `package.json` scripts `maw:ov:server` and `maw:ov:index`, create `scripts` if absent, emit `Warning:` on conflicting existing values, and preserve all unrelated `package.json` content
- [x] `maw-cli/tests/init.test.ts` and `maw-cli/tests/support.ts`: cover missing-package failure, zero-workflow bootstrap, new file shapes, script seeding, conflict warnings, rerun preservation, and the fact that `.maw/ovcli.conf` is no longer derived from `maw.json`

Verify:

- [x] `bun run test -- tests/init.test.ts` in `maw-cli/`
- [x] `bun run build` in `maw-cli/`

### 3. Replace template-side OpenViking stubs with Phase 5-ready toggle/url plumbing

Phase 4 still does not retrieve OpenViking context inside the graph loop, but it should stop exporting host/port stubs that conflict with the new project contract. This step makes the package surface concrete for Phase 5 without wiring live calls yet.

- [x] `langgraph-ts-template/src/openviking/config.ts`: replace the host/port stub with concrete project-config readers that model `maw.json.openviking` as the retrieval toggle and `.maw/ovcli.conf` as the client URL authority
- [x] `langgraph-ts-template/src/openviking/client.ts`, `src/openviking/scanner.ts`, and `src/index.ts`: replace the stub interfaces/constants with URL-based client contracts and shared project-scope types aligned to `.maw/ovcli.conf` and project-scoped `.maw/openviking/`, without performing live retrieval yet
- [x] `langgraph-ts-template/tests/unit/openviking.spec.ts` and `tests/integration/graph.test.ts`: verify the exported OpenViking surface, missing/invalid config rules, and continued graph creation under the simplified `maw.json` shape

Verify:

- [x] `bun run typecheck` in `langgraph-ts-template/`
- [x] `bun run test -- tests/unit/openviking.spec.ts` in `langgraph-ts-template/`
- [x] `bun run test:int -- tests/integration/graph.test.ts` in `langgraph-ts-template/`

### 4. Align public MVP docs with the new OpenViking surface

The user-facing docs currently advertise `ov:init`, `maw-cli ov:index`, and the old `maw.json` shape. Update them only after the code contract is locked so implementation and docs land together.

- [x] `docs/usage/mvp/maw-cli.md`: replace `ov:init` / `maw-cli ov:index` guidance with `bun run maw:ov:server` and `bun run maw:ov:index -- <target-path>` examples, and update the `maw.json` shape
- [x] `docs/usage/mvp/langgraph-ts-template.md`: remove stale `workspace` / OpenViking host-port references and align the workflow-package usage guidance with the target-project script model
- [x] Both usage docs: state clearly that `maw-cli dev <workflow>` remains the workflow runner through Phase 4 while OpenViking runtime execution lives in target-project `package.json` scripts

Verify:

- [x] `rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`
- [x] `! rg "ov:init|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`

### 5. Prove the final script-driven flow in a disposable smoke project

The phase is not done until the real installed-local-checkout flow works with seeded package scripts, not just fixtures. This step exists to prove that the thin-script surface is enough for a real target project.

- [ ] `../maw-smoke`: run `bun smoke-init phase4-openviking` to create the disposable target project from local repo checkouts
- [ ] In `../maw-smoke/tests/smoke-phase4-openviking/`: run `bunx maw-cli init`, confirm `package.json`, `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf` contain the Phase 4 contract, then verify the seeded `maw:ov:*` script entries
- [ ] In terminal A inside that same smoke project: run `bun run maw:ov:server`; in terminal B: run `bun run maw:ov:index -- . --wait` and `bun run maw:ov:index -- package.json --wait`
- [ ] In that smoke project: set `"openviking": false` in `maw.json`, rerun `bun run maw:ov:index -- package.json --wait`, and record that indexing still works unchanged because the toggle affects retrieval only
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md`: record the final results, any issues/fixes, script conflicts or rerun behavior, and whether the thin-script surface exposed any gaps worth carrying into Phase 5 review

Verify:

- [ ] `bun smoke-init phase4-openviking` in `../maw-smoke/`
- [ ] In `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli init`
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:server`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:index -- . --wait`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:index -- package.json --wait`

## Verification

### Per-step verification

- [x] Step 1: `bun run test -- tests/config.test.ts tests/dev.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` in `maw-cli/`
- [x] Step 1: `bun run test:int -- tests/integration/graph.test.ts` in `langgraph-ts-template/`
- [x] Step 2: `bun run test -- tests/init.test.ts` in `maw-cli/`
- [x] Step 2: `bun run build` in `maw-cli/`
- [x] Step 3: `bun run typecheck` in `langgraph-ts-template/`
- [x] Step 3: `bun run test -- tests/unit/openviking.spec.ts` in `langgraph-ts-template/`
- [x] Step 3: `bun run test:int -- tests/integration/graph.test.ts` in `langgraph-ts-template/`
- [x] Step 4: `rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`
- [x] Step 4: `! rg "ov:init|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`
- [ ] Step 5: `bun smoke-init phase4-openviking` in `../maw-smoke/`
- [ ] Step 5: in `../maw-smoke/tests/smoke-phase4-openviking/`, run `bunx maw-cli init`
- [ ] Step 5: in terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:server`
- [ ] Step 5: in terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:index -- . --wait`
- [ ] Step 5: in terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:index -- package.json --wait`

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
- [ ] In terminal A inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:server`
- [ ] In terminal B inside `../maw-smoke/tests/smoke-phase4-openviking/`, run `bun run maw:ov:index -- . --wait` and `bun run maw:ov:index -- package.json --wait`
- [ ] `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md`: log the final results/issues/fixes

## Exit Criteria

- [ ] `maw.json` no longer contains `workspace` or OpenViking host/port fields, and `openviking` is a boolean retrieval toggle
- [ ] `maw-cli` no longer advertises or parses `ov:init` or `ov:index`
- [ ] `maw-cli init` requires a target-project `package.json`, creates `.maw/ovcli.conf` alongside `.maw/ov.conf`, and seeds missing `maw:ov:server` / `maw:ov:index` script entries
- [ ] conflicting existing `maw:ov:*` script values trigger `Warning:` and are preserved instead of overwritten
- [ ] `maw:ov:server` runs `openviking-server --config .maw/ov.conf`
- [ ] `maw:ov:index` runs `OPENVIKING_CLI_CONFIG_FILE=.maw/ovcli.conf openviking add-resource` and requires the caller to supply an explicit target path
- [ ] rerunning `maw-cli init` preserves edited `.maw/ov.conf`, `.maw/ovcli.conf`, and existing conflicting MAW script entries instead of reconciling drift
- [ ] setting `"openviking": false` in `maw.json` disables retrieval only; indexing scripts still run unchanged
- [ ] the MAW scope still has one shared `.maw/openviking/`, `.maw/ov.conf`, and `.maw/ovcli.conf` rather than per-workflow OpenViking state
- [ ] `langgraph-ts-template` exports concrete OpenViking toggle/url-based plumbing against the simplified project config shape, while live graph-time retrieval remains explicitly deferred to Phase 5
- [ ] the MVP usage docs reflect the target-project `maw:ov:*` script model and the simplified `maw.json` shape
- [ ] the Phase 4 smoke log proves the real installed-local-checkout flow works end to end with `bunx maw-cli init`, `bun run maw:ov:server`, and `bun run maw:ov:index -- <target> --wait`
