# Phase 2d Handoff

## Prompt Profile Contract

The single exported graph now selects its prompt profile from `.maw/config.json` via `graph.agent`.

- `graph.name` stays the graph name
- `graph.agent` must match a key in `templates.agents`
- `createGraph({ agent? })` can override the configured agent explicitly for tests or alternate entry points

This keeps `.maw/graph.ts` minimal for phase `2e` while making prompt selection explicit instead of overloading `graph.name`.

## Template Runtime

The workflow package now exports `createTemplateEngine()` and keeps `compose(agent, vars?)` as the public composition entry point.

- snippet order is deterministic: `globalSnippets` first, then the selected agent snippets
- snippet boundaries are normalized and joined with `\n\n`
- same-name collisions resolve in this order: local `.maw/templates/`, then sorted `.maw/template-repos/*`, then embedded defaults
- unknown agents, missing snippets, and missing enabled source directories fail loudly

The render bag is shared across all snippets in a composition pass. The runtime always provides `workspacePath`, and callers can pass additional vars through `createGraph({ vars })` or direct engine usage.

## Graph Runtime

`createGraph()` now composes the system prompt once per compiled graph instance and caches it.

- the graph adds an `ensurePrompt` bootstrap node ahead of `callModel`
- the bootstrap inserts a `SystemMessage` only when the conversation does not already start with the cached prompt
- the system prompt uses a stable `MAW_SYSTEM_ID`
- the message reducer keeps that message pinned at index `0` across later turns so it is not duplicated or displaced

The rest of the graph remains intentionally narrow for this phase: model behavior is still stubbed.

## Smoke Gate

`../maw-smoke/maw-smoke-1` now contains the Phase `2d` smoke path:

- local dependencies on the workflow package and local `maw-cli`
- `bun run smoke:system-prompt`
- `bunx maw-cli init` to scaffold `.maw/`
- a local `.maw/templates/general-coding.njk` override to prove custom precedence
- assertions for first-message placement, snippet ordering, override precedence, and no duplicate system prompt on turn two

## Phase Boundary

Phase `2d` stops at deterministic prompt composition and graph-side prompt persistence.

- phase `2e` can keep `.maw/graph.ts` minimal because prompt profile selection now lives in `.maw/config.json`
- phase `4c` can reuse the existing `vars` bag for already-gathered context, but query-time OpenViking retrieval is still separate work because the prompt is cached when the graph is created, not recomposed per turn
