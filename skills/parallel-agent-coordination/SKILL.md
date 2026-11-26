---
name: parallel-agent-coordination
description: >-
  Scores request complexity L1–L4 from deliverables, contracted subsystems, risk flags,
  platforms and creative production (never prompt length), then plans dependency-ordered
  waves with non-overlapping file ownership, bounded concurrency and integration
  checkpoints. Use when planning multi-agent work, delegating to subagents, deciding what
  can run in parallel, or running the same plan sequentially when the host has no subagents.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator]
---

# Parallel agent coordination

## Purpose

Decide how much orchestration a request deserves, then run the fewest agents that can do
it, in parallel only where it saves wall-clock time without merge conflicts. This file is
the canonical complexity rubric referenced by `agents/orchestrator.md` and
`docs/architecture/overview.md`.

## When to use

- Classifying every incoming request (step CLASSIFY of the orchestrator procedure).
- Building or revising `.ship-anything/state/plan.yaml` waves and task ownership.
- Deciding whether to delegate, how many agents to run at once, and when to integrate.

Do not use when:
- The request is already classified L1 and the work is a handful of edits in one area — act directly.
- Answering a question that produces no deliverable (explanations, reviews of a single file).
- Splitting work inside one specialist's task; the specialist sequences its own steps.

## Inputs

- The user request (verbatim) and any product brief (`docs/product-brief.md`).
- Repo facts: map (`.ship-anything/state/repo-map.md`), manifests, git status.
- Host capability: does the adapter provide a delegation primitive (`.ship-anything/adapters/`)?
- `config.parallelism.max_agents` from `.ship-anything/config.yaml` if present (default 4).

## Procedure

1. **Score complexity** with the rubric below. Prompt length, politeness or adjectives
   ("enterprise-grade", "simple") never change the score; only the facts do.

   | Dimension | 0 | 1 | 2 |
   |---|---|---|---|
   | Deliverables (web UI, API, mobile app, desktop app, CLI, 3D scene, video, docs site, infra) | 1 | 2 | 3+ |
   | Subsystems joined by a contract (UI↔API, API↔DB schema, service↔provider webhook, app↔native module) | 0–1 | 2 | 3+ |
   | Platforms targeted (web, iOS, Android, desktop OS family, server runtime) | 1 | 2 | 3+ |
   | Creative production (3D assets, video, motion system, sound) | none | 1 kind | 2+ kinds |

   Risk flags add **+1 each**: authentication/authorization, payments, PII or regulated
   data, schema/data migrations on existing data, production deployment or infra changes.

2. **Map score to level**, then apply floors:

   | Total | Level | Topology |
   |---|---|---|
   | 0 | L1 Simple | orchestrator acts directly with one skill, self-verifies freshly |
   | 1–3 | L2 Standard | sequential or 2-way parallel, ≤ 3 specialists |
   | 4–6 | L3 Complex | architecture + frozen contracts first, parallel build, independent QA + security |
   | 7+ | L4 Full product | L3 + product brief, UX direction, creative pipeline, release agent, staged delivery |

   Floors: any risk flag → at least L2. Auth or payments or migrations combined with ≥ 2
   contracted subsystems → at least L3. Multi-platform **and** creative production **and**
   release in scope → L4. Record score, flags and level in `plan.yaml` (`level:`) and the
   reasoning in `.ship-anything/state/decisions.md`.

3. **Decompose** into tasks using `.ship-anything/templates/task-contract.yaml`: one
   objective, one agent, measurable `acceptance_criteria`, explicit `owns` / `reads_only`
   globs, `depends_on`. Contract-defining tasks (architecture, API schema, design direction)
   come first; implementation depends on them.
4. **Assign ownership** from `.ship-anything/policies/file-ownership.md`. Shared files
   (manifests, lockfiles, root configs, route/registry indexes, CI entrypoints) stay with
   the orchestrator and change only at checkpoints.
