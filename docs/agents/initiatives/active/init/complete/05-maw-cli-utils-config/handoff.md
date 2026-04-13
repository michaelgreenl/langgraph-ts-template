# Phase 3c Handoff

## Config Reader Contract

`../maw-cli` now exports `readConfig(root)` and `MawConfig` from the package root.

- `readConfig(root)` reads `<root>/.maw/config.json`
- the return type matches the Phase `2c` scaffold shape: `workspace`, `graph`, `openviking`, `llm`, and `templates`
- `graph.agent` stays optional in the type so the reader matches the current scaffold/runtime contract
- the reader is read-only; it does not write defaults or mutate the target project

This gives later CLI commands a single config entry point instead of duplicating filesystem reads and string replacement logic.

## Environment Interpolation Contract

The new internal resolver walks nested plain objects and replaces `${VAR_NAME}` tokens in string leaves.

- the exact unset-var error is `Environment variable <VAR> is not set but referenced in .maw/config.json`
- the exact missing-file error is `Config file not found: <absolute path>`
- plain strings without `${...}` pass through unchanged
- booleans and numbers pass through unchanged
- arrays are intentionally left untouched for now because the current MAW config shape does not require array-element interpolation

If a later phase introduces secret-bearing array entries, expand the resolver there rather than silently assuming array support already exists.

## Public API and Verification Gate

Phase `3c` also widened the package surface slightly:

- `src/index.ts` now re-exports `readConfig` and `MawConfig`
- `dist/index.js` and `dist/index.d.ts` expose the same public entrypoints after build
- `tests/config.test.ts` covers happy path, missing config, unset env var, nested interpolation, and plain-value passthrough
- `../maw-smoke/maw-smoke-1` now has `bun run smoke:config`

The smoke path force-refreshes local `file:` dependencies before importing `maw-cli`, then restores the original `.maw/config.json` and `MAW_SMOKE_KEY` state on exit so later smoke scripts are not contaminated.

## Tooling Note

`../maw-cli` had a `lint` script but no local ESLint install/config. Phase `3c` now includes the minimal ESLint v9 flat-config bootstrap required for the documented verification gate:

- local `eslint` dependency
- local `eslint.config.js`
- `bun run lint` now succeeds against `src/`

That tooling change is support work for the verification gate, not a change to the MAW config contract itself.

## Handoff Into Phase 3d

Phase `3d` (`maw-cli dev` / `maw-cli start`) should consume this reader instead of opening `.maw/config.json` directly.

Carry-forward assumptions:

- reuse `readConfig(root)` as the one config-loading path
- do not reimplement `${VAR}` interpolation inside command handlers
- preserve the existing Phase `2e` target-project contract around `langgraph.json` and `.maw/graph.ts`
- keep command-side failures loud and specific when the MAW config is missing or references an unset env var

With `3c` complete, `3d` can focus on LangGraph CLI delegation and target-project verification instead of config parsing.
