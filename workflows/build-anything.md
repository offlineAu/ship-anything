---
name: build-anything
description: >-
  Master router. Turns any request into deliverables, a complexity level (L1–L4) and a
  composition of specialised workflows with merged, dependency-ordered waves. Entry point
  for every request whose workflow is not already fixed in .ship-anything/state/plan.yaml.
level: [L1, L2, L3, L4]
required_agents: [orchestrator]
optional_agents: [product-director, architecture-agent, qa-agent, security-agent, release-agent]
required_skills: [parallel-agent-coordination, requirements-analysis, context-management]
composes: [product-discovery, website, web-app, mobile-app, desktop-app, fullstack-platform, 3d-product, video-production, clone-existing-product, reverse-engineer, improve-existing-project, legacy-modernization, security-remediation, production-release]
---

# Build anything (master router)

## Purpose

Classify a request by **deliverables and risk** (never prompt length), pick the fewest
workflows that cover it, merge their task graphs into one `plan.yaml`, and hand execution
to the composed workflows. This file decides *what* runs; the composed workflows define *how*.

## When to use

- Every new request, unless `.ship-anything/state/plan.yaml` exists → resume that plan instead.
- When a running plan gains a new deliverable (re-route only the delta, keep VERIFIED tasks).

Do not use when: the request is a question with no deliverable (answer it), or it is L1
(act directly with one skill and self-verify freshly; no plan file needed).

## Inputs

- User request (verbatim); existing repo (manifests, README, git status) if any.
- `.ship-anything/config.yaml` (`parallelism.max_agents`, default 4).
- Prior `docs/product-brief.md`, `docs/architecture.md` if present.

## Agents

`orchestrator` runs the router. It delegates only what composed workflows require.
`product-director` / `architecture-agent` are pulled in by composed workflows, not by the
router itself. `qa-agent`, `security-agent`, `release-agent` appear once in the merged plan
even when several composed workflows list them.

## Skills and tools

`parallel-agent-coordination` (scoring rubric, waves, ownership overlap check),
`requirements-analysis` (acceptance criteria), `context-management` (continuation summaries
on long L4 plans). Tools: `git ls-files`, `git status --porcelain`, `git diff --name-only`.

## Task graph

Router steps (all orchestrator, sequential):

```
id     step                                                         depends_on  wave
BA-01  intake: restate goal ≤3 lines, list deliverables, constraints  -           1
BA-02  discover: repo map (skip empty repo), detect existing stack    BA-01       1
BA-03  score rubric + risk flags → level; record in decisions.md      BA-02       1
BA-04  route deliverables → workflows (table below); compose          BA-03       1
BA-05  merge task graphs: dedupe shared tasks, namespace ids, waves   BA-04       1
BA-06  ownership overlap check per wave; write plan.yaml; execute     BA-05       1
```

Routing table (a request may match several rows; compose all that match):

| Signal in request / repo | Workflow |
|---|---|
| idea without defined users, scope or MVP; L3+ with no brief | product-discovery (always first) |
| marketing / content / landing / docs site, little or no server state | website |
| one web client with accounts, data, forms, dashboards | web-app |
| iOS / Android app | mobile-app |
| Windows / macOS / Linux app | desktop-app |
| ≥ 2 clients sharing a backend, or real-time, or payments across roles | fullstack-platform |
| 3D viewer, configurator, product models, WebGL scenes | 3d-product |
| promo / explainer / product video, rendered motion pieces | video-production |
| "like X", "clone X", "same as X but…" | clone-existing-product |
| "how does X work", undocumented API / format / codebase | reverse-engineer |
| existing repo: add features, fix, polish, refactor | improve-existing-project |
| outdated stack, framework migration, rewrite pressure | legacy-modernization |
| vulnerabilities, audit report, leaked secret, pentest findings | security-remediation |
| deploy, release, publish, "ship to prod", go live | production-release (always last, once) |

Composition rules:
1. `fullstack-platform` owns the backend and contracts when present; `web-app` / `mobile-app`
   / `desktop-app` then contribute **client tracks only** (their architecture/backend tasks are
   dropped as duplicates).
2. Creative workflows (`3d-product`, `video-production`) start after design direction is
   frozen and run beside platform waves; they integrate via agreed asset paths.
3. Shared tasks (brief, architecture, design direction, QA gate, security gate, release) exist once.
4. Task ids are namespaced by workflow prefix (FP-, WA-, MA-, 3D-, …) to keep reports traceable.
5. A wave holds ≤ `max_agents` tasks, all with satisfied `depends_on` and disjoint `owns`.

Worked example — "restaurant platform with customer site, admin dashboard, staff mobile app,
real-time orders, payments, 3D product views, animated landing page, production deploy":

