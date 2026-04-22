> This template is for an initiative plan file:
> `docs/agents/initiatives/active/<initiative-slug>/init-plan.md`

> Planner notes
> - Stay in plan mode until explicitly asked to write the initiative plan.
> - Do not output the full plan until explicitly requested.
> - Clear every ambiguity before writing. Ask questions first when assumptions are not locked.
> - Break delivery into focused, implementable, verifiable phases that coder subagents can execute one at a time.
> - Assume the plan will be reviewed by plan-reviewer agents. If it does not pass first review, a HITL gate is triggered.

<!-- Delete sections that do not apply. Replace open questions with cleared decisions before finalizing the plan. -->

# <Initiative Name> - Initiative Plan

## Status Reset

<optional: explain what earlier assumptions, drafts, or decisions this plan supersedes>

## Finalized Decisions

- <locked architecture, ownership, or rollout decision>
- <locked contract, file shape, CLI, or API decision>
- <locked scope boundary or MVP decision>

## Architecture

```text
<system, repo, or service diagram>
```

## Responsibility Split

| Concern | Owner |
| --- | --- |
| `<concern>` | `<repo/team/component>` |
| `<concern>` | `<repo/team/component>` |

## Target State

<describe the desired end state once the initiative is complete>

### <target layout, scaffold, or topology>

```text
<directory layout, deployment shape, or major artifact topology>
```

### <primary config, contract, or data shape>

<describe the exact contract>

```json
{}
```

### <primary command, API, or workflow surface>

```text
<command surface, interface, or request flow>
```

### <runtime, prompt, tool, or behavior model>

<describe ordering, fallback rules, ownership, or composition semantics>

## MVP Definition

<state the minimum outcome that counts as done for this initiative>

- <capability>
- <capability>
- <capability>

## Post-MVP Follow-On

- <separate initiative or queued work>
- <deliberately deferred item>

## Current State Assessment

- <current implementation conflict>
- <missing capability>
- <stale contract or ownership mismatch>

## Execution Plan

<!-- Each phase should later get its own tasks.md using phase-tasks.template.md. -->

### Phase 0: <alignment or prerequisite phase>

- [ ] complete

- <phase outcome>
- <phase outcome>

### Phase 1: <phase title>

- [ ] complete

- <phase outcome>
- <phase outcome>
- <phase outcome>

### Phase 2: <phase title>

- [ ] complete

- <phase outcome>
- <phase outcome>
- <phase outcome>

### Phase <n>: <phase title>

- [ ] complete

- <phase outcome>
- <phase outcome>
- <phase outcome>

## Verification Gates

### <repo, package, or system name>

- `<command>`
- `<command>`
- `<command>`

### Smoke methodology

- <how disposable verification environments are created>
- <how local changes are exercised before push>
- <where smoke logs or results are recorded>

### Cross-repo acceptance checks

- <observable system-level behavior>
- <observable system-level behavior>
- <observable system-level behavior>

## Execution Order

```text
Phase 0 (<title>)
   -> Phase 1 (<title>)
      -> Phase 2 (<title>)
         -> Phase <n> (<title>)
```

## Installation / Rollout Model

<describe how the initiative lands in a target project, package graph, environment, or deploy flow>

```text
<example install, run, or rollout commands if helpful>
```
