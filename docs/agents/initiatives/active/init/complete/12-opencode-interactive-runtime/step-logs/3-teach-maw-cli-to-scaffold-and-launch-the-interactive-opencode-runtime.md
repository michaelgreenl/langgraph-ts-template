# Step 3 Log

## Step

- Number: 3
- Name: Teach `maw-cli` to scaffold and launch the interactive opencode runtime
- Target repo: `maw-cli`
- Corrective retry: post-Step-5 runtime-contract fix for the missing planner -> manager execute handoff
- Second corrective retry: manual smoke feedback showed `/execute ...` still invoked `manager` as a subagent; this pass corrects the workflow-owned handoff to make `manager` the active interactive agent and updates the scaffolded default model for smoke use.

## Pre-flight

- No blockers found after reading the full `tasks.md`, scanning the `maw-cli` command/runtime code, and checking the updated `langgraph-ts-template` scaffold contract from Steps 1-2.
- Non-blocking notes recorded before implementation:
  - preserved extra `maw-cli dev <workflow> ...` arg pass-through while swapping the runtime from LangGraph to opencode
  - treated interactive mode as `stdin.isTTY && stdout.isTTY`; otherwise `dev` launches the server-only opencode path

### Corrective retry after Step 5 blocker

- Re-read the full `tasks.md` and the blocked Step 5 log before touching code.
- Re-scanned the corrective-pass runtime and scaffold areas:
  - `maw-cli/tests/{dev,init}.test.ts`
  - `maw-cli/tests/fixtures/workflows/**/config.js`
  - `maw-cli/tests/support.ts`
  - `langgraph-ts-template/src/scaffold/{assets/opencode.json,index.ts}`
  - `langgraph-ts-template/tests/{unit/config.spec.ts,unit/scaffold.spec.ts,integration/scaffold.test.ts}`
- Confirmed the Step 5 root cause: the shipped workflow scaffolded only the planner / manager / hidden coder agents and did not provide an explicit execute handoff surface.
- Confirmed against current OpenCode agent/command behavior that primary-agent switching is surfaced through manual switching or explicit commands, so the smallest in-scope corrective fix was a workflow-owned execute command contract rather than a `maw-cli` proxy/runtime rewrite.
- No blocking contract conflict remained after that runtime constraint was locked.

### Second corrective retry after manual smoke feedback

- Re-read the full `tasks.md`, the existing Step 3 log, and the affected scaffold/test files before editing.
- Re-scanned the current contract in:
  - `langgraph-ts-template/src/scaffold/{assets/opencode.json,index.ts}`
  - `langgraph-ts-template/tests/{unit/config.spec.ts,unit/scaffold.spec.ts,integration/scaffold.test.ts}`
  - `maw-cli/tests/{dev,init}.test.ts`
  - `maw-cli/tests/fixtures/workflows/**/config.js`
  - `maw-cli/tests/support.ts`
- Checked the current OpenCode commands docs and confirmed the live blocker source: `subtask: true` force-runs the target agent as a subagent, which is why the shipped `/execute ...` contract kept `manager` out of the active interactive seat.
- Confirmed there was no unresolved blocker after that scan: OpenCode supports `subtask: false`, so the fix stays inside the workflow-owned scaffold/validator contract instead of changing `maw-cli dev` runtime launch behavior.
- Non-blocking note: the repo-local `langgraph-ts-template/opencode.json` still has repo-specific model settings, but it is outside the scaffolded workflow-local contract owned by Step 3 and was intentionally left alone.

## Changes

- Added bundled opencode runtime support via `opencode-ai` plus new Node-based runtime helpers for opencode launch and nearest-ancestor `.maw/` scope resolution.
- Reworked `maw-cli init` to stop creating `maw.json` and `.maw/templates/`, scaffold workflow-local `.maw/graphs/<workflow>/opencode.json`, validate shipped scaffold configs, and keep generating `graph.ts` plus `langgraph.json` for the separate compatibility path.
- Reworked `maw-cli dev` to resolve scope from the nearest ancestor `.maw/`, validate edited workflow-local `opencode.json` with the workflow package validator, and launch bundled opencode in planner-first TTY mode or server-only non-TTY mode with `OPENCODE_CONFIG`.
- Retired `prompt:list`, `prompt:preview`, and the old `maw.json` config surface from the active CLI contract.
- Updated OpenViking commands to use nearest-ancestor `.maw/` scope resolution so subdirectory execution still hits the correct MAW root.
- Replaced old workflow fixtures/tests with the new scaffold + validator contract and removed retired prompt/config tests.
- Also cleaned up stale shipped build artifacts for the retired prompt/config surface from `dist/` (Boy Scout: removed obsolete outputs).

