# Phase 2c Handoff

## Package Inputs For `maw-cli init`

`maw-cli init` should consume the workflow package through the dedicated subpath exports, not the root export:

- `<workflow>/scaffold`
- `<workflow>/config`

This avoids importing the compiled graph just to read scaffold metadata.

## `scaffold` Contract

The workflow package now exposes a `scaffold` object with:

- `packageName`: the installed workflow package name, read from the package manifest
- `directories`: directories `maw-cli init` should create even when they are empty
- `assets`: source-path and target-path pairs for `.maw/config.json`, `.maw/ov.conf`, and `.maw/graph.ts`
- `gitignore`: secret-bearing entries to merge into the target project's `.gitignore`
- `rules.overwrite = "preserve"`: do not overwrite existing scaffold files unless the CLI adds explicit opt-in later
- `rules.gitignoreMerge = "append-once"`: add secret-file ignore entries exactly once on reruns

`createScaffoldFiles(packageName?)` is also exported for the CLI path that wants rendered file contents instead of reading raw assets directly.

## Config Runtime

The workflow package now exposes:

- `createConfig()`: returns the scaffold defaults with secret placeholders intact
- `loadConfig(path?, env?)`: loads `.maw/config.json`, resolves `${VAR_NAME}` placeholders, then validates the result
- `resolveEnvVars(value, env?)`: recursive placeholder interpolation for nested objects and arrays

Secret placeholders stay literal in scaffolded files. Resolution only happens at runtime when the config is loaded.

## Current Defaults

- `.maw/config.json` matches the phase `2c` contract, with `coder.snippets = ["typescript"]`
- `.maw/ov.conf` is preconfigured for OpenAI-backed embedding and VLM settings using `${OPENAI_API_KEY}`
- `.maw/graph.ts` stays minimal: `createGraph()` import plus export

`coding-rules` is not part of the embedded default snippet set yet, so the scaffold currently uses the existing `typescript` snippet only for `coder`.

## Phase Boundary

Phase `2c` stops at the `.maw/` scaffold contract and runtime config support.

Phase `2e` still owns generated `langgraph.json`.

The local `../maw-cli` now consumes this contract through its `init` command, and the real `bunx maw-cli init` smoke test passes against a temporary target project. The CLI implementation is intentionally narrow: it discovers the installed workflow package, loads its `./scaffold` export from the package manifest, creates missing scaffold files, merges `.gitignore` once, and preserves existing scaffold files on reruns.
