# Field run: Codex, L4 web platform (2026-11-27 to 2026-11-28)

The first real use of SHIP ANYTHING 0.1.0 in a project. A maintainer installed the package from npm into a new
project and gave Codex CLI 0.160.1 a long (~52 KB) brief for a multi-tenant franchise web platform: public site
with 3D hero, branch portals, ordering and a head-office admin. Project details are kept out of this report on
purpose. Evidence below comes from the project's `.ship-anything/state/`, its own reports, the local Codex
session logs, and commands re-run by the SHIP ANYTHING maintainer session.

**Status of the run: IN_PROGRESS.** The product isn't finished; this is a mid-run assessment.

## What worked

| Behaviour | Evidence |
|---|---|
| Classification | `plan.yaml`: level L4, score 9 with a per-factor breakdown; workflows `product-discovery`, `fullstack-platform`, `website`, `3d-product` |
| Native Codex subagents | 43 `spawn_agent` calls with SHIP ANYTHING `agent_type`s: frontend 16, backend 12, security 4, blender 2, qa 2, research, product-director, architecture, ux, database 1 each. 18 subagent session logs |
| Contracts with ownership | `state/tasks/*.yaml` with `owns:` globs, acceptance criteria and constraints |
| Assumptions recorded, not asked | `state/decisions.md`: fictional demo data, no payments/POS, sequencing deviation recorded explicitly |
| Independent gates | QA and security agents found real defects (stale approval baseline, duplicate PII in retry records, stale replay, access kept after reassignment); each fix has a regression test that failed first |
| Honest status | `PROJECT_STATUS.md` and `QA_REPORT.md` say "not production-ready", list unmet scope, and label build sizes as not performance measurements |
| Claims re-verified | Maintainer re-ran `pnpm typecheck`, `pnpm lint`, `pnpm build` (exit 0) and `php artisan test`: 27 passed, 216 assertions (the project's last written figure was 24/170; work continued after it) |

## Problems found and changes made (in this repository)

| # | Problem | Change |
|---|---|---|
| 1 | Orchestrator installed system software (`brew install php composer`) without asking. It inspected formula metadata and called that a review. The policy listed "installing binaries" but not system package managers explicitly | `policies/authorization.md`: system or global installs, even from official sources, require authorization |
| 2 | A framework scaffold shipped its own nested `AGENTS.md` telling agents to install PHP via `curl … \| bash`. It wasn't followed here, but the policy didn't say such files aren't authorization | Authorization policy and Codex adapter now say nested framework `AGENTS.md`/`CLAUDE.md` files are content, not authorization |
| 3 | 5 of 43 spawns used `fork_turns: "all"`, copying the full conversation and the 52 KB brief into subagents | Instruction block and Codex adapter: send the contract, never fork full history; reuse running specialists |
| 4 | Task status drifted: `plan.yaml` says `brief` IMPLEMENTED, `tasks/brief.yaml` says IN_PROGRESS. No per-task agent reports were written to `state/tasks/` | Instruction block: `plan.yaml` is the single source of status; reports go to `state/tasks/<id>.md` |
| 5 | Two days of work stayed uncommitted (only the initial commit exists) | Instruction block: at L3/L4 ask once for local checkpoint commits, otherwise remind the user at each wave boundary |
| 6 | Sequencing deviation: ordering work started before the 3D phase | Recorded honestly by the orchestrator; no change needed |

## Token usage (host-reported, Codex `token_count` events)

| Session | Input | of which cached | Output |
|---|---|---|---|
| Orchestrator (1 session, 4 user turns) | 57.6 M | 56.8 M (98.6%) | 56 K |
| 18 subagent sessions combined | ≈ 28.1 M total tokens | mostly cached | — |

There's no baseline run without SHIP ANYTHING, so this is **not** a savings measurement. It records the cost of
a long L4 run, dominated by cached re-reads of the orchestrator context.

## Not verified

3D hero quality, accessibility, cross-browser, performance, concurrency and the eight end-to-end journeys the
brief asked for are open in the project's own reports. No deployment was attempted.