### Corrective retry after Step 5 blocker

- Added a workflow-owned `command.execute` entry to the scaffolded `opencode.json`. It routes approved execute requests to `manager` with `subtask: true` and a manager-directed execution template.
- Updated the workflow package validator so edited workflow-local `opencode.json` files must retain that execute handoff command alongside the planner / manager / hidden coder topology and packaged permission baselines.
- Updated `maw-cli` workflow fixtures and shared test support so the scaffolded config now includes the execute handoff contract and missing-command edits fail validation before launch.
- Added regression coverage that would have caught the Step 5 blocker:
  - `langgraph-ts-template` scaffold tests now assert the execute handoff surface
  - `maw-cli dev` tests now fail when workflow-local `opencode.json` removes the execute handoff command
  - `maw-cli init` tests now assert the scaffolded config materializes the execute handoff contract
- Also cleaned up: renamed the new scaffold command schema binding from generic `command` to `execute` in `src/scaffold/index.ts` for clearer intent (N8, G16).

### Second corrective retry after manual smoke feedback

- Changed the shipped workflow-owned `command.execute` contract from forced subtask mode to explicit primary-agent handoff via `subtask: false`, so `/execute ...` keeps `manager` as the active interactive agent instead of dispatching it as a subagent.
- Tightened the execute template so the manager continues in the same conversation and reuses already-established phase / `tasks.md` / step / repo / step-log paths unless they are missing or conflicting.
- Changed the scaffolded default model for `planner`, `manager`, and hidden `coder` from `openai/gpt-5.4` to `openai/gpt-4o` while keeping the existing `xhigh` variant.
- Updated the workflow validator and `maw-cli` fixture validators so edited `opencode.json` files that force the execute handoff back into subtask mode now fail validation before runtime launch.
- Updated `maw-cli` fixture scaffolds and shared test support to include the same `openai/gpt-4o` plus `xhigh` defaults as the shipped workflow contract, so consumer tests now guard the real scaffold shape instead of a drifted fixture subset.
- Added regression coverage that would have caught the new smoke failure:
  - `langgraph-ts-template` scaffold tests now assert the `gpt-4o` scaffold default and reject `command.execute.subtask: true`
  - `maw-cli dev` tests now fail when workflow-local `opencode.json` forces manager back into subtask mode
  - `maw-cli init` tests now assert the scaffolded config materializes the `gpt-4o` default model and non-subtask execute handoff
- Also cleaned up: aligned the `maw-cli` workflow fixtures with the shipped scaffold model fields to remove duplicate drift between the workflow package contract and the CLI consumer tests (G5).

### Files

