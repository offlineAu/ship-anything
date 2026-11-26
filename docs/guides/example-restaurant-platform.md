# Example: restaurant platform (illustrative plan)

> **This is an illustrative plan, not a recorded run.** It shows how the orchestrator is
> *instructed* to decompose a large request, following [`workflows/build-anything.md`](../../workflows/build-anything.md)
> and the workflows it composes. No code was generated, nothing was tested or deployed, and no
> durations, token counts or costs are implied. A real run will differ in task details,
> assumptions and the number of retries.

## The request

```text
Build a restaurant platform: a customer website where people browse the menu and order,
an admin dashboard for managers, a mobile app for staff, real-time order updates,
online payments, 3D views of signature dishes, an animated landing page, and deploy it
to production.
```

## 1. Classification: L4

The orchestrator classifies by deliverables and risk, never by prompt length
(rubric: [`parallel-agent-coordination`](../../skills/parallel-agent-coordination/SKILL.md)).

| Factor | Finding | Score |
|---|---|---|
| Deliverables | Customer site, admin dashboard, staff app, landing page, 3D views (3+) | 2 |
| Contracted subsystems | UI ↔ API, API ↔ DB, payments webhook, real-time channel | 2 |
| Platforms | Web, iOS, Android, server | 2 |
| Creative production | 3D models and viewer, landing motion | 2 |
| Risk flags | Auth, payments, personal data (PII), production deploy | +4 |

Result: **L4 (full product)**. That means a product brief first, frozen contracts before any
build, independent QA, a security gate, a release agent and staged delivery.

## 2. Workflows composed

| Workflow | Role in this plan |
|---|---|
| [`product-discovery`](../../workflows/product-discovery.md) | Always first at L3+ without a brief: users, MVP scope, out-of-scope list, acceptance criteria |
| [`fullstack-platform`](../../workflows/fullstack-platform.md) | Owns the backend and all contracts (OpenAPI, real-time events, authz matrix, data model) |
| [`web-app`](../../workflows/web-app.md) ×2 | Client tracks only: customer site and admin dashboard (its own architecture/backend tasks are dropped as duplicates) |
| [`mobile-app`](../../workflows/mobile-app.md) | Client track only: staff app |
| [`website`](../../workflows/website.md) | Landing route with motion, SEO metadata and measured Core Web Vitals |
| [`3d-product`](../../workflows/3d-product.md) | Dish models as optimized GLB, viewer component, static fallback |
| [`production-release`](../../workflows/production-release.md) | Always last, once: staging, authorization gate, production, verification |

Composition rules applied: shared tasks (brief, architecture, design direction, QA gate,
security gate, release) exist once. Creative workflows start after design direction is frozen.
Task ids are prefixed by workflow for traceability.

## 3. Assumptions the orchestrator would record

With `autonomy: high` (the default in `.ship-anything/config.yaml`), the orchestrator records
reasonable assumptions in `.ship-anything/state/decisions.md` instead of stopping to ask. For example:

- Single restaurant brand, one location for the MVP. Multi-location is out of scope.
- Payments in the provider's **test mode** until the production release is authorized.
- Staff app for iOS and Android via one cross-platform stack. Store submission is out of scope (authorization-gated).
- Dish 3D models are sourced or modeled with recorded licenses. No scanned customer content.

Each is a guess the user can overturn, so it is listed in the handoff.

## 4. Waves

Each task has an owner agent and `owns:` globs. Tasks in the same wave run in parallel only if
their globs do not overlap, and at most `parallelism.max_agents` (default 4) run at once, so a
wide wave may be split. On a tool without subagents, the same plan runs task by task in one session.

```
wave  task  agent                · owns                                   depends_on
1     PD    product-director     · docs/product-brief.md                  -
2     FP    architecture-agent   · docs/architecture.md, docs/api/**      PD
      UX    ux-agent             · docs/design/**, design tokens           PD
3     DB    database-agent       · db/**                                   FP
      INT   integration-agent    · **/integrations/** (payments, test mode) FP
      3D    blender-agent        · assets/3d/**                            UX
      MO    motion-agent         · src/motion/**                           UX
4     BE    backend-agent        · services/api/** (API, auth, realtime)   DB, INT
      WEB   frontend-agent       · apps/web/** except apps/web/src/three/** FP, UX, MO
      MOB   mobile-agent         · apps/mobile/**                          FP, UX
      3V    threejs-agent        · apps/web/src/three/**                   3D
5     ADM   frontend-agent       · apps/admin/**                           FP, UX
      INF   infrastructure-agent · infra/**, .github/**                    FP
      CHK   orchestrator         · integration checkpoint                  BE, WEB, MOB, 3V
6     QA    qa-agent             · tests/**                                CHK, ADM
      PERF  performance-agent    · perf/**                                 CHK, ADM
7     SEC   security-agent       · docs/security/**                        QA
8     REL   release-agent + production-release workflow                    SEC, INF
```