Score: deliverables 3+ (2) · contracted subsystems UI↔API, API↔DB, payments webhook,
realtime channel (2) · platforms web, iOS, Android, server (2) · creative 3D + motion (2) ·
risk flags auth, payments, PII, prod deploy (+4) → **L4**.
Compose: product-discovery → fullstack-platform (web-app ×2 client tracks, mobile-app client
track) + website (landing route) + 3d-product + production-release.

```
wave  tasks (agent · owns)                                                     depends_on
1     PD  brief + acceptance criteria (product-director · docs/product-brief.md) -
2     FP  architecture, OpenAPI, realtime event schema, authz matrix           PD
          (architecture-agent · docs/architecture.md, docs/api/**)
      UX  design direction + tokens (ux-agent · docs/design/**, tokens)       PD
3     DB  schema + migrations (database-agent · db/**)                         FP-arch
      INT payments wrapper + webhooks, test mode (integration-agent · **/integrations/**) FP-arch
      3D  product models → GLB (blender-agent · assets/3d/**)                  UX
      MO  motion tokens + landing animations (motion-agent · src/motion/**)    UX
4     BE  API, auth, realtime gateway (backend-agent · services/api/**)       DB, INT
      WEB customer site + landing (frontend-agent · apps/web/**) vs mocks      FP-arch, UX, MO
      MOB staff app (mobile-agent · apps/mobile/**) vs mocks                   FP-arch, UX
      3V  3D viewer component (threejs-agent · apps/web/src/three/**)          3D
5     ADM admin dashboard (frontend-agent · apps/admin/**)                     FP-arch, UX
      INF CI, staging env, IaC (infrastructure-agent · infra/**, .github/**)   FP-arch
      CHK integration checkpoint: mocks → real API, 3D viewer mounted (orchestrator) BE, WEB, MOB, 3V
6     QA  e2e web/admin/mobile + API tests (qa-agent · tests/**)               CHK, ADM
      PERF Core Web Vitals + realtime load (performance-agent · perf/**)       CHK, ADM
7     SEC security gate (security-agent · docs/security/**)                    QA
8     REL release prep → staging → AUTHORIZATION → prod → verify (production-release) SEC, INF
```

Note `3V` owns `apps/web/src/three/**` inside `apps/web/**`: the glob prefixes overlap, so
WEB's contract excludes `apps/web/src/three/**` explicitly; otherwise serialize 3V after WEB.

## Parallel opportunities

- Architecture and design direction (wave 2): both depend only on the brief, disjoint owns.
- Data, payments, 3D assets, motion (wave 3): all consume frozen contracts, disjoint owns.
- Client tracks and backend (wave 4) once the API contract is frozen; clients build against
  mocks generated from the contract.
- QA and performance audits (wave 6): read-only on app code, separate owned dirs.

## Sequential requirements

- Brief before architecture on L3+; API/event contract frozen before any client or backend build.
- Integration checkpoint (build + tests green) after every wave; no wave starts on a red build.
- QA after integration; security gate after QA fixes; release after security gate.
- Production deploy only after explicit user authorization (`policies/authorization.md`).

## Acceptance criteria

- `plan.yaml` records level, score breakdown, risk flags, composed workflows, waves.
- Every deliverable in the request maps to ≥ 1 task; every task has measurable criteria.
- No two tasks in the same wave have overlapping `owns` (step-5 check of the rubric).

## Quality gates

- Routing gate: each deliverable traced to a workflow; unmatched deliverables listed as risks.
- Plan gate: no `depends_on` cycles; waves ≤ `max_agents`; shared files owned by orchestrator.
- Downstream gates are those of the composed workflows (QA, security, performance, release).

## Deliverables

`.ship-anything/state/plan.yaml`, `.ship-anything/state/decisions.md` (level reasoning,
assumptions), contracts per task, final handoff report `reports/handoff-<date>.md`.

## Completion conditions

Done when every MVP task across composed workflows is VERIFIED — or DEPLOYED/SHIPPED when
release is in scope — with non-MVP items VERIFIED or DESCOPED (who, why). BLOCKED tasks
are listed with their unblocking action. The handoff states what is not done.

## Failure recovery

| Failure | Recovery |
|---|---|
| Deliverable matches no workflow | Compose the closest one, add explicit tasks, record gap in decisions.md |
| Level mis-scored (scope grew mid-run) | Re-score, re-route the delta only; keep VERIFIED tasks |
| Ownership overlap found mid-wave | Pause the later task, move shared file to orchestrator, re-plan wave |
| Composed workflows conflict on a task | Keep one instance, union acceptance criteria, rewire `depends_on` |
| Context exhausted on long plan | Write continuation summary, persist plan.yaml, resume from state |
| User unreachable for a blocking decision | Mark dependent tasks BLOCKED, continue independent waves |
