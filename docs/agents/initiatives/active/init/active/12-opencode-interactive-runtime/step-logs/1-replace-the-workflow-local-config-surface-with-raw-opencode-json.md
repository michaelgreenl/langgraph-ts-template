# Step 1 Log

## Step

- Step 1: Replace the workflow-local config surface with raw `opencode.json`
- Attempt: post-plan-fix retry to finish the scaffold-facing integration handoff and the new Step 1 integration verification command

## Pre-flight

- No blocking contract conflict surfaced in the Step 1 scope.
- Remaining unchecked Step 1 work was limited to `tests/integration/scaffold.test.ts` and `bun run test:int -- tests/integration/scaffold.test.ts`.
- Noted seam from the failed first attempt: the validator enforced the planner / manager / hidden coder topology, but it did not yet enforce the packaged agent permission baselines clarified in the updated plan. That was resolved inside Step 1 by reading `.opencode/agents/{planner,manager,coder}.md` frontmatter for baseline checks.
- Step 2 compatibility-runtime changes remained out of scope for this retry.

## Changes

- Kept the existing valid Step 1 `opencode.json` scaffold and public API changes in place.
- Replaced the scaffold integration handoff expectations so the test now verifies only `graph.ts` plus `opencode.json`, checks the packaged planner / manager / coder permission baselines, and confirms reruns stay idempotent.
- Added packaged-agent frontmatter parsing in the scaffold layer and tightened `workflowOpencodeSchema` so edited workflow-local permissions must match the packaged baselines before launch.
- Updated the affected unit validator fixtures to match the tightened Step 1 contract.
- Updated the active Phase 6 plan docs to pin `.opencode/agents/{planner,manager,coder}.md` frontmatter as the permission-baseline source of truth and to keep the scaffold-facing integration handoff in Step 1.
- Also cleaned up: removed the retired template-dir assertion from the scaffold integration handoff and replaced it with raw `opencode.json` assertions (C2, G16).

### Files

- dist/agent/graph.d.ts
- dist/config.js
- dist/index.d.ts
- dist/index.js
- dist/scaffold/assets.d.ts
- dist/scaffold/assets.js
- dist/scaffold/index.d.ts
- dist/scaffold/index.js
- docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/tasks.md
- docs/agents/initiatives/active/init/active/12-opencode-interactive-runtime/step-logs/1-replace-the-workflow-local-config-surface-with-raw-opencode-json.md
- docs/agents/initiatives/active/init/init-plan.md
- package.json
- src/config.ts
- src/index.ts
- src/scaffold/assets.ts
- src/scaffold/assets/opencode.json
- src/scaffold/index.ts
- tests/integration/scaffold.test.ts
- tests/unit/config.spec.ts
- tests/unit/package-metadata.spec.ts
- tests/unit/public-api.spec.ts
- tests/unit/scaffold.spec.ts
- tests/unit/templates.spec.ts

## Verification

- `bun run test:int -- tests/integration/scaffold.test.ts` -> failed first as expected during TDD on the retry (`1 failed, 1 passed`)
- `bun run test:int -- tests/integration/scaffold.test.ts` -> passed after the validator update (`2 passed`)
- `bun run test -- tests/unit/config.spec.ts tests/unit/scaffold.spec.ts tests/unit/templates.spec.ts tests/unit/public-api.spec.ts tests/unit/package-metadata.spec.ts` -> failed after tightening the validator (`2 failed, 14 passed`)
- `bun run test -- tests/unit/config.spec.ts tests/unit/scaffold.spec.ts tests/unit/templates.spec.ts tests/unit/public-api.spec.ts tests/unit/package-metadata.spec.ts` -> passed after updating the unit fixtures (`16 passed`)
- `bun run build` -> failed once on recursive type / `Array.prototype.at()` compatibility, then passed on the second attempt
- `bun run lint` -> passed
- `bun run typecheck` -> passed
- `bun run test` -> passed (`27 passed`)
- `bun run test:int -- tests/integration/scaffold.test.ts` -> passed (`2 passed`)

## Summary

- Step 1 is complete after the post-plan-fix retry.
- The workflow package now keeps the raw `opencode.json` scaffold handoff independently verifiable under the repo hooks.
- The validator now rejects permission drift from the packaged planner / manager / coder frontmatter baselines.

## Remaining / unresolved items

- No Step 1 tasks remain incomplete.
- Follow-up for Step 2: the retained LangGraph compatibility runtime and its legacy workflow-config assumptions remain owned by Step 2.
- No commit was created.
