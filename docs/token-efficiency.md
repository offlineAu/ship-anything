# Token efficiency

Token efficiency is a core architectural requirement. It must never cost correctness, security or quality.
This document covers what is implemented, what has been measured, and what hasn't.

## Mechanisms

| Mechanism | Where | Effect |
|---|---|---|
| Progressive disclosure | Agent Skills format; agents list skills by name; native skill loaders read only `name`/`description` until a skill is selected | The full skill body enters context only when it's used |
| Level-based activation | `parallel-agent-coordination` rubric (L1–L4) | Small requests don't load the product, UX, QA or release machinery |
| Compact handoffs | `.ship-anything/templates/task-contract.yaml`, `agent-report.md` | Subagents receive a contract plus links, never the conversation transcript |
| Continuation summaries | `templates/continuation-summary.md`, `context-management` skill | A fresh context resumes from one file instead of re-investigating |
| Persistent structured state | `.ship-anything/state/` (`plan.yaml`, `decisions.md`, `repo-map.md`, `tasks/`) | Avoids repeated discovery across sessions and agents |
| Repository maps | `repository-mapping` and `codebase-intelligence` skills, Repomix (registered) | One cached map instead of every agent re-walking the tree |
| Terminal output discipline | `terminal-output-optimization` skill; RTK optional and user-installed | Concise command output that never hides errors |
| Ownership registry | `plan.yaml` `owns:` globs | No duplicated investigations or conflicting edits |

## Measured: static instruction volume

`node scripts/benchmark/context-budget.mjs` measures how much SHIP ANYTHING text an agent has to load. It
compares a naive baseline (every agent, skill and workflow in context) with startup (instruction block plus
skill metadata) and a typical task (orchestrator, one specialist, its required skills and one workflow).
Tokens are **estimated as bytes/4**, not counted with a model tokenizer.

Measured with `node scripts/benchmark/context-budget.mjs` on 2026-11-26 (22 agents, 57 skills, 15 workflows).
This is a static measure of instruction volume, with tokens **estimated** as bytes/4:

| Scenario | Est. tokens | % of load-everything baseline |
|---|---|---|
| Baseline: every agent + skill + workflow in context | 160,036 | 100% |
| Startup: instruction block + skill names/descriptions | 6,786 | 4.2% |
| Typical task: frontend-agent + web-app workflow + required skills | 17,643 | 11.0% |
| Typical task: backend-agent + fullstack-platform | 18,848 | 11.8% |
| Typical task: video-agent + video-production | 15,379 | 9.6% |

Raw output: `reports/context-budget.json`.

This measures *instruction volume only*. It says nothing about the tokens a model actually spends on tool
output, code reading or reasoning.

## Not yet measured: real model usage

Planned method, defined in `skills/token-optimization/SKILL.md`:

1. Choose 3 representative tasks (L1 bug fix, L2 feature, L3 multi-subsystem feature) on a fixed repo commit.
2. Run each at least 3 times with SHIP ANYTHING installed and 3 times with a plain agent (baseline), on the same model.
3. Record host-reported usage: Claude Code session usage or `/cost`, `opencode stats`, Codex's `tokens used` line.
   Also record input/output tokens, tool-output volume, number of context reloads or compactions, and wall-clock time.
4. Record whether the outcome passed its acceptance criteria. A cheaper run that fails doesn't count as a saving.
5. Publish raw numbers, variance and the exact prompts.

Until that's done, the project makes **no claims** about model-token savings. Upstream tools (RTK,
context-mode, Headroom, claude-mem) publish their own savings figures. Those are their claims and we haven't
verified them (see [research/token-optimization.md](research/token-optimization.md)).

## Rules that protect quality

- Never filter out errors, warnings, failing test names or stack traces.
- Never skip a verification step to save tokens.
- Prefer loading one extra skill over guessing.