5. **Check ownership overlap** for every pair of tasks that could share a wave:
   - Static check: strip each glob to its literal prefix (text before the first `*`, `?`,
     `[` or `{`). If one prefix is a prefix of the other, treat as overlapping.
   - Concrete check on existing files:
     `comm -12 <(git ls-files ':(glob)src/app/orders/**' | sort) <(git ls-files ':(glob)src/app/**/*.tsx' | sort)`
     run per glob pair (bash/zsh) — any printed path is an overlap.
   - Overlap → split the glob, move the shared file to the orchestrator, or serialize.
6. **Build waves** by topological order: a wave contains tasks whose `depends_on` are all
   satisfied (VERIFIED, or IMPLEMENTED if the contract says so) and whose `owns` are
   pairwise disjoint. Cycle in `depends_on` → the decomposition is wrong; fix it.
7. **Bound concurrency**: run at most `max_agents` (default **4**) tasks at once; L2 runs
   at most 2. Above the cap, queue the remainder in the next wave. More agents raise merge
   and review cost faster than they save time.
8. **Delegate** each task with its contract only (no conversation history). Require an
   agent report per `.ship-anything/templates/agent-report.md`; reject reports without
   commands and real results.
9. **Integration checkpoint after every wave**: clean install from lockfile, typecheck/lint,
   unit + integration tests, app boots, primary journey smoke test. Record command summaries
   in `plan.yaml`. Fix glue, resolve conflicts, update statuses per
   `.ship-anything/policies/status-model.md`. Do not start the next wave on a red build.
10. **Single-session fallback** (host has no subagents, or delegation is disabled): execute
    the same waves sequentially. For each task announce the hat ("acting as backend-agent,
    T-004"), honour its `owns`, write its report, and run the checkpoint after each wave.
    Verification is a separate, fresh re-run of validation commands, recorded as
    "verified in single-session mode".

## Decision rules

| Situation | Action |
|---|---|
| Two tasks touch the same file | Serialize them or give the file to the orchestrator |
| Task needs another's output | Add `depends_on`; never a side-channel between agents |
| Task is < ~5 edits in an area the orchestrator already has loaded | Do it directly, no delegation |
| Contract (API/schema/design tokens) still changing | Do not start parallel consumers yet |
| Agent fails | Classify (spec gap / env / defect / blocked), amend contract, retry once, then escalate or descope |
| Score is borderline between levels | Pick the higher level only if a risk flag is present; else the lower |
| Verifier would be the implementer | Assign a different agent, or use single-session fresh re-run |

## Tools

- Host delegation primitive per adapter (Claude Code subagents, OpenCode subagents, Codex
  subagents where enabled); otherwise the single-session fallback.
- `git ls-files`, `git status --porcelain`, `git diff --name-only` for ownership checks
  and detecting out-of-scope edits after a wave.
- Optional upstream: `mco` (see .ship-anything/registry.yaml) for running several agents on
  the same question and comparing answers.
- Reference only: `pragmatic-orchestration` (task contract, deviation journal, parent
  verifies) and `metaswarm` (review gates, rubrics) — see .ship-anything/registry.yaml.

## Quality standards

- Every plan records level, score breakdown, risk flags and wave list.
- No two concurrent tasks own overlapping globs; verified by the check in step 5.
- After every wave, `git diff --name-only` is compared with the union of `owns`; edits
  outside ownership are reverted or reassigned before integration.
- Statuses advance only with evidence; "not run" is acceptable, invented output is not.

## Common failures

- Scoring by prompt length or tone instead of deliverables and risk.
- Starting UI and API in parallel before the API contract is frozen → rework.
- Two agents both editing `package.json` or a route index → lost changes.
- Running 8+ agents "for speed" and spending the gain on merge conflicts.
- Skipping the checkpoint because each agent reported green in isolation.
- Treating the implementer's own test run as VERIFIED.

## Outputs

- `.ship-anything/state/plan.yaml` with `level`, `waves`, tasks, owners, statuses.
- Task contracts and `.ship-anything/state/tasks/<id>.md` reports.
- Checkpoint records (commands + results) and level rationale in `decisions.md`.

## Done when

- Level and score breakdown are recorded with rationale.
- Every task has a contract with acceptance criteria and disjoint ownership within its wave.
- Each wave closed with a green integration checkpoint backed by real command output, or
  the failure is recorded as BLOCKED/FAILED with evidence.
