---
name: existing-project-audit
description: >-
  Assesses an existing codebase before changing it: builds and runs it, inventories stack
  and dependencies, measures test coverage and health, flags security, performance,
  accessibility and maintainability risks, and produces a prioritised, evidence-backed
  findings list. Use when asked to improve, modernise, take over, rescue, extend or review
  an existing project, or before planning major work in an unfamiliar repository.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [orchestrator, architecture-agent]
---

# Existing project audit

## Purpose

Know the true state of a project — what builds, what is tested, what is risky — before
promising changes. Findings are tied to evidence and prioritised by impact on the user's goal.

## When to use

- "Improve / modernise / fix up / take over / finish" requests on an existing repo.
- Before an L3/L4 plan in a brownfield codebase.
- Before `rust-modernization` or major refactors, to establish a baseline.

Do not use when:
- The task is a targeted bug fix in a known area — use `codebase-intelligence`.
- The repo is new or empty.
- A recent audit exists and `git log` shows little change since.

## Inputs

- Repo; `.ship-anything/state/repo-map.md` (run `repository-mapping` first if missing).
- The user's goal (what the audit should prioritise).

## Procedure

1. **Map** the repo (`repository-mapping`).
2. **Build from clean**: install from the lockfile (`npm ci`, `pnpm install --frozen-lockfile`,
   `pip install -r requirements.txt` in a venv, `cargo build`, `go build ./...`). Record
   exact commands, exit codes, and errors. Do not "fix" yet.
3. **Run checks**: tests, typecheck, lint, format check. Record pass/fail counts and
   durations; coverage if configured (`--coverage`), never estimated.
4. **Run the app** locally if feasible; smoke the primary journey; note what fails.
5. **Dependencies**: outdated (`npm outdated`, `pip list --outdated`, `cargo outdated` if
   installed), known vulnerabilities (`npm audit --omit=dev`, `pip-audit`, `cargo audit`,
   `govulncheck ./...`), unmaintained or deprecated packages, license concerns.
6. **Security quick scan**: committed secrets
   (`git log -p | grep -n -E "sk_live_|ghp_|AKIA|BEGIN [A-Z ]*PRIVATE KEY" | head`, or
   `gitleaks detect` if installed), authz checks on routes, input validation, unsafe
   eval/SQL string building. Secrets found → stop and follow `.ship-anything/policies/secrets.md`.
7. **Architecture health**: module boundaries, cycles, god files (largest files, churn
   hotspots), dead code, duplicated logic, configuration sprawl.
8. **Quality attributes** relevant to the goal: performance (measure, e.g. Lighthouse or
   endpoint timings, if runnable), accessibility (axe/Lighthouse on key pages), error
   handling, logging/observability, docs and onboarding.
9. **Prioritise** findings: severity (critical/high/medium/low) × effort (S/M/L), and
   relation to the user's goal. Critical = data loss, security exposure, broken build.
10. **Report** `docs/audit/<date>-audit.md`: summary, environment, commands run with
    results, findings table (id, area, evidence path:line or command output, severity,
    effort, recommendation), quick wins, recommended plan, items not checked and why.

## Decision rules

| Finding | Action |
|---|---|
| Build broken from clean | Top priority; fix before any feature work |
| No tests on area to change | Add characterisation tests before refactoring |
| Committed secret | Stop; tell user; recommend rotation; no history rewrite without authorization |
| Outdated major versions | Recommend upgrade only if it serves the goal or fixes a risk |
| "Rewrite everything" temptation | Reject unless evidence shows incremental change cannot meet the goal |
| Check could not run | List under "not checked" with reason; never imply it passed |

## Tools

- Ecosystem package managers and their audit commands; `gitleaks`, `semgrep`, `axe`,
  Lighthouse where installed.
- Optional upstream: `understand-anything` and `repomix` (see .ship-anything/registry.yaml)
  for large unfamiliar repos; opt-in only.

## Quality standards

- Every finding has reproducible evidence (path:line, command + output excerpt).
- Commands listed were actually run; results are real; unrun checks are listed as such.
- Prioritisation references the user's goal.
- Audit itself changes no code (read-only, except local installs from lockfile).

## Common failures

- Fixing things mid-audit and losing the baseline.
- Listing 200 lint warnings as findings instead of patterns.
- Recommending a framework migration because it is newer.
- Claiming coverage or performance numbers that were not measured.

## Outputs

- `docs/audit/<date>-audit.md` with findings table and recommended plan.
- Baseline results recorded in `.ship-anything/state/decisions.md` for later comparison.

## Done when

- Clean build/test results are recorded, findings are evidence-backed and prioritised
  against the user's goal, and unchecked areas are explicitly listed.
