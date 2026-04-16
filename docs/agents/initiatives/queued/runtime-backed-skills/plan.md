# Runtime-Backed Skills — Plan

## Status

Queued, post-MVP.

This initiative depends on the MAW MVP being complete first:

- `maw-cli` project scaffold finalized
- workflow-local prompt config finalized
- prompt inspection commands implemented
- base codebase agent implemented and verified in a test project

## Goal

Support skills that require their own runtime while keeping MAW's prompt and context injection deterministic.

This initiative exists to solve these problems:

- avoid manually copying prompt/template files around between tools and projects
- avoid per-agent or provider-specific skill installation flows
- avoid runtime autoloading decisions made opportunistically by the model
- allow reusable installed skill packages to be injected through MAW config instead

The desired outcome is that a workflow can declare a skill in config, and MAW resolves it before execution or during graph build in a predictable, inspectable way.

## Non-Goals

- replacing the MVP prompt/template model for static `.njk` snippets
- letting the model decide when or whether to load a skill
- requiring skill installation on a per-agent basis
- tying a skill package to a specific model provider runtime

## Finalized Constraints

- skills must remain declarative and deterministic
- skill selection must come from MAW-managed config, not model discretion
- runtime-backed skills must be inspectable through CLI tooling before workflow execution
- runtime-backed skills must be reusable across workflows and agents without manual prompt copying
- runtime requirements must be declared explicitly
- failures must be loud and attributable to the skill package or runtime, not silently ignored

## Proposed Config Direction

The existing per-workflow config keeps simple string skill names for static prompt snippets.

Runtime-backed skills should extend that model rather than replace it.

Conceptual direction:

```json
{
    "agents": {
        "planner": {
            "skills": [
                "general-coding",
                {
                    "type": "runtime",
                    "name": "repo-summary",
                    "package": "@acme/skill-repo-summary",
                    "runtime": "node",
                    "entry": "dist/index.js",
                    "args": {
                        "depth": 2
                    }
                }
            ]
        }
    }
}
```

The static string case stays the default path for ordinary `.njk` snippets.

The object form is reserved for runtime-backed skills.

## Runtime Skill Contract

Each runtime-backed skill should declare enough metadata for MAW to resolve and execute it deterministically.

Minimum metadata:

- package name
- runtime kind (`node`, `python`, `binary`, or similar)
- entrypoint
- arguments/config payload
- output mode (prompt fragment, structured JSON, or other future extension)

Future metadata that may be needed:

- timeout
- cache policy
- version pinning
- environment requirements
- install verification command

## Resolution Model

Runtime-backed skills should resolve in a fixed lifecycle.

### 1. Config resolution

MAW reads the workflow-local config and determines the ordered skill list for an agent.

### 2. Static template resolution

Any string skill names resolve using the existing template flow:

- target-project override in `.maw/templates/`
- workflow package embedded defaults

### 3. Runtime skill resolution

Any runtime skill objects resolve by:

- verifying the referenced package/entrypoint exists
- verifying the required runtime exists
- constructing a deterministic execution request
- executing before the workflow runs or during graph build, not as an LLM-side autoloading decision

### 4. Output capture

The runtime skill's output is captured and turned into a prompt fragment or another explicitly supported artifact.

### 5. Prompt inspection

`maw-cli prompt:preview` must surface runtime-backed skill output so users can inspect what the agent will actually receive.

## CLI Implications

This initiative should extend the existing prompt tooling rather than invent a separate opaque execution path.

Planned CLI expectations:

- `maw-cli prompt:list <workflow>` should distinguish static vs runtime-backed skills
- `maw-cli prompt:preview <workflow> <agent>` should show the resolved output for runtime-backed skills
- future MAW commands may be needed for installation or verification, but they are not required for the first implementation pass

## Security and Control Requirements

Runtime-backed skills increase risk and need explicit controls.

Minimum controls:

- explicit runtime declarations
- explicit timeouts
- bounded output size
- deterministic caching rules
- no silent fallback to autoloading
- clear stderr/stdout capture rules
- clear failure messages when a runtime or package is missing

Potential future controls:

- package allow-lists
- network restrictions
- execution sandboxing
- project-level runtime policy in `maw.json`

## Delivery Plan

### Phase A: Config and contract design

- finalize the runtime skill object schema
- decide what metadata is mandatory vs optional
- decide where runtime policy belongs (`maw.json`, workflow config, or both)

### Phase B: Resolver and executor

- implement resolution of runtime-backed skills from config
- implement runtime verification
- implement execution and output capture
- define caching behavior

### Phase C: Prompt integration

- integrate runtime-backed output into prompt composition
- ensure ordering remains deterministic alongside static snippets
- update template/prompt preview flows

### Phase D: CLI inspection and verification

- extend `prompt:list` and `prompt:preview`
- add diagnostics for missing runtimes or packages
- add smoke coverage around a simple runtime-backed skill package

## Verification Gates

- config validation rejects malformed runtime skill declarations
- missing runtime produces a clear error
- missing package or entrypoint produces a clear error
- `prompt:list` identifies runtime-backed skills distinctly
- `prompt:preview` includes runtime-backed skill output
- ordering of static and runtime-backed skills is stable and matches config order
- no runtime-backed skill depends on LLM-side autoloading to function

## Acceptance Criteria

- a workflow can declare at least one runtime-backed skill through config
- MAW resolves it deterministically before or during graph build
- the resolved output is inspectable through CLI tooling
- the same runtime-backed skill can be reused across workflows without reinstalling it per agent
- runtime-backed skills remain a MAW-managed capability, not a provider-specific autoloading mechanism
