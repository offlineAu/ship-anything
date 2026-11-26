---
name: fullstack-platform
description: >-
  Builds a multi-client platform on one shared backend: frozen API + event contracts and
  authz matrix first, then data, providers, backend and client tracks (web, admin, mobile,
  desktop) in parallel waves, with real-time, payments, independent QA, security gate,
  infrastructure and authorised release.
level: [L3, L4]
required_agents: [architecture-agent, backend-agent, database-agent, frontend-agent, qa-agent, security-agent]
optional_agents: [product-director, ux-agent, mobile-agent, integration-agent, infrastructure-agent, monitoring-agent, performance-agent]
required_skills: [architecture-planning, api-development, fullstack-development, database-engineering, authentication-and-authorization, testing-and-qa, security-audit]
composes: [product-discovery, web-app, mobile-app, desktop-app, security-remediation, production-release]
---

# Full-stack platform

## Purpose

One backend, several clients, consistent behaviour. The platform owns the contracts
(REST/GraphQL, real-time events, authz matrix, data model); client workflows (`web-app`,
`mobile-app`, `desktop-app`) contribute UI tracks only. Verification proves cross-client
journeys (e.g. customer places order → staff app receives it → admin sees it).

## When to use

- ≥ 2 clients on one backend (customer web + admin + staff mobile …).
- Real-time features (orders, chat, live status), payments, multi-role authorization.
- Marketplaces, booking/ordering platforms, multi-tenant SaaS.

Do not use when: one client and no real-time/payments → `web-app`; extending an existing
platform → `improve-existing-project` (compose this only for new subsystems).

## Inputs

- `docs/product-brief.md` (compose `product-discovery` first if missing).
- Role list, tenancy model, payment provider preference, data residency, hosting target.

## Agents

Required: `architecture-agent` (contracts), `database-agent` (schema/migrations),
`backend-agent` (API, auth, real-time), `frontend-agent` (web clients), `qa-agent`
(cross-client verification), `security-agent` (auth, payments, PII gate).
Optional: `product-director` (via product-discovery), `ux-agent` (design system across
clients), `mobile-agent` (mobile client), `integration-agent` (payments, email/SMS, maps),
`infrastructure-agent` + `monitoring-agent` (when deploy in scope), `performance-agent`
(real-time load or CWV targets).

## Skills and tools

Required skills above; optional `integration-engineering`, `api-testing`, `observability`,
`infrastructure-engineering`, `performance-optimization`, `design-system-engineering`.
Tools: contract tooling (OpenAPI/AsyncAPI validators, generated typed clients), migration
tool, Playwright, API test runner, load tool (k6 or equivalent) for real-time.

## Task graph

```
id     agent                 objective                                  depends_on            wave  owns
FP-01  architecture-agent    services, API contract, event schema       brief                 1     docs/architecture.md, docs/adr/**, docs/api/**
                             (AsyncAPI or typed), authz matrix,
                             tenancy, idempotency rules → FROZEN
FP-02  ux-agent              cross-client design system + tokens        brief                 1     docs/design/**, packages/ui-tokens/**
FP-03  database-agent        schema, migrations, seeds, indexes for     FP-01                 2     db/**
                             hot queries named in FP-01
FP-04  integration-agent     payment provider wrapper (test mode),      FP-01                 2     services/api/src/integrations/**
                             signed+idempotent webhooks; notifications
FP-05  orchestrator          generate shared typed client from          FP-01                 2     packages/contracts/**
                             contract (codegen, no hand edits)
FP-06  backend-agent         handlers, authn/authz per matrix,          FP-03, FP-04, FP-05   3     services/api/** except integrations/
                             real-time gateway (auth on connect,
                             reconnect + resync), contract tests
FP-07  frontend-agent        customer web client (web-app track)        FP-02, FP-05          3     apps/web/**
FP-08  mobile-agent          staff/mobile client (mobile-app track)     FP-02, FP-05          3     apps/mobile/**
FP-09  frontend-agent        admin client (web-app track)               FP-02, FP-05          4     apps/admin/**
FP-10  infrastructure-agent  envs, CI pipeline, IaC, secrets by name    FP-01                 4     infra/**, .github/workflows/**
FP-11  orchestrator          integration: clients → real API, seed      FP-06..FP-09          5     root manifests, lockfiles, configs
                             data, cross-client smoke
FP-12  qa-agent              cross-client e2e, API + event tests,       FP-11                 6     tests/**
                             authz denial tests, payment test mode
FP-13  performance-agent     real-time fan-out load, CWV (optional)     FP-11                 6     perf/**
FP-14  security-agent        auth, authz matrix, webhooks, PII,         FP-12                 7     docs/security/**
                             deps, secrets → gate
FP-15  monitoring-agent      health checks, logs, metrics, alerts       FP-11                 7     src/observability/**, docs/runbooks/**
FP-16  (production-release)  when deploy in scope                       FP-14, FP-15, FP-10   8     see production-release
```