- `maw-cli/bun.lock`
- `maw-cli/package.json`
- `maw-cli/src/commands/dev.ts`
- `maw-cli/src/commands/init.ts`
- `maw-cli/src/commands/ov-index.ts`
- `maw-cli/src/commands/ov-server.ts`
- `maw-cli/src/commands/prompt-list.ts` (deleted)
- `maw-cli/src/commands/prompt-preview.ts` (deleted)
- `maw-cli/src/index.ts`
- `maw-cli/src/utils/config.ts` (deleted)
- `maw-cli/src/utils/langgraph.ts`
- `maw-cli/src/utils/opencode.ts` (new)
- `maw-cli/src/utils/scope.ts` (new)
- `maw-cli/src/utils/workflows.ts`
- `maw-cli/tests/cli.test.ts`
- `maw-cli/tests/config.test.ts` (deleted)
- `maw-cli/tests/dev.test.ts`
- `maw-cli/tests/fixtures/workflows/code-agent/config.js`
- `maw-cli/tests/fixtures/workflows/code-agent/index.js`
- `maw-cli/tests/fixtures/workflows/code-agent/package.json`
- `maw-cli/tests/fixtures/workflows/code-agent/scaffold.js`
- `maw-cli/tests/fixtures/workflows/coding-alt/config.js`
- `maw-cli/tests/fixtures/workflows/coding-alt/index.js`
- `maw-cli/tests/fixtures/workflows/coding-alt/package.json`
- `maw-cli/tests/fixtures/workflows/coding-alt/scaffold.js`
- `maw-cli/tests/fixtures/workflows/coding/config.js`
- `maw-cli/tests/fixtures/workflows/coding/index.js`
- `maw-cli/tests/fixtures/workflows/coding/package.json`
- `maw-cli/tests/fixtures/workflows/coding/scaffold.js`
- `maw-cli/tests/init.test.ts`
- `maw-cli/tests/langgraph.test.ts`
- `maw-cli/tests/ov-index.test.ts`
- `maw-cli/tests/ov-server.test.ts`
- `maw-cli/tests/package-metadata.test.ts`
- `maw-cli/tests/prompt-list.test.ts` (deleted)
- `maw-cli/tests/prompt-preview.test.ts` (deleted)
- `maw-cli/tests/support.ts`
- `maw-cli/dist/commands/dev.d.ts`
- `maw-cli/dist/commands/dev.js`
- `maw-cli/dist/commands/init.js`
- `maw-cli/dist/commands/ov-index.js`
- `maw-cli/dist/commands/ov-server.js`
- `maw-cli/dist/commands/prompt-list.d.ts` (deleted)
- `maw-cli/dist/commands/prompt-list.js` (deleted)
- `maw-cli/dist/commands/prompt-preview.d.ts` (deleted)
- `maw-cli/dist/commands/prompt-preview.js` (deleted)
- `maw-cli/dist/index.d.ts`
- `maw-cli/dist/index.js`
- `maw-cli/dist/utils/config.d.ts` (deleted)
- `maw-cli/dist/utils/config.js` (deleted)
- `maw-cli/dist/utils/langgraph.js`
- `maw-cli/dist/utils/opencode.d.ts` (new)
- `maw-cli/dist/utils/opencode.js` (new)
- `maw-cli/dist/utils/scope.d.ts` (new)
- `maw-cli/dist/utils/scope.js` (new)
- `maw-cli/dist/utils/workflows.d.ts`
- `maw-cli/dist/utils/workflows.js`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/step-logs/3-teach-maw-cli-to-scaffold-and-launch-the-interactive-opencode-runtime.md` (new)

#### Corrective retry files

- `maw-cli/tests/dev.test.ts`
- `maw-cli/tests/fixtures/workflows/code-agent/config.js`
- `maw-cli/tests/fixtures/workflows/coding-alt/config.js`
- `maw-cli/tests/fixtures/workflows/coding/config.js`
- `maw-cli/tests/init.test.ts`
- `maw-cli/tests/support.ts`
- `langgraph-ts-template/src/scaffold/assets/opencode.json`
- `langgraph-ts-template/src/scaffold/index.ts`
- `langgraph-ts-template/tests/integration/scaffold.test.ts`
- `langgraph-ts-template/tests/unit/config.spec.ts`
- `langgraph-ts-template/tests/unit/scaffold.spec.ts`
- `langgraph-ts-template/dist/agent/graph.js`
- `langgraph-ts-template/dist/scaffold/index.d.ts`
- `langgraph-ts-template/dist/scaffold/index.js`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/step-logs/3-teach-maw-cli-to-scaffold-and-launch-the-interactive-opencode-runtime.md`

#### Second corrective retry files

