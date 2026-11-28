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
| Install profiles | `init --profile web\|mobile\|desktop\|creative\|reverse` | Only the agents and skills a kind of project needs are preloaded; the rest wait in `.ship-anything/skills/` and are read by path on demand |
| Per-task skill cap | instruction block, task contracts | Each contract lists at most 3 skills; specialists never browse the catalog |
| CLI over MCP | instruction block, `playwright-cli-testing`, `chrome-devtools-debugging` | MCP servers add tool schemas to every turn, so they're enabled only for the task that needs them |
| Ownership registry | `plan.yaml` `owns:` globs | No duplicated investigations or conflicting edits |

## Measured: static instruction volume

`node scripts/benchmark/context-budget.mjs` measures how much SHIP ANYTHING text an agent has to load. It
compares a naive baseline (every agent, skill and workflow in context) with startup (instruction block plus
skill metadata) and a typical task (orchestrator, one specialist, its required skills and one workflow).
Tokens are **estimated as bytes/4**, not counted with a model tokenizer.

Measured with `node scripts/benchmark/context-budget.mjs` on 2026-11-28 (22 agents, 63 skills, 15 workflows).
This is a static measure of instruction volume, with tokens **estimated** as bytes/4:

| Scenario | Est. tokens | % of load-everything baseline |
|---|---|---|
| Baseline: every agent + skill + workflow in context | 173,434 | 100% |
| Startup: instruction block + skill names/descriptions | 7,894 | 4.6% |
| Typical task: frontend-agent + web-app workflow + required skills | 18,781 | 10.8% |
| Typical task: backend-agent + fullstack-platform | 19,974 | 11.5% |
| Typical task: video-agent + video-production | 16,494 | 9.5% |

Startup by install profile (`init --profile`), counting skill **and** agent metadata the host preloads:

| Profile | Native skills | Native agents | Est. startup tokens |
|---|---|---|---|
| full (default) | 63 | 22 | 9,643 |
| web | 42 | 18 | 6,953 (−28%) |
| mobile | 39 | 17 | 6,571 (−32%) |
| desktop | 39 | 17 | 6,560 (−32%) |
| creative | 46 | 20 | 7,531 (−22%) |
| reverse | 39 | 16 | 6,498 (−33%) |

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
