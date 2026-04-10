# Phase 2d Plan: System Prompt Composition

## Goal

Land a prompt-composition runtime that builds each graph's system prompt from configured snippets, injects it into the conversation as the first `SystemMessage`, and keeps that prompt stable across turns.

## Scope

- Nunjucks-backed snippet rendering
- Source resolution for embedded defaults, local `.maw/templates/`, and pre-cloned template repos
- Deterministic snippet ordering from `.maw/config.json`
- Graph-side system prompt insertion and persistence
- Unit, integration, and smoke verification for the prompt-composition path

## Out of Scope

- Generated `langgraph.json` in the target project (`2e`)
- OpenViking retrieval/indexing flows (`4a` / `4b`)
- OpenViking HTTP retrieval inside the graph (`4c`), beyond accepting already-gathered context as render input
- Git-repo cloning/sync logic for template repos; this phase only consumes repo snippets that already exist on disk
- Replacing the current stub model behavior with a real provider integration

## Open Question

- [ ] Freeze how the single exported graph selects an agent prompt profile. The scaffolded config already defines `templates.agents.researcher` and `templates.agents.coder`, but the runtime currently exports one `graph` and `graph.name` is not an agent key. Resolve this contract before implementation instead of silently overloading an unrelated field.

## Work Plan

### 1. Freeze the Prompt-Composition Contract

- [ ] Confirm the render inputs for prompt composition: selected agent key, `workspacePath`, project-type variables, and optional OpenViking-derived context.
- [ ] Define the graph-to-agent selection rule for the single exported graph and document it in code comments/tests before wiring the runtime.
- [ ] Define failure behavior for missing snippets, unknown agents, and missing template sources so prompt composition fails loudly and early.
- [ ] Define the composed prompt join strategy so snippet boundaries are deterministic and stable across platforms.

### 2. Implement the Template Engine and Resolver

- [ ] Add the concrete Nunjucks-based implementation for `src/templates/engine.ts`; keep `compose(agent, vars?)` as the public shape unless a smaller API falls out naturally.
- [ ] Add embedded-default loading from `src/templates/defaults/*.njk` so published packages always have a fallback source.
- [ ] Add deterministic source precedence for same-name snippet collisions:
    - `.maw/templates/` wins over everything else
    - `.maw/template-repos/` wins over embedded defaults
    - embedded defaults remain the fallback
- [ ] Resolve snippets in config order: global snippets first, then the selected agent's snippets.
- [ ] Render every snippet with the same variable bag and surface clear errors when a template cannot be found or rendered.

### 3. Wire Prompt Composition Into the Graph

- [ ] Extend the graph runtime so `createGraph()` can load or receive MAW config, select the agent prompt profile, and compose the system prompt once per compiled graph instance.
- [ ] Add a dedicated graph bootstrap step that inserts the cached `SystemMessage` only when the conversation does not already start with it.
- [ ] Keep the injected system prompt at index `0` in `state.messages` so later turns preserve it instead of duplicating it.
- [ ] Keep the rest of the graph behavior narrow for this phase: prompt composition lands first, model/provider wiring stays stubbed.
- [ ] Export the smallest useful helper surface for direct tests and smoke checks if graph-only verification is too opaque.

### 4. Add Focused Test Coverage

- [ ] Add unit coverage for snippet ordering, source precedence, variable interpolation, unknown-agent failures, and missing-snippet failures.
- [ ] Add graph integration coverage that proves the first state message is a `SystemMessage` and that a second turn does not insert a duplicate one.
- [ ] Add coverage for custom template overrides so a local `.maw/templates/` snippet beats the embedded default with the same name.
- [ ] Keep tests local and deterministic; do not require a real model call or real OpenViking server for this phase.

### 5. Prepare the Smoke Handoff

- [ ] Add a smoke entry in `../maw-smoke/maw-smoke-1` for Phase `2d`, preferably as a named Bun script such as `smoke:system-prompt`.
- [ ] Have the smoke flow install/use the local workflow package under test plus the local `maw-cli`, run `bunx maw-cli init`, and then exercise prompt composition through the scaffolded `.maw/` contract.
- [ ] In the smoke fixture, add a local override snippet in `.maw/templates/` so the test proves local custom templates outrank embedded defaults.
- [ ] Assert in the smoke run that:
    - the graph starts with a `SystemMessage`
    - the composed text respects configured order (`globalSnippets` before agent snippets)
    - the local override wins over the embedded snippet with the same name
    - a second invocation reuses the existing system prompt instead of prepending another one

## Verification

- [ ] `bun run build`
- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run test:int`
- [ ] Smoke test in `../maw-smoke/maw-smoke-1` via a dedicated script such as `bun run smoke:system-prompt`, using the local workflow package and local `maw-cli`, with assertions for prompt order, source precedence, first-message placement, and no duplicate system prompt on turn two.

## Exit Criteria

- [ ] The workflow package can deterministically compose a system prompt for the selected agent from configured snippets.
- [ ] Source precedence matches the Phase `2d` contract: local custom > template repos > embedded defaults.
- [ ] The graph preserves exactly one leading `SystemMessage` across turns.
- [ ] Unit, integration, and `../maw-smoke` verification all pass without requiring a real model provider or OpenViking server.