- `maw-cli/tests/dev.test.ts`
- `maw-cli/tests/fixtures/workflows/code-agent/config.js`
- `maw-cli/tests/fixtures/workflows/coding-alt/config.js`
- `maw-cli/tests/fixtures/workflows/coding/config.js`
- `maw-cli/tests/init.test.ts`
- `maw-cli/tests/support.ts`
- `langgraph-ts-template/src/scaffold/assets/opencode.json`
- `langgraph-ts-template/src/scaffold/index.ts`
- `langgraph-ts-template/tests/integration/scaffold.test.ts`
- `langgraph-ts-template/tests/unit/config.spec.ts`
- `langgraph-ts-template/tests/unit/scaffold.spec.ts`
- `langgraph-ts-template/dist/scaffold/index.d.ts`
- `langgraph-ts-template/dist/scaffold/index.js`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/step-logs/3-teach-maw-cli-to-scaffold-and-launch-the-interactive-opencode-runtime.md`

## Verification

- `bun run test -- tests/cli.test.ts tests/init.test.ts tests/dev.test.ts tests/langgraph.test.ts tests/package-metadata.test.ts tests/ov-index.test.ts tests/ov-server.test.ts`
  - first run: failed as expected for TDD (`22` failures) before implementation
  - second run: passed (`7` files, `36` tests)
- `bun run build`
  - first verification run: failed on `src/utils/workflows.ts` validator type narrowing
  - fixed the root cause and reran successfully
- `bun run lint`
  - passed
- `bun run test`
  - passed (`8` files, `37` tests)

### Corrective retry after Step 5 blocker

- Red/green regression cycle:
  - `maw-cli`: `bun run test -- tests/dev.test.ts tests/init.test.ts`
    - first run: failed as expected for TDD after adding the missing-handoff regressions (`2` failures)
    - second run: passed (`2` files, `20` tests)
  - `langgraph-ts-template`: `bun run test -- tests/unit/scaffold.spec.ts && bun run test:int -- tests/integration/scaffold.test.ts`
    - first run: failed as expected for TDD after adding the missing-handoff regressions (`2` failures across unit/integration runs)
    - second run: passed (`1` unit file / `4` tests, `1` integration file / `3` tests)
- Full corrective-pass verification:
  - `maw-cli`: `bun run build`
    - passed
  - `maw-cli`: `bun run lint`
    - passed
  - `maw-cli`: `bun run test`
    - passed (`8` files, `38` tests)
  - `langgraph-ts-template`: `bun run build`
    - passed
  - `langgraph-ts-template`: `bun run lint`
    - passed
  - `langgraph-ts-template`: `bun run test`
    - passed (`8` files, `28` tests)
  - `langgraph-ts-template`: `bun run test:int -- tests/integration/scaffold.test.ts`
    - passed (`1` file, `3` tests)

### Second corrective retry after manual smoke feedback

- Red/green regression cycle:
  - `maw-cli`: `bun run test -- tests/init.test.ts tests/dev.test.ts`
    - first run: failed as expected for TDD (`3` failures: `1` in `tests/dev.test.ts`, `2` in `tests/init.test.ts`)
    - second run: passed (`2` files, `21` tests)
  - `langgraph-ts-template`: `bun run test -- tests/unit/config.spec.ts tests/unit/scaffold.spec.ts && bun run test:int -- tests/integration/scaffold.test.ts`
    - first run: failed as expected for TDD (`4` failures across the unit regression set)
    - second run: passed (`2` unit files / `8` tests, `1` integration file / `4` tests)
- Full corrective-pass verification:
  - `maw-cli`: `bun run build`
    - passed
  - `maw-cli`: `bun run lint`
    - passed
  - `maw-cli`: `bun run test`
    - passed (`8` files, `39` tests)
  - `langgraph-ts-template`: `bun run build`
    - passed
  - `langgraph-ts-template`: `bun run lint`
    - passed
  - `langgraph-ts-template`: `bun run test`
    - passed (`8` files, `29` tests)
  - `langgraph-ts-template`: `bun run test:int -- tests/integration/scaffold.test.ts`
    - passed (`1` file, `4` tests)

## Summary

- Step 3 completed: `maw-cli` now scaffolds workflow-local `opencode.json`, validates it through the workflow package contract, launches bundled opencode directly for `dev`, resolves `.maw/` from the nearest ancestor, and keeps separate LangGraph compatibility file generation intact.
- Corrective retry landed the missing explicit execute handoff surface: the shipped workflow now includes a workflow-owned `execute` command that hands approved execution requests to `manager`, and `maw-cli` regression coverage now guards that scaffold/validation contract.
- Second corrective retry landed the actual interactive handoff behavior: `/execute ...` now switches the active session into primary `manager` instead of invoking `manager` as a subagent, while keeping the existing conversation context available for the handoff.
- The scaffolded default model now seeds `openai/gpt-4o` for `planner`, `manager`, and `coder`, and the `maw-cli` consumer tests now guard both the handoff mode and the shipped model defaults.

## Remaining / unresolved items

- No Step 3 implementation items remain open.
- Step 4 docs alignment and Step 5 smoke proof were intentionally untouched because they are outside Step 3 scope.
- Follow-up note: `bun run build` still does not clean removed `dist/` files automatically; this step manually removed the retired prompt/config outputs after the source deletions.
- Step 5 still owns rerunning the live TTY/non-TTY smoke proof against the new execute handoff surface; this corrective pass intentionally did not repeat smoke or touch `maw-smoke`.
- The repo-local `langgraph-ts-template/opencode.json` still uses its existing repo-specific model defaults; this corrective pass intentionally changed only the scaffolded workflow-local `opencode.json` contract owned by Step 3.
