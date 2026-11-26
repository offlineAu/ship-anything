---
name: architecture-planning
description: >-
  Designs the technical shape of a product before parallel implementation: stack choice,
  module boundaries, data model outline, API and integration contracts, deployment target
  and key risks, recorded as ADRs and a frozen contract that specialists build against. Use
  for new products, new subsystems, cross-module features, platform or stack changes, and
  any L3/L4 plan where several agents must agree on interfaces.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [architecture-agent]
---

# Architecture planning

## Purpose

Decide the few structural choices that are expensive to change, write them down with
reasons, and freeze the contracts between parts so frontend, backend, data and integration
work can proceed in parallel without rework.

## When to use

- New product or service; new subsystem; feature spanning UI ↔ API ↔ DB.
- Choosing or changing framework, database, hosting, auth provider, queue, platform.
- Before wave 2 of any L3/L4 plan.

Do not use when:
- The change fits inside existing boundaries and patterns (follow them; no ADR needed).
- Evaluating an existing codebase's health — use `existing-project-audit` first.
- Detailed component or UI design — that belongs to the implementing specialists and ux-agent.

## Inputs

- `docs/product-brief.md` with acceptance criteria; NFRs from `requirements-analysis`.
- `.ship-anything/state/repo-map.md` for existing projects; current ADRs.
- Constraints: hosting preference, budget, team skills, compliance.

## Procedure

1. **List the drivers**: top NFRs (latency, offline, scale expectations the user gave,
   compliance), platforms, integrations, team/operational constraints.
2. **Prefer boring defaults**: the project's existing stack, then mainstream, well-documented
   options with active maintenance. Introduce new tech only when a driver requires it.
3. **Identify decisions** that are hard to reverse: language/runtime, framework, primary
   datastore, auth approach, tenancy model, sync vs. async boundaries, hosting model.
4. **For each decision write an ADR** (`docs/adr/NNN-title.md` from
   `.ship-anything/templates/architecture-decision.md`): context, ≥ 2 options with
   pros/cons, decision, consequences. Verify version/compat claims against official docs.
5. **Module boundaries**: list modules/packages with responsibility, owned data, public
   interface, and allowed dependencies (no cycles). Map to file ownership globs
   (`.ship-anything/policies/file-ownership.md`).
6. **Data model outline**: entities, key fields, relations, ownership, PII classification,
   retention; migrations strategy for existing data.
7. **Contracts**: write machine-readable interfaces where possible — `openapi.yaml`,
   `schema.graphql`, `*.proto`, shared TypeScript types, event schemas. Include error
   shapes, auth requirements, pagination, idempotency for writes.
8. **Cross-cutting**: authn/authz model, config and secrets handling (names only), logging/
   tracing, error handling, i18n, accessibility baseline, testing strategy per layer.
9. **Deployment sketch**: environments (local, preview, prod), runtime targets, data stores,
   CI steps. Production actions remain authorization-gated.
10. **Risks and spikes**: list unknowns that could invalidate the design; plan a small
    time-boxed spike task for each before dependent work starts.
11. **Freeze**: mark contracts `status: frozen` in `docs/architecture.md`; changes after
    freeze go through the orchestrator with an ADR update and notice to dependent tasks.

## Decision rules

| Situation | Action |
|---|---|
| Existing stack works for the drivers | Keep it; no rewrite |
| Two options both viable | Pick the one the team/repo already uses or with less operational surface |
| Driver unclear (e.g. scale) | Design for stated needs; note the scale-out path, don't build it |
| Hot path performance concern | Measure first (`performance-optimization`); consider `rust-modernization` only with evidence |
| Contract must change mid-build | Version it or coordinate via orchestrator; never silent edits |

## Tools

- ADR template; OpenAPI/GraphQL/protobuf linters (`npx @redocly/cli lint openapi.yaml`,
  `buf lint`) where applicable.
- Diagrams as text (Mermaid in Markdown) for reviewability.

## Quality standards

- Every hard-to-reverse decision has an ADR with alternatives and reasons.
- Contracts are machine-readable, lint-clean, and cover errors and auth.
- Module boundaries map to non-overlapping ownership globs.
- No unverified claims about library capabilities or limits.

## Common failures

- Microservices, queues or Kubernetes for an MVP without a driver.
- Contracts in prose only, interpreted differently by frontend and backend.
- Ignoring existing patterns in a brownfield repo.
- No migration plan for schema changes on live data.

## Outputs

- `docs/architecture.md` (drivers, modules, data outline, cross-cutting, deployment).
- `docs/adr/*.md`; contract files (`openapi.yaml`, etc.).
- Spike tasks and ownership proposal for the orchestrator.

## Done when

- ADRs exist for all hard-to-reverse choices, contracts are written, linted and frozen, and
  the orchestrator can assign parallel tasks against them without overlap.
