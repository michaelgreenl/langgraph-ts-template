# Phase 2c Plan: Target Project Scaffold

## Goal

Land the target-project scaffold contract for `.maw/` and the package-side runtime needed to consume it later. Keep this phase focused on scaffold contents, config defaults, secret handling, and safe generation behavior. Leave generated `langgraph.json` work to phase `2e`.

## Scope

- `.maw/config.json`
- `.maw/ov.conf`
- `.maw/templates/`
- `.maw/graph.ts`
- `.gitignore` updates for secret-bearing scaffold files
- Runtime config loading and environment-variable interpolation

## Out of Scope

- Generated `langgraph.json` in the target project (`2e`)
- OpenViking install/index flows (`4a` / `4b`)
- Broader CLI behavior outside the `maw init` scaffold contract (`3`)

## Work Plan

### 1. Freeze the Scaffold Contract

- [ ] Confirm the exact generated tree and default contents from `docs/agents/initiatives/active/init/init-plan.md`.
- [ ] Define ownership boundaries:
    - workflow package ships config types and scaffold assets
    - `maw init` performs filesystem writes in the target project
- [ ] Define rerun behavior: create missing files, merge `.gitignore`, and do not overwrite user-edited scaffold files without explicit opt-in.
- [ ] Define how the installed workflow package name is discovered so `.maw/graph.ts` imports the real package instead of a hardcoded example.

### 2. Add Package-Side Config Support

- [ ] Introduce a typed schema for `.maw/config.json` defaults, including `workspace`, `graph.name`, `openviking`, `llm`, and `templates`.
- [ ] Add a config loader that resolves `${VAR_NAME}` placeholders recursively at runtime and throws a clear error when a referenced variable is missing.
- [ ] Export the config types/helpers from the package so later graph work can reuse them.
- [ ] Keep secret values as placeholders in generated files; never materialize real values during scaffolding.

### 3. Add Scaffold Assets for `maw init`

- [ ] Add template/source assets for `.maw/config.json`, `.maw/ov.conf`, and `.maw/graph.ts` to the published package contents.
- [ ] Ensure the scaffold can create `.maw/templates/` even when it is empty.
- [ ] Define `.gitignore` merge rules so `.maw/ov.conf` and `.maw/config.json` are added once and are not duplicated on reruns.
- [ ] Keep `.maw/graph.ts` minimal: import `createGraph` from the installed workflow package and export `graph = createGraph()`.

### 4. Handoff Into CLI Work

- [ ] Document the inputs `maw init` needs from the installed workflow package: package name, scaffold asset locations, config defaults, and overwrite/idempotency rules.
- [ ] Confirm the boundary with phase `2e` so `langgraph.json` generation lands separately and does not expand this phase.

## Verification

- [ ] `bun run build`
- [ ] `bun run test`
- [ ] Add unit coverage for config loading and env interpolation, including nested objects and missing-variable failures.
- [ ] Smoke test gate for the `2c` to `3` handoff: in a temporary target project with the local workflow package and local `maw` CLI linked in, run `bunx maw init` and verify that `.maw/config.json`, `.maw/ov.conf`, `.maw/templates/`, and `.maw/graph.ts` are created, `.gitignore` contains the secret-file entries exactly once, the scaffold keeps `${OPENAI_API_KEY}` as a placeholder, and a second run is idempotent.

## Exit Criteria

- [ ] The scaffold contract is stable enough for phase `3` CLI implementation.
- [ ] The package exposes the config/runtime pieces needed by later graph work.
- [ ] Verification steps, including the smoke test, pass against a clean temporary target project.
