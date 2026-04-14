# Phase 3d Plan: `maw-cli dev` & `maw-cli start`

## Goal

Implement `dev` and `start` in `maw-cli`. Both commands read the target project's `.maw/config.json` via `utils/config`, ensure `langgraph.json` exists at the project root with the shape defined in Phase 2e, then delegate execution to `@langchain/langgraph-cli`. The Phase 3a stubs are replaced with real implementations.

## Scope

- `@langchain/langgraph-cli` added as a runtime dependency
- `src/utils/langgraph.ts` — shared helpers: `LANGGRAPH_JSON` constant, `ensureLanggraphJson(root)`, `spawnLanggraph(sub, args)`
- `src/commands/dev.ts` — real implementation replacing the Phase 3a stub
- `src/commands/start.ts` — real implementation replacing the Phase 3a stub
- Unit tests for both commands covering error and happy paths
- Smoke test in `../maw-smoke/maw-smoke-1/`

## Out of Scope

- `maw-cli ov:init` / `maw-cli ov:index` (Phase 4)
- Passing arbitrary flags or env vars to `langgraph-cli` beyond forwarded `args` (future work)
- Validating the contents of an existing `langgraph.json` — only its presence is checked
- Config caching or reloading between invocations

## Work Plan

### 1. Add Runtime Dependency

- [ ] Add `"@langchain/langgraph-cli": "<version>"` to `dependencies` (not `devDependencies`) in `maw-cli/package.json`
- [ ] Run `bun install` to update the lockfile

### 2. Create `src/utils/langgraph.ts`

- [ ] Create `src/utils/langgraph.ts` in `maw-cli/`
- [ ] Export `LANGGRAPH_JSON` as a `const` matching the Phase 2e spec exactly:

    ```ts
    export const LANGGRAPH_JSON = {
        node_version: '20',
        graphs: { agent: './.maw/graph.ts:graph' },
        env: '.env',
        dependencies: ['.'],
    } as const;
    ```

- [ ] Export `ensureLanggraphJson(root: string): Promise<void>` — writes `LANGGRAPH_JSON` serialised as pretty-printed JSON to `path.join(root, 'langgraph.json')` only when the file does not already exist; no-ops if the file is present (same preserve-existing contract as Phase 2e)
- [ ] Export `spawnLanggraph(sub: 'dev' | 'start', args: readonly string[]): Promise<number>` — resolves the `langgraphjs` binary from the installed `@langchain/langgraph-cli` package via its `bin` field in the package manifest (do not hardcode a path), spawns it with `stdio: 'inherit'`, and returns the child exit code (`1` when the exit code is `null`)

### 3. Implement `src/commands/dev.ts`

- [ ] Replace the `createPlaceholderCommand` stub with a real `CommandDefinition<'dev'>`
- [ ] Export `runDev(args: readonly string[], root?: string, launch?: typeof spawnLanggraph): Promise<number>` — `root` defaults to `process.cwd()`, `launch` defaults to `spawnLanggraph` (injectable for tests)
- [ ] `runDev` logic:
    1. Call `readConfig(root)` — on error write the message to `process.stderr` and return `1`
    2. Call `ensureLanggraphJson(root)`
    3. Return `launch('dev', args)`
- [ ] Wire `runDev` into the `CommandDefinition` `run` field

### 4. Implement `src/commands/start.ts`

- [ ] Replace the `createPlaceholderCommand` stub with a real `CommandDefinition<'start'>`
- [ ] Export `runStart(args: readonly string[], root?: string, launch?: typeof spawnLanggraph): Promise<number>` — identical structure to `runDev`; calls `launch('start', args)` in step 3
- [ ] Wire `runStart` into the `CommandDefinition` `run` field

### 5. Unit Tests

- [ ] Add `tests/dev.test.ts`:
    - Returns `1` and writes to `stderr` when `.maw/config.json` is missing (no `.maw/` directory in temp root)
    - Writes a correctly-shaped `langgraph.json` when the file does not exist; parse and assert content equals `LANGGRAPH_JSON`
    - Does not overwrite an existing `langgraph.json` — write a sentinel value to the file first, call `runDev`, assert the sentinel is unchanged
    - Calls `launch` with `('dev', args)` when config and `langgraph.json` are both valid
- [ ] Add `tests/start.test.ts`:
    - Returns `1` and writes to `stderr` when `.maw/config.json` is missing
    - Calls `launch` with `('start', args)` on the happy path
- [ ] All tests use real temp dirs on disk; clean up in `afterEach`; substitute `launch` with a no-op stub returning `0`

### 6. Smoke Test

- [ ] Add `"smoke:dev": "bun ./smoke/dev.ts"` to `scripts` in `../maw-smoke/maw-smoke-1/package.json`
- [ ] Create `../maw-smoke/maw-smoke-1/smoke/dev.ts`:
    1. **Config-not-found error path** — create an empty temp dir (no `.maw/`), spawn `maw-cli dev` via `spawnSync` resolved from the locally installed `maw-cli` package (not a global path); assert exit code is `1` and `stderr` contains `"Config file not found"`

    2. **`langgraph.json` written on first run** — create a second temp dir with a valid `.maw/config.json`, spawn `maw-cli dev` via `spawn` (async); wait up to 5s for `langgraph.json` to appear on disk (poll with a short interval), then send `SIGTERM` to the child; assert the file exists and parse to confirm:
        - `node_version === "20"`
        - `graphs.agent === "./.maw/graph.ts:graph"`
        - `env === ".env"`
        - `dependencies[0] === "."`

    3. **`langgraph.json` preserved on re-run** — add a sentinel field to the written `langgraph.json`, spawn `maw-cli dev` again with the same poll-then-SIGTERM pattern, assert the sentinel field is still present (file was not overwritten)

    4. Clean up all temp dirs; end with `console.log('Phase 3d smoke passed.')`
    - Resolve the `maw-cli` bin from the locally installed package (e.g. via `node_modules/.bin/maw-cli`) — do not rely on a globally installed binary

## Verification

- [ ] `bun run build` in `maw-cli/` — `dist/utils/langgraph.js`, `dist/commands/dev.js`, `dist/commands/start.js` all present
- [ ] `bun run lint` in `maw-cli/` — no lint errors in new or modified files
- [ ] `bun run test` in `maw-cli/` — all tests pass including `tests/dev.test.ts` and `tests/start.test.ts`
- [ ] Smoke: `bun run smoke:dev` in `../maw-smoke/maw-smoke-1/` — all assertions pass and `Phase 3d smoke passed.` is printed

## Exit Criteria

- [ ] `maw-cli dev` and `maw-cli start` are no longer stubs — they read config, ensure `langgraph.json`, and delegate to `@langchain/langgraph-cli`
- [ ] Missing `.maw/config.json` exits with code `1` and a descriptive error message for both commands
- [ ] `langgraph.json` written on first invocation matches the Phase 2e shape exactly
- [ ] `langgraph.json` is never overwritten when already present
- [ ] All new unit tests pass without a live server or Python environment
