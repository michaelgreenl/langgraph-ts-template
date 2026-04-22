# Step 4 Log

## Step

- Step 4: Restore OpenAI-backed OpenViking docs

## Pre-flight

- Read the full `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md` before editing.
- Scanned `docs/usage/mvp/maw-cli.md`, `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`, and `docs/agents/initiatives/active/init/init-plan.md` for the current `.maw/ov.conf` contract.
- Confirmed the docs still showed the reduced `.maw/ov.conf` example with only storage/server fields while the approved seeded runtime contract restores OpenAI-backed embedding and VLM defaults.
- Confirmed scope stays documentation-only for this retry: no product code changes and no Step 5 smoke-log rewrite.
- No blockers found.

## Changes

- Updated `docs/usage/mvp/maw-cli.md` to show the restored seeded `.maw/ov.conf` defaults, clarify that `${OPENAI_API_KEY}` remains literal in the scaffolded file, and tighten ownership wording for scaffolded config files.
- Updated `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md` so the execution notes, Step 4 wording, Step 5 smoke expectations, and exit criteria match the restored OpenAI-backed `.maw/ov.conf` contract.
- Updated `docs/agents/initiatives/active/init/init-plan.md` so the finalized decisions, `.maw/ov.conf` reference section, and cross-repo acceptance checks match the restored OpenAI-backed defaults and placeholder ownership.

## Files

- `docs/usage/mvp/maw-cli.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md`
- `docs/agents/initiatives/active/init/init-plan.md`
- `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/4-restore-openai-backed-openviking-docs.md`

## Verification

- PASS — `bun run build`
  - Output: `$ tsc`
- PASS — `bun run lint`
  - Output: `$ eslint src`
- PASS — `bun run test`
  - Output: `7` test files passed, `29` tests passed.
- PASS — `rg "text-embedding-3-large|gpt-4o|OPENAI_API_KEY|127\.0\.0\.1" docs/usage/mvp/maw-cli.md docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md docs/agents/initiatives/active/init/init-plan.md`
  - Output: matched the restored OpenAI-backed defaults and placeholder text in all three target files.
- PASS — `! rg '"host": "0\.0\.0\.0"|0\.0\.0\.0' docs/usage/mvp/maw-cli.md docs/agents/initiatives/active/init/active/10-openviking-integration/tasks.md docs/agents/initiatives/active/init/init-plan.md`
  - Output: no matches.
- PASS — `rg "maw:ov:server|maw:ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`
  - Output: matched the expected Phase 4 script references in both usage docs.
- PASS — `! rg "ov:init|maw-cli ov:index" docs/usage/mvp/maw-cli.md docs/usage/mvp/langgraph-ts-template.md`
  - Output: no matches.

## Summary

- Corrected the Phase 4 documentation contract so the plan and user-facing MAW docs now match the restored OpenAI-backed `.maw/ov.conf` scaffold.
- Kept `.maw/ovcli.conf` on `http://localhost:1933` and documented that `${OPENAI_API_KEY}` stays literal in the scaffolded server config for OpenViking to resolve.

## Remaining

- Step 5 smoke verification still needs to be rerun against the restored contract after this docs correction.
- The blocked Step 5 smoke log was intentionally left unchanged in this retry.

## Issues

- Unrelated pre-existing untracked file `docs/agents/initiatives/active/init/active/10-openviking-integration/step-logs/5-prove-the-final-script-driven-flow-in-a-disposable-smoke-project.md` remains in the working tree and was left untouched because Step 5 is out of scope for this retry.
