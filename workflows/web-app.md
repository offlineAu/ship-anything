---
name: web-app
description: >-
  Builds a single-client web application with accounts, persistent data and an API:
  architecture and frozen API contract first, then parallel frontend/backend/data work,
  integration, independent QA and a security gate. Also contributes a client track to
  fullstack-platform.
level: [L2, L3]
required_agents: [architecture-agent, frontend-agent, backend-agent, qa-agent]
optional_agents: [ux-agent, database-agent, integration-agent, security-agent, performance-agent]
required_skills: [architecture-planning, api-development, frontend-development, backend-development, testing-and-qa]
composes: [product-discovery, security-remediation, production-release]
---

# Web app

## Purpose

Deliver a working web application — UI, API, data, auth — whose primary user journeys pass
end-to-end tests against the real backend, with security reviewed when risk flags apply.

## When to use

- SaaS tools, dashboards, internal tools, CRUD apps, portals: one web client + its API.
- As a client track inside `fullstack-platform` (then only WA-02, WA-05, WA-08 apply; the
  platform owns architecture, data and backend).

Do not use when: static/content site → `website`; several clients or real-time/payments
across roles → `fullstack-platform`; existing codebase changes → `improve-existing-project`.

## Inputs

- `docs/product-brief.md` (compose `product-discovery` first if missing on L3).
- Existing stack constraints, hosting target, auth provider preference, data residency.

## Agents

- `architecture-agent`: stack, module boundaries, API contract (OpenAPI/GraphQL schema), data model.
- `frontend-agent`: UI, routing, client state, forms against the contract.
- `backend-agent`: handlers, services, auth/authz.
- `qa-agent`: e2e + API tests, acceptance verification.
- Optional: `ux-agent` (no design direction yet), `database-agent` (non-trivial schema or
  migrations; otherwise backend-agent handles a simple schema), `integration-agent`
  (third-party providers/webhooks), `security-agent` (required whenever auth, payments, PII
  or file upload are in scope), `performance-agent` (stated perf targets).

## Skills and tools

`architecture-planning`, `api-development`, `frontend-development`, `backend-development`,
`testing-and-qa`; optional `database-engineering`, `authentication-and-authorization`,
`integration-engineering`, `api-testing`, `security-audit`, `ui-ux-design`.
Tools: project build/test scripts, Playwright, an OpenAPI mock server or generated client.

## Task graph

```
id     agent               objective                                  depends_on          wave  owns
WA-01  architecture-agent  stack ADR, module map, API contract,       -                   1     docs/architecture.md, docs/adr/**, docs/api/**
                           data model, authz rules → FROZEN
WA-02  ux-agent            design direction, tokens, key screens      -                   1     docs/design/**, src/styles/tokens.*
                           (optional)
WA-03  database-agent      schema, migrations, seed fixtures          WA-01               2     db/**, src/server/models/**
WA-04  integration-agent   provider wrappers, webhook handlers        WA-01               2     src/server/integrations/**
                           (optional)
WA-05  frontend-agent      pages, components, state; calls via        WA-01, WA-02        2     src/app/**, src/components/**
                           client generated from contract + mocks
WA-06  backend-agent       handlers, services, authn/authz, unit      WA-01, WA-03, WA-04 3     src/server/** except models/, integrations/
                           tests, contract conformance
WA-07  orchestrator        integration: swap mocks for real API,      WA-05, WA-06        4     package.json, lockfile, configs, route index
                           build, migrate test DB, boot, smoke
WA-08  qa-agent            e2e journeys + API tests vs acceptance     WA-07               5     tests/**
                           criteria
WA-09  security-agent      authz, input validation, secrets, deps     WA-07               5     docs/security/**
                           review (when risk flags)
WA-10  performance-agent   CWV + API latency baseline (optional)      WA-07               5     perf/**
WA-11  owning agents       fix findings with regression tests         WA-08, WA-09, WA-10 6     per finding
WA-12  qa-agent            re-verify; security-agent re-checks fixes  WA-11               7     tests/**
WA-13  (production-release) when deploy in scope                      WA-12               8     see production-release
```

Ownership note: WA-05 and WA-06 must not share a directory prefix; in frameworks with
co-located server code (e.g. Next.js route handlers) give `src/app/api/**` to backend-agent
and exclude it from WA-05.

## Parallel opportunities

- WA-01 ∥ WA-02 (both depend only on the brief).
- WA-03 ∥ WA-04 ∥ WA-05 once the contract is frozen; frontend uses mocks from the contract.
- WA-08 ∥ WA-09 ∥ WA-10: read-only on app code, disjoint owned dirs.

## Sequential requirements

- API contract frozen (WA-01 VERIFIED) before any FE/BE work; contract changes after freeze
  go through architecture-agent and re-notify dependent tasks.
- Schema before backend handlers that persist data.
- QA after integration (WA-07 green); security gate before release; prod deploy only with
  explicit authorization via production-release.

## Acceptance criteria

- Every MVP acceptance criterion from the brief maps to ≥ 1 passing e2e or API test.
- Backend responses conform to the contract (schema validation in tests or contract tests).
- Authz: each role can do exactly what the authz matrix allows; denied paths tested.
- Loading, empty, error states exist for every data view.

## Quality gates

- Clean install from lockfile, typecheck, lint, unit tests, build: exit 0.
- Migrations apply on an empty DB and roll back (where the tool supports down migrations).
- qa-agent: all e2e/API tests pass; acceptance criteria checklist signed with evidence.
- security-agent (risk flags): 0 open high/critical findings; dependency audit
  (`npm audit --audit-level=high` or ecosystem equivalent) clean or each item waived with reason.
- Performance (if targets stated): CWV "good" thresholds (LCP ≤ 2.5 s, INP ≤ 200 ms,
  CLS ≤ 0.1) and API latency targets from the brief, measured.

## Deliverables

Application source, migrations, `docs/architecture.md`, API contract, tests, `.env.example`
with variable names only, README (setup, run, test), `docs/security/review-<date>.md` if WA-09 ran.

## Completion conditions

All MVP tasks VERIFIED by qa-agent (security sign-off recorded when risk flags). Deploy in
scope → DEPLOYED/SHIPPED via production-release; otherwise DEPLOYED is N/A and the handoff
says the app runs locally only.

## Failure recovery

| Failure | Recovery |
|---|---|
| Contract gap found during build | Implementer stops, reports; architecture-agent amends contract (version bump); orchestrator re-issues affected contracts |
| FE and BE disagree at integration | Contract is the arbiter; non-conforming side fixes; add a contract test |
| Migration fails on test DB | database-agent fixes forward; never edit an applied migration in shared envs |
| E2E flaky | qa-agent isolates cause (timing, data, order); fix root cause, no blind retries |
| High/critical security finding | Compose `security-remediation` for the finding; release blocked until closed |
| Provider sandbox unavailable | Mock at the wrapper boundary, mark provider-dependent criteria BLOCKED with reason |