Notes on the plan:

- **Contracts first.** Clients in wave 4 build against mocks generated from the frozen OpenAPI and event schemas, so they do not wait for the backend.
- **Overlapping globs.** `3V` owns `apps/web/src/three/**`, which sits inside `apps/web/**`. WEB's contract therefore excludes that path explicitly. Without the exclusion, 3V would be serialized after WEB.
- **Shared files** (root `package.json`, lockfiles, CI files, route registries) belong to the orchestrator and change only at integration checkpoints ([file ownership](../../.ship-anything/policies/file-ownership.md)).
- **Integration checkpoints** after every wave: build and tests must be green before the next wave starts.

## 5. Agents involved

18 of the 22 agents take part: orchestrator, product-director, architecture-agent, ux-agent,
database-agent, integration-agent, blender-agent, motion-agent, backend-agent, frontend-agent,
mobile-agent, threejs-agent, infrastructure-agent, qa-agent, performance-agent, security-agent,
release-agent, plus monitoring-agent inside `production-release`. (research-agent, desktop-agent,
video-agent and documentation-agent are not needed unless the brief adds research, a desktop
client, a promo video or extra docs.)

Specialists never delegate. If one needs work outside its ownership, it records the request
in its report and the orchestrator re-plans.

## 6. Gates

| Gate | When | Passes only if |
|---|---|---|
| Contract freeze | End of wave 2 | OpenAPI, event schema and authz matrix reviewed. Changes after this need an ADR |
| Integration checkpoint | After each wave | Clean install, typecheck, lint, unit tests and build exit 0 |
| QA (independent) | Wave 6 | qa-agent, not the implementers, re-runs e2e (web, admin, mobile) and API tests against the real backend. Acceptance criteria checked with evidence |
| Performance | Wave 6 | Measured values recorded against targets (defaults: LCP 2500 ms, INP 200 ms, CLS 0.1 at p75), with real-time load checked |
| Security | Wave 7 | No open high/critical findings. Auth, payment webhook signatures, PII handling, dependency audit and secret scan reviewed |
| Release readiness | Wave 8 start | All MVP tasks VERIFIED, env vars named (not valued), migrations reviewed, rollback target identified |
| **Authorization** | Before production | The orchestrator presents exact commands, target environment, changes, cost and rollback. Only the user's explicit approval continues |
| Post-deploy verification | After production deploy | Production smoke tests, health checks and error-rate watch recorded before anything is marked DEPLOYED or SHIPPED |

Status only moves with evidence: `PLANNED → IN_PROGRESS → IMPLEMENTED → TESTED → VERIFIED → DEPLOYED → SHIPPED`
([status model](../../.ship-anything/policies/status-model.md)). A local build is never DEPLOYED.
A staging deploy is `DEPLOYED(preview)`.

## 7. Authorization points in this plan

Under the [authorization policy](../../.ship-anything/policies/authorization.md), the run would
pause and ask the user for each of these, separately:

- Creating paid cloud resources or a staging environment that costs money.
- Switching payments from test mode to live keys (credentials).
- DNS changes for the production domain.
- Production deploy, and separately any destructive migration.
- `git push`, tags or app-store submission, if requested at all.

## 8. What the user would see in `.ship-anything/state/`

- `plan.yaml`: level `L4`, the seven workflows, assumptions, eight waves, every task with agent, owns, depends_on, status.
- `decisions.md`: the assumptions above, contract-freeze ADR references, each authorization answer.
- `tasks/<id>.md`: one report per task with files changed and commands run with their real output.
- `sessions/`: continuation summaries if the run spans several context windows.

## Replacing this with a real run

When a real run of this example exists, it should be published as its own repository with its
untouched `.ship-anything/state/`, the raw session log and the tool versions used, and this page
should link to it and note where the real plan differed from this one.