FP-07 and FP-09 share an agent type; run them in different waves (or as two agent instances)
— their owned trees are disjoint, so either is safe.

## Parallel opportunities

- FP-01 ∥ FP-02 (wave 1). FP-03 ∥ FP-04 ∥ FP-05 (wave 2, disjoint trees, all on frozen contract).
- Backend and client tracks (wave 3) because clients use the generated client + contract mocks.
- QA ∥ performance (wave 6); security gate ∥ monitoring setup (wave 7, disjoint owns).

## Sequential requirements

- Contracts frozen and typed client generated before any client or backend build.
- Schema migrations before backend persistence; payments wrapper before checkout handlers.
- Cross-client integration (FP-11) before QA; QA fixes before the security gate; security
  gate before release; production deploy and live payment keys only with explicit authorization.

## Acceptance criteria

- Each cross-client journey in the brief passes e2e (e.g. order created on web appears in
  staff app and admin within the latency target stated in the brief).
- Authz matrix fully tested: every role × protected action has an allow or deny test.
- Webhooks: signature verified, replay ignored (idempotency key), out-of-order events handled.
- Real-time: client reconnect resyncs missed state; unauthorised subscriptions rejected.
- Payments run in provider test mode end-to-end; no live keys in any environment without authorization.

## Quality gates

- Every package: clean install, typecheck, lint, unit tests, build exit 0.
- Contract tests: backend responses and emitted events validate against the frozen schemas.
- qa-agent: all cross-client e2e + API tests pass; acceptance checklist signed with evidence.
- security-agent: 0 open high/critical findings; dependency audit clean or waived with reason;
  secret scan clean.
- Performance (if targets stated): measured values recorded against brief targets; CWV
  "good" thresholds for public web pages.

## Deliverables

Monorepo source, contracts and generated client, migrations, infra config, tests, runbooks,
`docs/architecture.md`, `docs/security/review-<date>.md`, `.env.example` per app (names only).

## Completion conditions

All MVP tasks VERIFIED (qa-agent) with security sign-off recorded. Release in scope →
DEPLOYED (authorized, with URLs/IDs and health checks) then SHIPPED via production-release;
else DEPLOYED N/A and handoff states environments are local/staging only.

## Failure recovery

| Failure | Recovery |
|---|---|
| Contract change after freeze | architecture-agent versions it; regenerate client at checkpoint; affected tasks back to IN_PROGRESS |
| Cross-client journey fails | Trace via event/request IDs across services; fix owning side; add the journey to regression suite |
| Real-time messages lost/duplicated | Add sequence numbers + idempotent consumers; resync-on-reconnect test |
| Webhook verification fails in test | Check raw-body handling and secret name; never disable verification |
| Migration conflicts between tasks | Only database-agent writes migrations; serialize, regenerate |
| Security gate fails | Compose `security-remediation`; release blocked until 0 open high/critical |
| Load target missed | performance-agent profiles; fix the bottleneck; re-run identical load profile |
