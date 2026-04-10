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
- Broader CLI behavior outside the `maw-cli init` scaffold contract (`3`)

## Work Plan

### 1. Freeze the Scaffold Contract

- [x] Confirm the exact generated tree and default contents from `docs/agents/initiatives/active/init/init-plan.md`.
- [x] Define ownership boundaries:
    - workflow package ships config types and scaffold assets
    - `maw-cli init` performs filesystem writes in the target project
- [x] Define rerun behavior: create missing files, merge `.gitignore`, and do not overwrite user-edited scaffold files without explicit opt-in.
- [x] Define how the installed workflow package name is discovered so `.maw/graph.ts` imports the real package instead of a hardcoded example.

### 2. Add Package-Side Config Support

- [x] Introduce a typed schema for `.maw/config.json` defaults, including `workspace`, `graph.name`, `openviking`, `llm`, and `templates`.
- [x] Add a config loader that resolves `${VAR_NAME}` placeholders recursively at runtime and throws a clear error when a referenced variable is missing.
- [x] Export the config types/helpers from the package so later graph work can reuse them.
- [x] Keep secret values as placeholders in generated files; never materialize real values during scaffolding.

### 3. Add Scaffold Assets for `maw-cli init`

- [x] Add template/source assets for `.maw/config.json`, `.maw/ov.conf`, and `.maw/graph.ts` to the published package contents.
- [x] Ensure the scaffold can create `.maw/templates/` even when it is empty.
- [x] Define `.gitignore` merge rules so `.maw/ov.conf` and `.maw/config.json` are added once and are not duplicated on reruns.
- [x] Keep `.maw/graph.ts` minimal: import `createGraph` from the installed workflow package and export `graph = createGraph()`.

### 4. Handoff Into CLI Work

- [x] Document the inputs `maw-cli init` needs from the installed workflow package: package name, scaffold asset locations, config defaults, and overwrite/idempotency rules.
- [x] Confirm the boundary with phase `2e` so `langgraph.json` generation lands separately and does not expand this phase.

## Verification

- [x] `bun run build`
- [x] `bun run test`
- [x] Add unit coverage for config loading and env interpolation, including nested objects and missing-variable failures.
- [x] Smoke test gate for the `2c` to `3` handoff: verified with the real local CLI path in a temporary target project by installing the local workflow package and local `../maw-cli`, running `bunx maw-cli init`, confirming `.maw/config.json`, `.maw/ov.conf`, `.maw/templates/`, `.maw/graph.ts`, `.gitignore` entries, placeholder preservation, and rerun idempotency after a manual edit to `.maw/graph.ts`.

## Exit Criteria

- [x] The scaffold contract is stable enough for phase `3` CLI implementation.
- [x] The package exposes the config/runtime pieces needed by later graph work.
- [x] Verification steps, including the smoke test, pass against a clean temporary target project.
