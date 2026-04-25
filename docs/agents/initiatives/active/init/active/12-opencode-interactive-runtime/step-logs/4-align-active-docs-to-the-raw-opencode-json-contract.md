# Step 4 Log

## Step

- Number: 4
- Name: Align active docs to the raw `opencode.json` contract
- Repo: `langgraph-ts-template`
- Tasks file: `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md`

## Pre-flight

- No blockers found after reading the full `tasks.md` and reviewing `README.md`, `docs/usage/mvp/*.md`, `docs/agents/initiatives/active/init/init-plan.md`, and the active phase task/log docs.
- Non-blocking note: retired internal prompt-config files such as `src/config.ts` and `src/scaffold/assets/config.json` still exist in the repo, but the public Phase 6 contract and prior step logs already treat that surface as retired; Step 4 stayed within docs-only scope.
- Confirmed `init-plan.md` already carried the Phase 6 contract and only needed an explicit historical-labeling note, while `README.md` and the MVP usage docs needed substantive contract updates.

## Changes

- Rewrote `README.md` around the Phase 6 active contract: workflow-local `opencode.json`, planner-first `maw-cli dev <workflow>` launch, visible `planner` / `manager`, hidden `coder`, and the separate LangGraph compatibility path.
- Replaced stale Phase 4/5 guidance in `docs/usage/mvp/maw-cli.md` with the Phase 6 init/dev/OpenViking/compatibility model and explicit retirement notes for the old prompt-template surface.
- Replaced stale workflow-author guidance in `docs/usage/mvp/langgraph-ts-template.md` with the workflow-local `opencode.json` scaffold + validator contract and retained `createGraph()` compatibility guidance.
- Added an explicit historical note to `docs/agents/initiatives/active/init/init-plan.md` so older phase summaries that mention `maw.json`, `config.json`, `.maw/templates/`, or `maw-cli prompt:*` are clearly marked as superseded history.
- Updated Step 4 task and verification checkboxes in `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md` after verification passed.
- Files:
  - `README.md`
  - `docs/usage/mvp/maw-cli.md`
  - `docs/usage/mvp/langgraph-ts-template.md`
  - `docs/agents/initiatives/active/init/init-plan.md`
  - `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md`
  - `docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/step-logs/4-align-active-docs-to-the-raw-opencode-json-contract.md` (new)

## Verification

- `bun run build` — passed; it regenerated a formatting-only diff in `dist/agent/graph.js`, which was reverted to keep this step docs-only
- `bun run lint` — passed
- `bun run test` — passed (`8` files, `28` tests)
- `rg "opencode.json|planner|manager|coder|maw-cli dev" README.md docs/usage/mvp docs/agents/initiatives/active/init/init-plan.md` — passed; the updated docs surface the Phase 6 terms throughout the targeted files
- Manual review of active docs for superseded references — passed; remaining mentions in `init-plan.md`, the current `tasks.md`, and active step logs are explicit retirement or historical context rather than active contract guidance

## Summary

- Step 4 completed.
- Active docs now describe workflow-local raw `opencode.json`, planner-first `maw-cli dev <workflow>` launch, the `planner` → `manager` → hidden `coder` execution model, prompt-command retirement, and the retained direct LangGraph compatibility path.

## Remaining / unresolved items

- No Step 4 tasks remain open.
- Step 5 still owns the end-to-end smoke proof for the TTY planner/manager flow, the non-TTY server-only flow, and the retained `/runs/wait` LangGraph compatibility path.
