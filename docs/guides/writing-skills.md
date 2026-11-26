# Writing skills

A skill is a folder with a `SKILL.md` in the [Agent Skills](https://agentskills.io) format: YAML
frontmatter that tells the agent *when* to load it, and a body that tells it *how* to do the
work. Agents see only the name and description until the skill is selected, then load the full
body (progressive disclosure). A good skill therefore has a precise description and a short,
executable body.

The rules are in the [authoring spec](../architecture/authoring-spec.md). The validator
enforces everything marked MUST there. This guide is the practical path through it.

## 1. Decide whether a new skill is right

Write a new skill when an agent repeatedly lacks a procedure that is specific, testable and
not already covered. Before writing:

- Check the [catalog](../architecture/catalog.md) and `ship-anything skills list`. Extending an existing skill is often better.
- Check upstream skills. If a maintained external skill is better, add it to the registry instead (see [Adding external skills](adding-external-skills.md)), or point to it from your skill's `Tools` section.
- Decide which agents use it. Every skill must list existing agents in `metadata.agents`.

## 2. Create the folder

```
skills/<name>/
  SKILL.md            # required, aim for 250 lines or fewer
  references/*.md     # optional: long material, loaded only when SKILL.md says so
  scripts/*           # optional: deterministic helpers (reviewed more strictly)
```

`<name>`: lowercase `[a-z0-9-]`, at most 64 characters, equal to the folder name.

## 3. Frontmatter

```yaml
---
name: payment-webhooks
description: >-
  Implements and verifies payment-provider webhooks: signature verification, idempotent
  event handling, retries and replay protection, with test-mode fixtures. Use when adding
  or changing webhook endpoints for Stripe-like providers. Not for client-side checkout UI.
license: MIT
metadata:
  category: software-engineering   # product-intelligence|software-engineering|design|creative-production|quality|delivery|efficiency
  version: "0.1.0"
  agents: [integration-agent, backend-agent]
---
```

The description (1024 characters at most, third person) is what triggers activation. Say what
it does **and** when to use it, using the words a user or orchestrator would actually write.
A description that is too broad causes over-activation. Add a "not for" clause when a
neighboring skill exists.

## 4. Body: ten headings, in this order

| Heading | What to write |
|---|---|
| `## Purpose` | The outcome, in two or three sentences |
| `## When to use` | Triggers, **and** "Do not use when" with the skill to use instead |
| `## Inputs` | Files, contracts and facts the agent must read first |
| `## Procedure` | Numbered, executable steps with real commands. Tool-agnostic where possible |
| `## Decision rules` | If/then choices the agent will face (library choice, when to stop, when to escalate) |
| `## Tools` | CLIs, libraries, MCP servers. Point to upstream skills or registry entries rather than duplicating them |
| `## Quality standards` | Measurable bar (tests, accessibility level, performance budget) |
| `## Common failures` | Mistakes agents actually make, and how to detect them |
| `## Outputs` | Files and report sections produced |
| `## Done when` | A checklist that maps to evidence in the agent report |

Write for an agent that is capable but has no context. Every line should change its behavior.
Cut generic advice ("write clean code").

Hard rules from the spec: no secrets, no fabricated numbers, no instructions that bypass user
permissions or the [authorization policy](../../.ship-anything/policies/authorization.md).

## 5. Validate

From the repository root:

```bash
node scripts/validate/validate.mjs            # all content: frontmatter, headings, references, links, secrets
node scripts/validate/validate.mjs --verbose  # also print warnings
node packages/cli/bin/ship-anything.js validate --content   # same checks through the CLI
```

The validator checks, among other things, that `name` matches the folder, the headings are
present and in order, every agent in `metadata.agents` exists, relative Markdown links resolve,
and no secret-looking strings are present.

## 6. Regenerate the registry

`skills.internal` in [`.ship-anything/registry.yaml`](../../.ship-anything/registry.yaml) is generated. Do not edit it by hand.

```bash
node scripts/generate/registry.mjs           # rewrite skills.internal from skills/*/SKILL.md and workflows/*.md
node scripts/generate/registry.mjs --check   # exit 1 if registry.yaml is stale (use in CI)
```

The generator records category, version, agents, the workflows that require the skill, license,
and whether `scripts/` or `references/` exist. It preserves comments and the hand-curated
`skills.external` section.

If an agent should rely on the skill, also add it to that agent's `required_skills` or
`optional_skills` and its `## Required skills` / `## Optional skills` sections, and update the
[catalog](../architecture/catalog.md).

## 7. Try it in a real project

```bash
ship-anything init --agent claude --cwd /tmp/skill-trial   # or your tool
cd /tmp/skill-trial && claude                                # ask for work that should trigger the skill
```

Check that the skill activates when it should, stays out when it should not, and that the
procedure's commands actually run. Then run the CLI test suite if you touched anything under
`packages/cli` (`npm test` at the repository root).

## 8. Submit

Follow the [skill contribution process](../community/contribution-roadmap.md#3-skill-contribution-process):
proposal issue, PR with validator and registry check passing, a short excerpt of a real session,
and license notes for any adapted material.
