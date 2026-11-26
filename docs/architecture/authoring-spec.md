# Authoring specification (agents, skills, workflows)

`scripts/validate/validate.mjs` (also `ship-anything validate`) enforces everything marked
**MUST**. Keep files dense: every line should change an agent's behaviour.

## Agents — `agents/<name>.md`

Frontmatter (YAML) — MUST:

```yaml
---
name: frontend-agent            # == filename, kebab-case
description: >-                 # when the orchestrator should delegate to this agent (≤ 400 chars);
  ...                           # adapters reuse it as the native subagent description
role: Frontend Engineer
required_skills: [frontend-development, responsive-design]   # MUST exist in skills/
optional_skills: [frontend-polish, motion-design]            # MUST exist in skills/
capabilities: [read, write, shell, browser]                  # abstract: read|write|shell|web|browser|delegate|mcp
---
```

Body — MUST contain these `##` headings, in this order:

1. `Role` 2. `Mission` 3. `Scope` 4. `Responsibilities` 5. `Exclusions`
6. `Required skills` 7. `Optional skills` 8. `Required tools` 9. `Input contract`
10. `Output contract` 11. `Operating procedure` 12. `Decision authority`
13. `Delegation rules` 14. `Collaboration` 15. `File ownership`
16. `Integration requirements` 17. `Quality standards` 18. `Security requirements`
19. `Error handling` 20. `Escalation` 21. `Completion criteria`

Rules:
- Exclusions name the agent that owns the excluded work (no orphaned responsibilities).
- Input contract references `.ship-anything/templates/task-contract.yaml`; output contract
  references `agent-report.md`.
- Only the orchestrator delegates. Specialists may *request* delegation via their report.
- Target length 120–220 lines. No filler.

## Skills — `skills/<name>/SKILL.md` (Agent Skills format)

Frontmatter — MUST:

```yaml
---
name: frontend-development      # == directory name; [a-z0-9-], ≤ 64 chars
description: >-                 # what it does AND when to use it; ≤ 1024 chars; third person
  ...
license: MIT
metadata:
  category: software-engineering  # product-intelligence|software-engineering|design|creative-production|quality|delivery|efficiency
  version: "0.1.0"
  agents: [frontend-agent]        # agents that use it; MUST exist
---
```

Body — MUST contain these `##` headings, in this order:

1. `Purpose` 2. `When to use` 3. `Inputs` 4. `Procedure` 5. `Decision rules`
6. `Tools` 7. `Quality standards` 8. `Common failures` 9. `Outputs` 10. `Done when`

Rules:
- `When to use` includes **when not to use** (prevents over-activation).
- `Procedure` is numbered and executable; commands are real and tool-agnostic where possible.
- If an upstream skill is better, the skill says so in `Tools` and points to its registry
  entry rather than duplicating it.
- Keep `SKILL.md` ≤ ~250 lines; put long material in `references/*.md` (loaded on demand)
  and deterministic helpers in `scripts/`.
- No secrets, no fabricated numbers, no instructions to bypass user permissions.

## Workflows — `workflows/<name>.md`

Frontmatter — MUST: `name`, `description`, `level` (list of L1–L4), `required_agents`,
`optional_agents`, `required_skills` (all MUST resolve), `composes` (other workflows, MAY be empty).

Body — MUST contain `##` headings:
`Purpose`, `When to use`, `Inputs`, `Agents`, `Skills and tools`, `Task graph`,
`Parallel opportunities`, `Sequential requirements`, `Acceptance criteria`,
`Quality gates`, `Deliverables`, `Completion conditions`, `Failure recovery`.
