# Phase 3c Plan: `utils/config.ts` — Config Reader

## Goal

Add `maw-cli/src/utils/config.ts` — a typed reader that loads `.maw/config.json` from a target project root, recursively resolves `${VAR_NAME}` env var interpolation, and throws clear errors when the config file is absent or a referenced variable is unset. This utility will be consumed by `maw-cli dev`, `maw-cli start`, and any future command that needs runtime configuration.

## Scope

- `MawConfig` interface matching the shape defined in Phase 2c
- `readConfig(root: string): Promise<MawConfig>` — reads, parses, resolves, and returns typed config
- `resolveEnvVars` — module-internal recursive resolver matching the spec in Phase 2c
- Clear thrown errors for: missing config file, unset env var
- Unit tests: happy path, missing config file, unset env var, nested interpolation, plain-value passthrough
- Re-export `readConfig` from `src/index.ts` so it is available from the package's public `"."` export
- Smoke test in `../maw-smoke/maw-smoke-1/`

## Out of Scope

- Schema validation beyond TypeScript types (no Zod or JSON Schema for this phase)
- Writing or modifying `.maw/config.json` (read-only)
- Wiring `readConfig` into `dev` or `start` commands (Phase 3d)
- Config caching or singleton pattern
- Handling arrays inside `resolveEnvVars` (no array string values exist in the current config shape)

## Work Plan

### 1. Create `src/utils/config.ts`

- [x] Create `src/utils/config.ts` in `maw-cli/`
- [x] Define and export the `MawConfig` interface with the full shape from Phase 2c:

    ```ts
    export interface MawConfig {
        workspace: string;
        graph: { name: string; agent?: string };
        openviking: { enabled: boolean; host: string; port: number };
        llm: { provider: string; apiKey: string };
        templates: {
            sources: string[];
            customPath: string;
            gitRepos: string[];
            globalSnippets: string[];
            agents: Record<string, { snippets: string[] }>;
        };
    }
    ```

### 2. Implement `resolveEnvVars`

- [x] Implement `resolveEnvVars(obj: Record<string, unknown>): Record<string, unknown>` as a module-internal (non-exported) helper
- [x] Walk every entry: substitute `${VAR}` in string values via `/\$\{(\w+)\}/g`; recurse into nested plain objects; pass all other values through unchanged
- [x] Throw `Error` with message `Environment variable <VAR> is not set but referenced in .maw/config.json` when a referenced var is absent (exact spec from Phase 2c)

### 3. Implement `readConfig`

- [x] Implement `export async function readConfig(root: string): Promise<MawConfig>`
- [x] Resolve the config path as `path.join(root, '.maw', 'config.json')` (use `node:path`)
- [x] Check existence with `access` from `node:fs/promises` — throw `Error` with message `Config file not found: <path>` when absent
- [x] Read with `readFile` from `node:fs/promises` and parse with `JSON.parse`
- [x] Call `resolveEnvVars` on the parsed object and cast the result to `MawConfig`

### 4. Export from Public API

- [x] Add `export { readConfig, type MawConfig } from './utils/config.js'` to `src/index.ts`
- [x] Confirm the re-export compiles: the `"."` entry in `exports` maps to `dist/index.js`, so `readConfig` will be importable from `maw-cli`

### 5. Unit Tests

- [x] Add `tests/config.test.ts` (flat, consistent with existing test layout)
- [x] Cover the following cases:
    - Happy path: temp dir with a valid `.maw/config.json`, env var set → returns `MawConfig` with resolved `llm.apiKey`
    - Missing config file → throws with `"Config file not found"` in the message
    - Unset env var → throws with the variable name in the message
    - Nested interpolation: a `${VAR}` in `llm.apiKey` and a second `${VAR}` in `openviking.host` both resolved correctly in a single call
    - Plain-value passthrough: a string without `${...}` is returned unchanged
    - Non-string leaf values (numbers, booleans) are passed through unchanged
- [x] Write fixture configs as real files in a temp dir (no mocking); clean up in `afterEach`

### 6. Smoke Test

- [x] Add `"smoke:config": "bun ./smoke/config.ts"` to `scripts` in `../maw-smoke/maw-smoke-1/package.json`
- [x] Create `../maw-smoke/maw-smoke-1/smoke/config.ts` with:
    - Write `.maw/config.json` fixture (relative to `process.cwd()` of the smoke project) with `"apiKey": "${MAW_SMOKE_KEY}"` and at least one nested field
    - Set `process.env.MAW_SMOKE_KEY = 'smoke-key-abc'` before calling `readConfig`
    - Import `readConfig` from `maw-cli` (installed via `file:` link)
    - Assert `config.llm.apiKey === 'smoke-key-abc'`
    - Assert a plain-value field (e.g. `workspace`) is unchanged
    - Delete `.maw/config.json`; call `readConfig` → catch and assert the error message contains `"Config file not found"`
    - Restore the config; delete `process.env.MAW_SMOKE_KEY`; call `readConfig` → catch and assert the error message contains `"MAW_SMOKE_KEY"`
    - Restore original `.maw/config.json` after all assertions (do not leave the smoke fixture broken for subsequent smoke scripts)
    - End with `console.log('Phase 3c smoke passed.')`

## Verification

- [x] `bun run build` in `maw-cli/` — confirm `dist/utils/config.js` is present and `readConfig` is present in `dist/index.js`
- [x] `bun run lint` in `maw-cli/` — no lint errors in `src/utils/config.ts` or `src/index.ts`
- [x] `bun run test` in `maw-cli/` — all tests pass, including the new `tests/config.test.ts`
- [x] Smoke: `bun run smoke:config` in `../maw-smoke/maw-smoke-1/` — all assertions pass and `Phase 3c smoke passed.` is printed

## Exit Criteria

- [x] `readConfig(root)` returns a correctly typed `MawConfig` when the file exists and all env vars are set
- [x] `readConfig` throws a descriptive error containing the file path when `.maw/config.json` is absent
- [x] `readConfig` throws a descriptive error naming the missing variable when a `${VAR}` reference is unset
- [x] Nested interpolation resolves at all levels of the config object
- [x] `readConfig` and `MawConfig` are exported from `maw-cli`'s public `"."` export and importable from the smoke project
- [x] All unit tests and the smoke check pass without requiring a live service or real API key
