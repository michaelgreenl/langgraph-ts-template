# Step 4 Log

## Step

- Prove the direct `maw-cli` flow in a disposable smoke project

## Pre-flight

- No code-contract blockers were found in the Phase 4 task definition, the existing `maw-smoke` disposable project, or the current `maw-cli` `init` / `ov:server` / `ov:index` surface.
- Verified before retrying that `openviking-server` and `openviking` were present on `PATH`, the existing `tests/smoke-phase4-openviking/` project was still intact, port `1933` was free, and a local `.env` file was present in the smoke project without inspecting its contents.
- Concern noted and cleared before execution: the reused smoke project might have needed a dependency refresh to pick up the approved local-`.env` fallback, but the installed `node_modules/maw-cli` already contained that logic so no reinstall was required.

## Changes

- Reused the existing `../maw-smoke/tests/smoke-phase4-openviking/` directory without deleting or recreating it, so the preconfigured local `.env` file stayed in place.
- Reused the prior successful `bun smoke-init phase4-openviking` evidence instead of rerunning the initializer, because the existing smoke project still matched the expected shape.
- Reran `bunx maw-cli init` in the reused smoke project, then reconfirmed that `package.json` remained untouched for OpenViking runtime wiring while `maw.json`, `.maw/ov.conf`, and `.maw/ovcli.conf` still matched the Phase 4 contract.
- Started `bunx maw-cli ov:server`, confirmed that it listened on `127.0.0.1:1933`, and ran both required indexing commands: `bunx maw-cli ov:index . --wait` and `bunx maw-cli ov:index package.json --wait`.
- Temporarily set `"openviking": false` in `maw.json`, reran `bunx maw-cli ov:index package.json --wait`, confirmed indexing still succeeded unchanged because the toggle affects retrieval only, and restored `maw.json` to `true` afterward.
- Stopped the server cleanly, confirmed no listener remained on port `1933`, updated the Step 4 task and per-step verification checkboxes in `tasks.md`, and updated the required smoke log plus this phase step log.

## Files

- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`
- `../maw-smoke/docs/agents/smoke-logs/phase4-openviking.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/4-prove-direct-maw-cli-flow-in-disposable-smoke-project.md`
- `../maw-smoke/tests/smoke-phase4-openviking/maw.json` (temporarily toggled for verification, then restored)
- `../maw-smoke/tests/smoke-phase4-openviking/.maw/openviking/` (runtime index state updated by the smoke run)

## Verification

- `command -v openviking-server` — PASS
- `command -v openviking` — PASS
- `test -d ../maw-smoke/tests/smoke-phase4-openviking` — PASS
- `test -f ../maw-smoke/tests/smoke-phase4-openviking/.env` — PASS (presence only; contents not inspected)
- `lsof -nP -iTCP:1933 -sTCP:LISTEN` before retry — PASS (no listener)
- `bun smoke-init phase4-openviking` (in `../maw-smoke/`) — PRIOR PASS, NOT RERUN
- `bunx maw-cli init` (in `../maw-smoke/tests/smoke-phase4-openviking/`) — PASS
- `bunx maw-cli ov:server` (in `../maw-smoke/tests/smoke-phase4-openviking/`) — PASS
- `lsof -nP -iTCP:1933 -sTCP:LISTEN` during retry — PASS (`127.0.0.1:1933` listener confirmed)
- `bunx maw-cli ov:index . --wait` — PASS
- `bunx maw-cli ov:index package.json --wait` — PASS
- `bunx maw-cli ov:index package.json --wait` after setting `"openviking": false` — PASS
- `kill -TERM -52132 && sleep 5 && lsof -nP -iTCP:1933 -sTCP:LISTEN || true` — PASS
- `lsof -nP -iTCP:1933 -sTCP:LISTEN` after retry — PASS (no lingering listener)
- `bun run build` in `maw-cli/` — PASS
- `bun run lint` in `maw-cli/` — PASS
- `bun run test` in `maw-cli/` — PASS
- `bun run typecheck` in `maw-cli/` — PASS
- `bun run build` in `langgraph-ts-template/` — PASS
- `bun run lint` in `langgraph-ts-template/` — PASS
- `bun run test` in `langgraph-ts-template/` — PASS
- `bun run typecheck` in `langgraph-ts-template/` — PASS
- `bun run test:int` in `langgraph-ts-template/` — PASS

## Summary

- Step 4 now passes end to end against the reused disposable smoke project without deleting or recreating it, and the required direct `maw-cli` runtime flow is proved with the preserved local environment setup.
- The smoke run confirmed that `maw-cli ov:server` could resolve the seeded placeholder at runtime, both required `ov:index` commands succeeded, and the `maw.json.openviking` toggle remained retrieval-only because indexing still worked unchanged when it was set to `false`.
- This successful retry later supplied the evidence used to complete the Phase 4 phase-completion and exit-criteria checkboxes in `tasks.md` during the wrap-up pass.

## Remaining

- None for Step 4.
- No follow-up checklist gaps remain from this successful retry.

## Issues

- None in this successful retry.
- The earlier blocked retry is superseded by this successful rerun against the same preserved smoke directory.
