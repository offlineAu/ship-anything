---
name: spec-driven-development
description: >-
  Runs a feature or product through specification before code: a short project constitution
  of non-negotiable principles, then spec → plan → tasks → implement → converge, with a
  gate between each phase. Maps every phase onto SHIP ANYTHING files (product brief,
  architecture doc and ADRs, plan.yaml, task contracts) so no extra tooling is needed. Use
  for new products or multi-task features where requirements, design and work split must
  stay consistent; not for one-file fixes.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [product-director, architecture-agent, orchestrator]
---

# Spec-driven development

## Purpose

Make the specification the source of truth that the plan, the tasks and the code are
checked against. Each phase produces a file the next phase reads, and each hand-over passes
a gate, so drift between "what we meant", "what we designed" and "what we built" shows up
before QA rather than after.

## When to use

- A new product, or a feature that needs more than one task contract or agent.
- Work where several agents run in parallel and need one shared definition of done.
- Projects with standing rules (regulated data, accessibility level, stack limits) that
  every feature must respect.
- An existing project whose features keep missing requirements in QA.

Do not use when:
- The change is L1 (one file, self-evident check): do it directly.
- The question is still *what product to build*: run `product-discovery` first; its brief
  is this skill's starting spec.
- Only acceptance criteria are missing: `requirements-analysis` alone is enough.

## Inputs

- The user request, verbatim; any existing `docs/product-brief.md`, `docs/architecture.md`,
  `docs/adr/**` and `.ship-anything/state/plan.yaml`.
- Standing constraints: policies in `.ship-anything/policies/`, user-stated rules,
  compliance needs.

## Procedure

1. **Constitution (once per project).** Write `docs/constitution.md`: 3–7 principles, each
   a MUST or MUST NOT with a one-line reason and how it is checked (e.g. "MUST meet WCAG
   2.2 AA — axe scan in CI"). Add a version and date. Changing a principle needs an ADR
   (`.ship-anything/templates/architecture-decision.md`) and a version bump. Keep it short;
   preferences that are not enforceable do not belong here.
2. **Specify.** Fill `docs/product-brief.md` from `.ship-anything/templates/product-brief.md`:
   users, problem, MVP versus enhancements, prioritised journeys (each independently
   testable), acceptance criteria. Describe *what* and *why*; leave stack choices out.
   Run `requirements-analysis` for FR/NFR/AC numbering. Mark every gap inline as
   `NEEDS CLARIFICATION: <question>` instead of guessing.
3. **Gate: spec ready.** Each journey has acceptance criteria with a verification method;
   each open marker is resolved by a batched question to the user, or turned into an
   `ASSUMPTION:` recorded in `.ship-anything/state/decisions.md`. Blocking questions stay
   under "Open questions (blocking only)". No principle in the constitution is contradicted.
4. **Plan.** `architecture-agent` writes `docs/architecture.md` (stack, modules, data model,
   API contracts) with `architecture-planning`, plus one ADR per significant choice.
5. **Gate: constitution check.** Before and after design, list each principle with
   pass / violation. A violation stays only with an ADR stating why it is needed and which
   simpler option was rejected.
6. **Tasks.** The orchestrator writes `.ship-anything/state/plan.yaml` (waves, owners,
   dependencies) and one task contract per task from `.ship-anything/templates/task-contract.yaml`.
   Group tasks by journey so each journey can ship on its own; put tasks in the same wave
   only when their `owns` globs do not overlap. Copy the relevant AC IDs into each contract.
7. **Gate: consistency analysis** (read-only, before any code). Check that every AC maps to
   at least one task, every task maps to an AC or a principle, terms mean the same thing in
   brief, architecture and contracts, and no task contradicts an ADR. Fix the documents, not
   the code, then re-run the check.
8. **Implement.** Specialists execute contracts wave by wave; QA verifies each task
   independently per `testing-and-qa` and `.ship-anything/policies/status-model.md`.
9. **Converge.** Compare the codebase with the brief, architecture and contracts. Grade each
   gap (constitution violation or missing journey first), add a task contract per gap to
   `plan.yaml`, and repeat implement → converge until no gap remains.
10. **Keep the spec alive.** When behaviour changes later, change the brief (and ADRs) in
    the same task as the code; a spec that lags the code is a defect.

## Decision rules

| Situation | Action |
|---|---|
| No constitution and a one-off prototype | Skip step 1; record "no constitution" in `decisions.md` |
| Spec mentions frameworks or libraries | Move them to the plan phase as ADR candidates |
| More open questions than the user will answer at once | Ask only the blocking ones; default the rest as assumptions |
| Plan violates a principle | ADR with justification, or change the plan; never silently |
| Consistency check finds an AC with no task | Add a task before implementation starts |
| Converge finds work outside the spec | Do not build it; record as an enhancement in the brief |
| User asks for the upstream `specify` CLI | Optional; see Tools. Do not run both processes in one project |

## Tools

- SHIP ANYTHING templates: `product-brief.md`, `architecture-decision.md`, `plan.yaml`,
  `task-contract.yaml` in `.ship-anything/templates/`.
- Search for leftover markers: `rg -n "NEEDS CLARIFICATION" docs/`.
- Trace check: `rg -n "AC-[0-9]+" docs/product-brief.md .ship-anything/state/` to compare
  AC IDs in the brief with those in contracts.
- Optional, not required: GitHub's Spec Kit (`specify` CLI, installed with
  `uv tool install specify-cli`; slash commands `/speckit-constitution`, `/speckit-specify`,
  `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-converge`). It writes its
  own commands and templates into agent folders and competes with our orchestrator; its
  registry entry is `spec-kit` (REFERENCE). Use one process per project.
- Attribution: phase structure, constitution idea and cross-artifact checks informed by
  github/spec-kit (MIT), read at release v1.4.5 (tag commit 6ba8bee). Text is our own.

## Quality standards

- The constitution is short, each principle is checkable, and amendments have ADRs.
- No `NEEDS CLARIFICATION` marker survives into the tasks phase.
- Every AC traces to a task and every task to an AC or principle.
- Each gate's result is written down (in `decisions.md` or the plan), not just passed.
- The brief describes behaviour; the architecture describes how; contracts describe who.

## Common failures

- A constitution full of preferences ("clean code") that no gate can check.
- Specs that are plans in disguise (database tables, framework names in the brief).
- Skipping the consistency check because "the tasks look right".
- Treating the spec as frozen while the code moves on, then QA testing against stale ACs.
- Running Spec Kit's slash commands and SHIP ANYTHING's orchestrator in the same project.

## Outputs

- `docs/constitution.md` (versioned), `docs/product-brief.md`, `docs/architecture.md`, ADRs.
- `.ship-anything/state/plan.yaml` and task contracts with AC IDs.
- Gate results and assumptions in `.ship-anything/state/decisions.md`.

## Done when

- Every gate has a recorded pass, every MVP task is VERIFIED, and a final converge pass
  finds no gap between the brief, the architecture and the code.
