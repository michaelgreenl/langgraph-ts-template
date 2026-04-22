> This template is for a phase `tasks.md` file:
> `docs/agents/initiatives/active/<initiative-slug>/<active-or-complete>/<phase-slug>/tasks.md`

> Planner notes
> - Stay in plan mode until explicitly asked to write the phase plan.
> - Do not output the full plan until explicitly requested.
> - Clear every ambiguity before writing. Ask questions first when assumptions are not locked.
> - Each step must be implementable, verifiable, and focused so coder subagents can execute one step at a time.
> - Assume the plan will be reviewed by plan-reviewer agents. If it does not pass first review, a HITL gate is triggered.

<!-- Delete sections that do not apply. Do not leave open questions in the final plan. -->

# Phase <n> Plan: <phase title>

## Goal

<1 short paragraph describing the end state and why this phase exists.>

## Scope

- `<repo>/<path>` - <what changes here>
- `<repo>/<path>` - <what changes here>
- `<tests/docs/scripts>` - <what must stay aligned>

## Out of Scope

- <explicitly excluded work item>
- <next-phase or separate-initiative item>

## Decisions Cleared

- <resolved decision stated as an exact rule>
- <resolved fallback, warning, output, or file-shape rule>
- <resolved ownership or boundary rule>

## Execution Notes

### <note title>

<add precise behavior, data shape, or command contract that removes ambiguity>

```text
<exact format, example output, path contract, or payload>
```

### <note title>

<add another exact rule only if it materially reduces implementation ambiguity>

## Work Plan

<!-- Keep each step to one concern. Every step needs concrete edits and its own verification. Copy the step block as needed. -->

### 1. <step title>

<say why this step exists, what it owns, and what it must not pull in yet>

- [ ] `<file or area>`: <specific change>
- [ ] `<file or area>`: <specific change>
- [ ] `<tests>`: <coverage or fixture update>

Verify:

- [ ] `<command>`
- [ ] `<command or manual check>`

### 2. <step title>

<say why this step exists, what it owns, and what it must not pull in yet>

- [ ] `<file or area>`: <specific change>
- [ ] `<file or area>`: <specific change>
- [ ] `<tests>`: <coverage or fixture update>

Verify:

- [ ] `<command>`
- [ ] `<command or manual check>`

### 3. <step title>

<continue until the phase is fully decomposed into focused, sequential steps>

- [ ] `<file or area>`: <specific change>
- [ ] `<file or area>`: <specific change>
- [ ] `<tests/docs/smoke>`: <coverage or verification update>

Verify:

- [ ] `<command>`
- [ ] `<command or manual check>`

## Verification

### Per-step verification

- [ ] Step 1: `<command>`
- [ ] Step 2: `<command>`
- [ ] Step 3: `<command>`

### Phase completion

- [ ] `<repo or package>`: `<typecheck, build, lint, or test command>`
- [ ] `<repo or package>`: `<integration or smoke command>`
- [ ] `<manual acceptance check if needed>`

## Exit Criteria

- [ ] <observable end-state>
- [ ] <observable end-state>
- [ ] <observable end-state>
