# Phase 2e Handoff

## Target-Project LangGraph Contract

`maw-cli init` now creates a root-level `langgraph.json` alongside the existing `.maw/` scaffold.

The generated file is intentionally narrow and now treated as the target project's LangGraph entrypoint contract:

- `node_version: "20"` to select the LangGraph.js runtime
- `graphs.agent = "./.maw/graph.ts:graph"`
- `env = ".env"`
- `dependencies = ["."]`

`langgraph.json` is **not** added to `.gitignore`; it is meant to be committed.

## Workflow Package Contract

The workflow package's `./scaffold` export now includes `langgraph.json` in `createScaffoldFiles()` and `scaffold.assets`.

Two packaging details matter for follow-on work:

- `package.json` must keep `./scaffold` pointed at `./dist/scaffold/index.js`
- the built scaffold module must be able to resolve packaged assets when loaded from `dist/scaffold/index.js`

Phase `2e` fixed both, because `maw-cli init` consumes the installed package export, not the source tree.

## `maw-cli init` Behavior

No code change was needed in `../maw-cli` for this phase.

The existing init logic already handled the root-level file path correctly:

- `writeMissingFiles()` creates `langgraph.json` at the project root
- reruns preserve an existing user-edited `langgraph.json`
- `.gitignore` merging remains limited to secret-bearing `.maw/*` files

That means Phase `3` should treat the generated root config as an existing contract, not something `dev` or `start` needs to synthesize again.

## Verification Gate

Verification for the completed phase now covers three levels:

- package build plus repo tests/lint in `langgraph-ts-template`
- structural validation of generated files through `tests/integration/scaffold.test.ts`
- end-to-end smoke in `../maw-smoke/maw-smoke-1` via `bun run smoke:langgraph-config`

The smoke path force-refreshes local `file:` dependencies before running so it exercises the current built workflow package and local `maw-cli`, not a stale cached copy.

## Handoff Into Phase 3

Phase `3` is the separate `../maw-cli` repo work for `dev` / `start` / `ov:*` commands.

The important carry-forward assumptions are:

- after `bunx maw-cli init`, the target project already has a valid root `langgraph.json`
- `dev` and `start` should delegate to `@langchain/langgraph-cli`, using the generated config rather than rebuilding it from package metadata
- `node_version: "20"` is part of the JS contract and should not be dropped
- `image_distro` is still intentionally out of scope unless a later phase explicitly adds it
- structural smoke does not require a real `.env` file or model provider key

Phase `3` can now focus on command wiring, workflow-package discovery, and delegation behavior in `maw-cli` without reopening the target-project config shape.
