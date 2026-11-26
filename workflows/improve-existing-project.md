---
name: improve-existing-project
description: >-
  Adds features, fixes defects, polishes UX or refactors inside an existing codebase:
  repo map, recorded baseline, prioritised audit, characterization tests around touched
  areas, minimal-diff changes by the owning specialists, and regression verification
  against the baseline.
level: [L1, L2, L3]
required_agents: [orchestrator, qa-agent]
optional_agents: [architecture-agent, frontend-agent, backend-agent, database-agent, ux-agent, performance-agent, security-agent, documentation-agent]
required_skills: [existing-project-audit, codebase-intelligence, repository-mapping, regression-prevention, testing-and-qa]
composes: [security-remediation, legacy-modernization, production-release]
---

# Improve existing project

## Purpose

Make the requested improvements without breaking what works. The baseline (what builds,
what passes, what fails today) is the reference; every change is judged against it and
follows the project's existing conventions instead of introducing new ones.

## When to use

- Feature additions, bug fixes, UX polish, refactors, test coverage, docs in an existing repo.
- "Review and improve this project" (audit first, then the agreed subset).

Do not use when: the stack itself must change (→ `legacy-modernization`); security findings
are the primary work (→ `security-remediation`); the system is not understood at all
(→ `reverse-engineer` first).

## Inputs

- The repo (git status clean or changes noted), README, manifests, CI config.
- User request: explicit changes, or "improve" (audit-driven).
- `.ship-anything/state/repo-map.md` if cached.

## Agents

- `orchestrator` (required): repo map, baseline, audit triage, integration.
- `qa-agent` (required): characterization tests and independent regression verification.
- Specialists only for the areas actually changed (frontend, backend, database, ux,
  performance, security, documentation, architecture for cross-cutting refactors).

## Skills and tools

`existing-project-audit`, `codebase-intelligence`, `repository-mapping`,
`regression-prevention`, `testing-and-qa`; optional `code-review`, `frontend-polish`,
`performance-optimization`. Tools: the project's own scripts (`npm test`, `pytest`,
`cargo test`, `go test ./...`), `git diff --stat`, linters as configured in the repo.

## Task graph

```
id     agent              objective                                    depends_on     wave  owns
IM-01  orchestrator       repo map: stack, entry points, conventions,  -              1     .ship-anything/state/repo-map.md
                          test layout, CI
IM-02  orchestrator       BASELINE: clean install, build, lint, tests  IM-01          1     .ship-anything/state/baseline.md
                          — record exact commands, pass/fail counts,
                          pre-existing failures
IM-03  orchestrator       audit (request-driven or full): findings     IM-02          2     docs/audit-<date>.md
                          ranked by impact × effort × risk
IM-04  orchestrator       agree change list: request items + audit     IM-03          2     .ship-anything/state/plan.yaml
                          items in scope; rest recorded as backlog
IM-05  qa-agent           characterization tests for every area to     IM-04          3     tests/** (new files only)
                          be changed that lacks coverage
IM-06+ specialist(s)      one task per change; minimal diff; unit      IM-05          4..n  per change (disjoint)
                          tests; follow existing patterns
IM-n1  orchestrator       integration: full baseline command set       IM-06+         n+1   root manifests, lockfiles
IM-n2  qa-agent           regression vs baseline + acceptance per      IM-n1          n+2   tests/**
                          change
IM-n3  security-agent     review if changes touch auth/PII/payments/   IM-n1          n+2   docs/security/**
                          uploads (optional)
IM-n4  (production-release) when deploy in scope                       IM-n2, IM-n3   n+3   see production-release
```

L1 variant: a single small fix → IM-01 (light), IM-02, the fix with a regression test,
fresh re-run of the baseline commands; no plan file required.

## Parallel opportunities

- Change tasks (IM-06+) in the same wave only when their `owns` are disjoint and none edits
  shared files (manifests, route index, shared utils) — shared edits go to the orchestrator
  at integration.
- IM-n2 ∥ IM-n3 (tests vs security notes).

## Sequential requirements

- Baseline before any change; pre-existing failures recorded so they are not blamed on the change.
- Characterization tests before modifying untested behaviour.
- Integration + full regression before QA sign-off; security review before release when risk
  flags apply; deploy only through production-release with authorization.

## Acceptance criteria

- Each requested change meets its acceptance criteria, verified by qa-agent.
- Every baseline-passing test still passes; no new lint/type errors vs baseline counts.
- Bug fixes include a test that failed before the fix and passes after.
- Diffs follow existing conventions (naming, structure, libraries); no unrequested rewrites,
  dependency swaps or formatting churn.

## Quality gates

- Baseline command set re-run at integration: results ≥ baseline (same or more passing,
  pre-existing failures unchanged or fixed — never new failures).
- `git diff --name-only` ⊆ union of task `owns` + orchestrator-owned shared files.
- qa-agent acceptance checklist signed; security-agent 0 open high/critical when it ran.
- New dependencies only with an ADR entry in decisions.md.

## Deliverables

Code changes, new tests, `baseline.md`, audit report (if audit ran), backlog of out-of-scope
findings, updated README/CHANGELOG entries where behaviour changed.

## Completion conditions

Every in-scope change VERIFIED; out-of-scope findings recorded as backlog (not DESCOPED
silently). DEPLOYED only via production-release; otherwise N/A and stated in handoff.

## Failure recovery

| Failure | Recovery |
|---|---|
| Baseline does not build | Record it; fix only if required for the request (separate task, user informed); else work around and state it |
| Change breaks a baseline test | Task back to IN_PROGRESS; fix or revert; never edit the test to pass without proving the old behaviour was wrong |
| Hidden coupling discovered | Pause the task, extend characterization tests, re-plan ownership |
| Conventions conflict (two styles in repo) | Follow the style of the module being changed; record in decisions.md |
| Audit reveals critical security issue | Compose `security-remediation`; prioritise before feature work; inform user |
| Scope creep ("while we're here") | Record as backlog; do not implement without being in the agreed change list |
