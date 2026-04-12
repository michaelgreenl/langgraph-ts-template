# Phase 2e Plan: Generated langgraph.json in Target Project

## Goal

Extend `maw-cli init` to write a `langgraph.json` at the target project root, pointing to the already-scaffolded `.maw/graph.ts:graph` entry point. The generated file must satisfy the LangGraph CLI contract so `maw-cli dev` / `maw-cli start` can hand off directly to `@langchain/langgraph-cli` without any manual setup.

## Scope

- `langgraph.json` scaffold asset in the workflow template package
- `createScaffoldFiles` output includes `langgraph.json` at the project root
- Idempotent init (existing `langgraph.json` is preserved on re-run)
- Unit and integration coverage for the new scaffold file
- Smoke verification in `../maw-smoke/`

## Out of Scope

- Dynamic graph-name substitution driven by a user-edited `config.json` at init time; the default `agent` key is fixed for this phase
- `maw-cli dev` / `maw-cli start` wiring to the generated config (Phase 3)
- `image_distro` fields in the generated file; keep the target-project config otherwise minimal
- Modifying the template's own `langgraph.json` (which points at `./src/agent/graph.ts:graph` and is correct for the template's dev workflow)

## Open Questions

- [x] Confirm the set of top-level fields required in the generated `langgraph.json`. The published LangGraph JS schema and upstream JS example both require `node_version: "20"` for JS graphs. `image_distro` remains out of scope for this phase.

## Work Plan

### 1. Freeze the Generated File Contract

- [x] Confirm the exact JSON shape required by `@langchain/langgraph-cli` for a TypeScript graph served from a `.ts` source file.
- [x] Confirm that `"dependencies": ["."]` is sufficient for the CLI to locate the installed workflow package in the target project's `node_modules`.
- [x] Confirm that `"env": ".env"` is the correct env file path and that the CLI can still be structurally verified when `.env` is absent.
- [x] Document the resolved contract in code comments alongside the scaffold asset wiring before finishing the implementation.

### 2. Add the Scaffold Asset

- [x] Add `src/scaffold/assets/langgraph.json.template` to the workflow template package with the resolved content:

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

- [x] Add `langgraph` to `assetFiles` in `src/scaffold/index.ts` alongside the existing `config`, `ov`, and `graph` entries.
- [x] Add `langgraph` to `scaffold.assets` with `source` pointing at the new template and `target` set to `langgraph.json` (project root, no `.maw/` prefix).
- [x] Extend `createScaffoldFiles` to include the `langgraph.json` target in its return value. No token substitution is needed for this phase; the file is emitted verbatim.
- [x] Verify `scaffold.gitignore` does **not** include `langgraph.json` — this file should be committed.

### 3. Verify `maw-cli init` Handles a Root-Level File

- [x] Trace through `writeMissingFiles` in `maw-cli/src/commands/init.ts` with a `langgraph.json` key to confirm `dirname('langgraph.json')` resolves to `.` and `mkdir` with `{ recursive: true }` on `.` is a no-op.
- [x] Confirm the preserve-existing guard (`fileExists` check before write) applies correctly so a user-customized `langgraph.json` is not overwritten on re-run.
- [x] Since `writeMissingFiles` already handled root-level paths cleanly, keep `maw-cli` unchanged for this phase.

### 4. Add Focused Test Coverage

- [x] Extend `tests/integration/scaffold.test.ts`:
    - Assert `langgraph.json` is present after `applyScaffold`.
    - Parse the file and assert `graphs.agent === "./.maw/graph.ts:graph"`.
    - Assert `"dependencies"` contains `"."`.
    - Assert `"env"` is `".env"`.
    - Assert a second `applyScaffold` call does not overwrite a user-modified `langgraph.json` (preserve-existing contract).
- [x] Run the existing `lint:langgraph-json` path checker against a temporary directory containing the generated file to confirm the script accepts it.

### 5. Prepare the Smoke Handoff

- [x] Add `smoke:langgraph-config` to `../maw-smoke/maw-smoke-1/package.json` scripts.
- [x] Create `../maw-smoke/maw-smoke-1/smoke/langgraph-config.ts` with the following assertions:
    - After `bunx maw-cli init`, `langgraph.json` exists at the root.
    - Parsed JSON has `graphs.agent === "./.maw/graph.ts:graph"`.
    - `.maw/graph.ts` exists (co-created by the same init run) and contains `export const graph`.
    - A second `bunx maw-cli init` does not change the content of an already-present `langgraph.json`.
- [x] Keep the smoke fixture structural only: no real `.env`, provider key, or LangGraph server is required.

## Verification

- [x] `bun run build` — confirm the new asset is compiled and the package exports `./scaffold` from `dist/scaffold/index.js` with the `langgraph` asset entry.
- [x] `bun run lint` — no lint errors in touched files.
- [x] `bun run test:int` — the extended `scaffold.test.ts` passes, including the preserve-existing assertion.
- [x] `bun run lint:langgraph-json` — the existing path-checker script passes (template's own `langgraph.json` is unmodified).
- [x] Smoke: `bun run smoke:langgraph-config` in `../maw-smoke/maw-smoke-1` — all structural assertions pass without a real model provider or `.env` file.

## Exit Criteria

- [x] `maw-cli init` writes a valid `langgraph.json` at the target project root on a clean run.
- [x] Re-running `maw-cli init` preserves a user-modified `langgraph.json`.
- [x] The generated file passes structural validation: correct `node_version`, `graphs` entry, `env`, and `dependencies` fields.
- [x] Integration tests and the `../maw-smoke` smoke check all pass without requiring a real LangGraph server or API key.
