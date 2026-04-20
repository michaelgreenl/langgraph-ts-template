# Step 6 Log

## Pre-flight

- No blocking contract conflicts found.
- Root cause matched the plan note: `maw-cli` prompt commands resolved `${packageName}/config` and `${packageName}/templates` with `createRequire(...).resolve()`, which broke against conditional `exports`.
- Non-blocking note: Step 6 needed real-package smoke verification, but I did not modify Step 7 files; I used the existing `maw-smoke` workflow only for verification.

## Changes

- Checklist 1 — **done**: updated prompt-command package loading in `maw-cli` to import workflow subpaths through shared export-manifest resolution, and added `default` conditions to the real `langgraph-ts-template` `./config` and `./templates` exports so installed-consumer resolution works with conditional exports.
- Checklist 2 — **done**: expanded `langgraph-ts-template/tests/unit/package-metadata.spec.ts` to assert the `default` export conditions and to verify installed-consumer resolution for `langgraph-ts-template/config` and `langgraph-ts-template/templates`.
- Checklist 3 — **done**: updated fixture package manifests so `coding` now mirrors the real conditional prompt-command export shape, and `code-agent` uses conditional subpath exports to keep the CLI regression covered automatically.
- Checklist 4 — **done**: extended `maw-cli/tests/prompt-list.test.ts` and `maw-cli/tests/prompt-preview.test.ts` with conditional-export regression cases.
- Checklist 5 — **done**: verified `bunx maw-cli prompt:list langgraph-ts-template` inside `maw-smoke/tests/smoke-step6-real-package-resolution/`.
- Checklist 6 — **done**: verified `bunx maw-cli prompt:preview langgraph-ts-template planner` inside the same disposable smoke project.
- Also cleaned up: consolidated repeated package-subpath loading into `importPackageSubpath()` in `maw-cli/src/utils/workflows.ts` (G5) and shortened a conflicting local name to `name` (N1).

## Files

- `langgraph-ts-template/package.json`
- `langgraph-ts-template/tests/unit/package-metadata.spec.ts`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/09-prompt-management-commands/tasks.md`
- `langgraph-ts-template/docs/agents/initiatives/active/init/active/09-prompt-management-commands/step-logs/6-fix-prompt-command-resolution-against-the-real-installed-workflow-package.md`
- `maw-cli/src/commands/prompt-list.ts`
- `maw-cli/src/commands/prompt-preview.ts`
- `maw-cli/src/utils/workflows.ts`
- `maw-cli/tests/fixtures/workflows/coding/package.json`
- `maw-cli/tests/fixtures/workflows/code-agent/package.json`
- `maw-cli/tests/init.test.ts`
- `maw-cli/tests/prompt-list.test.ts`
- `maw-cli/tests/prompt-preview.test.ts`
- `maw-cli/dist/commands/prompt-list.js`
- `maw-cli/dist/commands/prompt-preview.js`
- `maw-cli/dist/utils/workflows.d.ts`
- `maw-cli/dist/utils/workflows.js`

## Verification

### TDD red/green evidence

- `bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template` — **FAIL (expected red)** before the fix; missing `default` export conditions and installed-consumer resolution failed.
- `bun run test -- tests/prompt-list.test.ts tests/prompt-preview.test.ts` in `maw-cli` — **FAIL (expected red)** before the fix; new conditional-export regression tests returned exit code `1`.
- `bun run test -- tests/init.test.ts` in `maw-cli` — **PASS** after adjusting the fixture-export assertion to use the shared conditional-export loader.

### Final verification

- `bun run build && bun run lint && bun run test && bun run test -- tests/unit/package-metadata.spec.ts` in `langgraph-ts-template` — **PASS**
- `bun run build && bun run lint && bun run test && bun run test -- tests/prompt-list.test.ts tests/prompt-preview.test.ts tests/cli.test.ts` in `maw-cli` — **PASS**
- `bun smoke-init step6-real-package-resolution` in `maw-smoke` — **PASS**; created `maw-smoke/tests/smoke-step6-real-package-resolution/`, initialized MAW with the local `langgraph-ts-template` checkout, and the disposable directory was removed after verification.
- `bunx maw-cli prompt:list langgraph-ts-template` in `maw-smoke/tests/smoke-step6-real-package-resolution/` — **PASS**
  - Output:
    - `planner: general, security, research-rules`
    - `coder: general, security, typescript`
- `bunx maw-cli prompt:preview langgraph-ts-template planner` in `maw-smoke/tests/smoke-step6-real-package-resolution/` — **PASS**
  - Output was prompt body only, beginning with:
    - `Favor small, reversible changes and prefer the simplest correct implementation.`

## Summary

- Fixed real-package prompt-command resolution against conditional exports.
- Added regression coverage in both repos so the installed-package path is exercised by tests instead of only string-export fixtures.
- Completed all Step 6 checklist items and updated the Step 6 checkboxes in the plan.

## Remaining

- None for Step 6.
- Step 7 manual-smoke documentation/logging work remains outside this step’s scope.

## Issues

- No unresolved blockers.
- During verification, a temp-directory smoke attempt was rejected in favor of the prescribed `maw-smoke` flow; verification was rerun with `bun smoke-init ...` and completed successfully.
