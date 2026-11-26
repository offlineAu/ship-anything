---
name: legacy-modernization
description: >-
  Modernises legacy systems incrementally with the strangler-fig pattern: baseline and
  behavioural (characterization) tests first, a routing facade, slice-by-slice migration
  with parallel-run comparison, reversible cutover and old-path retirement. Rust rewrites
  only for measured bottlenecks.
level: [L3, L4]
required_agents: [architecture-agent, qa-agent]
optional_agents: [backend-agent, frontend-agent, database-agent, infrastructure-agent, performance-agent, security-agent]
required_skills: [existing-project-audit, architecture-planning, regression-prevention, testing-and-qa]
composes: [reverse-engineer, security-remediation, production-release]
---

# Legacy modernization

## Purpose

Move a working system to a better stack or structure **without a big-bang rewrite**: the
old system keeps serving while new slices take over one at a time behind a facade, each
proven behaviour-equivalent before cutover and reversible after it.

## When to use

- Framework/runtime/language migrations, monolith decomposition, unsupported dependencies,
  replacing a legacy database access layer, moving hot paths to Rust when measured.

Do not use when: the change fits within the current stack (→ `improve-existing-project`);
the system is not understood (compose `reverse-engineer` first); the system is small
enough that a rewrite plus full test suite is lower risk (record that ADR explicitly).

## Inputs

- Repo, runtime environment access (test/staging), current deploy process.
- Reason for modernising (support end, performance, hiring, cost) → becomes success metrics.
- Existing metrics/logs if available (error rates, latencies) — measured, never estimated.

## Agents

- `architecture-agent` (required): target architecture, slice plan, facade, ADRs.
- `qa-agent` (required): characterization and parity tests; independent verification per slice.
- Implementers per slice only: `backend-agent`, `frontend-agent`, `database-agent`.
- `infrastructure-agent` (facade/routing, parallel environments), `performance-agent`
  (baselines; gatekeeper for Rust), `security-agent` (auth/data paths) — optional.

## Skills and tools

`existing-project-audit`, `architecture-planning`, `regression-prevention`, `testing-and-qa`;
optional `rust-modernization` (performance-agent/backend-agent, only after a measured
bottleneck), `database-engineering`, `performance-optimization`, `codebase-intelligence`.
Tools: project test runners, benchmark harness (`hyperfine`, language bench tools, k6),
profilers/flame graphs, feature flags or routing rules for cutover.

## Task graph

```
id     agent                 objective                                  depends_on     wave  owns
LM-01  orchestrator          BASELINE: build/test results, perf         -              1     .ship-anything/state/baseline.md
                             benchmarks, error rates (measured)
LM-02  architecture-agent    audit + target architecture, slice order   LM-01          2     docs/architecture.md, docs/adr/**
                             (low risk/high value first), facade design
LM-03  qa-agent              characterization tests for slice 1..k      LM-01          2     tests/characterization/**
                             behaviours (golden inputs/outputs)
LM-04  infrastructure-agent  facade/router in front of legacy, no        LM-02          3     infra/**, facade config
                             behaviour change; flags per slice
LM-05  implementer           slice N: new implementation behind facade  LM-03, LM-04   4     new-stack dir for slice N
LM-06  qa-agent              parity: characterization suite against     LM-05          5     tests/parity/**
                             new slice; shadow/parallel-run diff
LM-07  orchestrator          cutover slice N via flag (staging, then    LM-06          6     flag config
                             prod with authorization); monitor
LM-08  implementer           retire legacy path for slice N after       LM-07 + soak   7     legacy dir for slice N
                             soak period agreed in LM-02
       ... repeat LM-03(slice) → LM-08 per slice ...
LM-R1  performance-agent     Rust candidate: profile proves hotspot,    LM-01          any   perf/**
                             in-stack fixes tried, benchmark target set
LM-R2  backend-agent         Rust module + FFI/service boundary tests   LM-R1          next  crates/** (or native module dir)
LM-R3  performance-agent     before/after with identical harness        LM-R2          next  perf/**
```

Data migrations use expand → migrate → contract: add new structures, dual-write/backfill,
switch reads, then drop old structures (destructive → separate authorization, verified backup).

## Parallel opportunities

- LM-02 ∥ LM-03 after baseline (docs vs tests).
- Different slices in parallel only when they share no code, tables or facade routes;
  otherwise strictly sequential.
- LM-R1 profiling can run beside slice work (read-only, owns `perf/**`).

## Sequential requirements

- Baseline + characterization tests before any modification of a slice.
- Facade in place (no behaviour change, verified) before the first slice cutover.
- Parity verified before cutover; soak before retirement; one slice cut over at a time.
- Rust work only after LM-R1 shows a measured bottleneck and in-stack options were tried.
- Production cutovers and destructive data steps need explicit authorization each time.

## Acceptance criteria

- Characterization suite passes on legacy and on each new slice (same inputs, same outputs,
  or documented intended differences approved by the user).
- Cutover of each slice is reversible by flag within the documented rollback procedure.
- Post-cutover error rate and latency for the slice are no worse than baseline (measured).
- Retired legacy code removed with no remaining references (`rg` check recorded).

## Quality gates

- Baseline command set green (or pre-existing failures unchanged) after every slice.
- Parity diff: 0 unexplained differences in shadow/parallel-run output.
- Rust gate: benchmark shows improvement on the same harness/inputs/machine; FFI boundary
  tests pass; memory safety lints (`cargo clippy`) clean; no `unsafe` without justification.
- Security review for slices touching auth/data; 0 open high/critical findings.

## Deliverables

Target architecture + ADRs, baseline, characterization and parity suites, facade/flags,
migrated slices, rollback runbook per slice, migration log in decisions.md.

## Completion conditions

Per slice: VERIFIED (parity) → DEPLOYED (authorized cutover with health evidence) →
SHIPPED after soak and legacy retirement. The modernization is complete when all planned
slices are SHIPPED or DESCOPED with user agreement; partial completion is reported per slice.

## Failure recovery

| Failure | Recovery |
|---|---|
| Parity mismatch | Do not cut over; classify (legacy bug vs new bug); user decides whether to preserve legacy bug |
| Post-cutover regression | Flip flag back (rollback), slice to IN_PROGRESS, add failing case to characterization suite |
| Slice boundary leaks (shared state) | Re-slice in LM-02; add anti-corruption layer |
| Data backfill inconsistent | Pause contract phase; reconcile with checksums/counts; re-run backfill idempotently |
| Rust gain below target | Keep or revert based on measured value vs maintenance cost; record ADR |
| Team cannot run legacy locally | Containerise legacy for tests (infrastructure-agent) before slicing |
