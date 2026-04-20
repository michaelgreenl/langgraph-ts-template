# Step 7 Log

## Pre-flight

- Read the full `tasks.md` before editing and reviewed the Step 7 checklist, execution notes, scope, and out-of-scope sections.
- Concern found: `maw-smoke/README.md` still pointed at `tests/maw-smoke-<test-slug>` and did not describe the manual local-checkout smoke flow.
- Concern found: `maw-smoke/scripts/initialize-maw-smoke.sh` already installed local repo paths, but it still auto-ran `bunx maw-cli init`, which conflicted with the Step 7 manual runbook.
- Concern found: the Step 7 runbook required a manual `bunx maw-cli init`, but the Step 7 verification checkboxes omitted that command.
- No unresolved blocker remained after scoping the fix to the smoke initializer and the Step 7 documentation/runbook files.

## Changes

- [x] Checklist item 1 — Update `../maw-smoke/scripts/initialize-maw-smoke.sh`
  - Removed the automatic `bunx maw-cli init` call so `bun smoke-init <test-slug>` now only prepares the disposable project and installs local checkout paths.
  - Added a short completion message telling the operator to run the remaining `bunx maw-cli ...` commands manually.
- [x] Checklist item 2 — Update `docs/agents/initiatives/active/init/init-plan.md`
  - Clarified that the initializer prepares the disposable project first, then `bunx maw-cli init` plus the remaining verification commands are run manually inside that project.
- [x] Checklist item 3 — Update this Phase 3 plan so the README-driven flow is canonical
  - Aligned the Step 7 wording with the manual smoke flow and updated the Step 7 verification checklist so it explicitly includes `bunx maw-cli init`.
- [x] Checklist item 4 — Define and exercise the manual Phase 3 smoke runbook
  - Updated `maw-smoke/README.md` so the canonical smoke instructions now point at `tests/smoke-<test-slug>/`, local checkout installs, and manual `bunx maw-cli ...` execution.
  - Ran the full manual flow: `bun smoke-init phase3-prompt-commands`, `bunx maw-cli init`, `bunx maw-cli prompt:list langgraph-ts-template`, wrote `.maw/templates/security.njk`, and ran `bunx maw-cli prompt:preview langgraph-ts-template planner`.
  - Logged the actual smoke results in `maw-smoke/docs/agents/smoke-logs/phase3-prompt-commands.md`.

## Files

- `maw-smoke/README.md`
- `maw-smoke/scripts/initialize-maw-smoke.sh`
- `maw-smoke/docs/agents/smoke-logs/phase3-prompt-commands.md`
- `langgraph-ts-template/docs/agents/initiatives/active/init/init-plan.md`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/7-replace-the-retired-phase-local-smoke-harness-with-the-manual-local-repo-smoke-workflow.md`

## Verification

- PASS — `bun run build` in `langgraph-ts-template`
- PASS — `bun run lint` in `langgraph-ts-template`
- PASS — `bun run test` in `langgraph-ts-template`
- N/A — `bun run build`, `bun run lint`, and `bun run test` were not run in `maw-smoke`; that repo currently exposes only `smoke-init` in `package.json`
- PASS — `bun smoke-init phase3-prompt-commands` in `maw-smoke`
  - Created `maw-smoke/tests/smoke-phase3-prompt-commands/`
  - Installed local checkout paths for `../maw-cli` and `../langgraph-ts-template`
  - Confirmed the generated project did **not** contain `maw.json` or `.maw/` before the manual `init` step
- PASS — `bunx maw-cli init` in `maw-smoke/tests/smoke-phase3-prompt-commands/`
- PASS — `bunx maw-cli prompt:list langgraph-ts-template` in `maw-smoke/tests/smoke-phase3-prompt-commands/`

  ```text
  planner: general, security, research-rules
  coder: general, security, typescript
  ```

- PASS — wrote `maw-smoke/tests/smoke-phase3-prompt-commands/.maw/templates/security.njk` with `custom security override`
- PASS — `bunx maw-cli prompt:preview langgraph-ts-template planner` in `maw-smoke/tests/smoke-phase3-prompt-commands/`

  ```text
  Favor small, reversible changes and prefer the simplest correct implementation.

  custom security override

  Verify claims against repository evidence and call out assumptions when evidence is incomplete.
  ```

- PASS — Removed the disposable `maw-smoke/tests/smoke-phase3-prompt-commands/` directory after the smoke log was written

## Summary

- Step 7 is now aligned around a real manual smoke workflow: `bun smoke-init` provisions a disposable local-checkout project, the operator runs `bunx maw-cli ...` commands manually, and the exact smoke results are recorded under `maw-smoke/docs/agents/smoke-logs/`.
- Also cleaned up: fixed the stale smoke README path (`tests/smoke-<test-slug>`) and removed the retired auto-init behavior so the docs match the actual runbook.

## Remaining

- No Step 7 checklist items remain incomplete.
- The broader Phase 3 `### Phase completion` checklist in `tasks.md` remains outside this step and was not updated.

## Issues

- None requiring escalation.
