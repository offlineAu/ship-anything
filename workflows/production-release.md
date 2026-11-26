---
name: production-release
description: >-
  Takes verified work to production: readiness check, environments and CI, monitoring,
  release notes, preview/staging deploy and verification, explicit user authorization,
  production deploy, post-deploy verification and rollback. A local build is never a
  deployment. Composed last, once, by any build workflow.
level: [L2, L3, L4]
required_agents: [release-agent, infrastructure-agent, qa-agent]
optional_agents: [security-agent, monitoring-agent, performance-agent, documentation-agent]
required_skills: [release-management, deployment, production-readiness, ci-cd, environment-management]
composes: []
---

# Production release

## Purpose

Move a VERIFIED build into production safely and provably: the exact artifact tested in
staging/preview is what ships, the user authorizes the production step explicitly, and
DEPLOYED/SHIPPED are claimed only with deploy IDs, URLs and health-check evidence.

## When to use

- Any request in scope that says deploy, release, publish, go live, ship to prod/stores.
- Patch releases after `security-remediation`.

Do not use when: the user wants a local build/demo only (report VERIFIED, DEPLOYED N/A);
no hosting target or credentials exist and the user has not chosen one (ask, batch with
other decisions; prepare everything up to the gate).

## Inputs

- Plan with all MVP tasks VERIFIED; security sign-off when risk flags apply.
- Hosting target, environments, secret **names** and where they live, domain (if any).
- Migrations to run, data backup status, previous release version (rollback target).

## Agents

- `release-agent` (required): readiness checklist, versioning, notes, deploy execution, verification.
- `infrastructure-agent` (required): environments, CI/CD, IaC, secrets wiring by name.
- `qa-agent` (required): smoke and acceptance checks on preview/staging and production.
- Optional: `security-agent` (final gate confirmation, config review), `monitoring-agent`
  (health checks, alerts, dashboards), `performance-agent` (CWV/latency on staging),
  `documentation-agent` (user-facing release notes polish).

## Skills and tools

`release-management`, `deployment`, `production-readiness`, `ci-cd`, `environment-management`;
optional `observability`, `infrastructure-engineering`. Tools: the host platform CLI
(e.g. `vercel`, `fly`, `kubectl`, `terraform plan`), CI runner, `curl` health checks,
Playwright smoke suite.

## Task graph

```
id     agent                 objective                                    depends_on           wave  owns
PR-01  release-agent         readiness: MVP tasks VERIFIED, security      upstream gates       1     reports/release-readiness.md
                             gate passed, env vars named, migrations
                             reviewed, rollback target identified
PR-02  infrastructure-agent  envs + CI pipeline + IaC; `plan`/dry-run     PR-01                2     infra/**, CI workflow files
                             output recorded; secrets by name only
PR-03  monitoring-agent      health endpoint, logs, error tracking,       PR-01                2     src/observability/**, docs/runbooks/**
                             alerts, release dashboard (optional)
PR-04  release-agent         version bump, changelog/release notes,       PR-01                2     CHANGELOG.md, version fields
                             rollback runbook
PR-05  release-agent         preview/staging deploy of the release        PR-02, PR-03, PR-04  3     deploy logs
                             artifact (authorization if it creates paid
                             resources or is not pre-approved)
PR-06  qa-agent              smoke + critical journeys on staging;        PR-05                4     tests/smoke/**
                             migrations rehearsed on staging data
PR-07  performance-agent     staging CWV / latency check (optional)       PR-05                4     perf/**
PR-08  orchestrator          AUTHORIZATION GATE: present exact commands,  PR-06, PR-07         5     .ship-anything/state/decisions.md
                             target env, changes, cost, rollback; record
                             the user's explicit approval
PR-09  release-agent         production deploy of the same artifact;      PR-08 approved       6     deploy logs
                             migrations (destructive → separate approval)
PR-10  qa-agent              production smoke, health checks, error-rate  PR-09                7     reports/**
       + monitoring-agent    watch for the window set in PR-01
PR-11  release-agent         release report; tag/push only if authorized  PR-10                8     reports/release-<version>.md
```

## Parallel opportunities

- PR-02 ∥ PR-03 ∥ PR-04 (infra, observability, release notes: disjoint owns).
- PR-06 ∥ PR-07 on staging (tests vs perf measurement).
- Nothing runs in parallel with PR-08 → PR-10; production steps are strictly serial.

## Sequential requirements

- Upstream QA and security gates passed before PR-01 can pass.
- Staging verified before the authorization request; the authorization names the exact
  artifact/commit that was verified.
- One approval covers one action in one environment; migrations, DNS, domain purchases,
  `git push`/tags, store submissions and paid resources each need their own approval.
- Post-deploy verification before SHIPPED; rollback decision before any further changes.

## Acceptance criteria

- Production URL/ID recorded with deploy command output and timestamp.
- Health endpoint returns healthy; smoke journeys pass in production.
- Error rate during the watch window no worse than the pre-release baseline (if one exists).
- Rollback procedure documented and its target version identified (tested on staging when possible).
- No secret values in logs, reports, notes or CI output.

## Quality gates

- Readiness checklist complete with evidence links (PR-01).
- IaC dry-run reviewed; no unexpected destroy/replace operations.
- Staging: smoke suite green, migrations applied cleanly, CWV/latency targets met if defined.
- Authorization recorded verbatim in decisions.md before PR-09 runs.
- Production: health check + smoke green; alerts configured (if monitoring in scope).

## Deliverables

CI/CD and infra config, observability config, release notes, rollback runbook, staging and
production verification evidence, `reports/release-<version>.md`, updated plan statuses.

## Completion conditions

Status rules (`policies/status-model.md`): a successful `build` locally is TESTED evidence,
never DEPLOYED. Preview/staging → DEPLOYED(preview). Production deploy with URL/ID +
health check → DEPLOYED. All acceptance criteria verified in production + release report
→ SHIPPED. If authorization is not given, tasks stay VERIFIED with deploy BLOCKED (reason).

## Failure recovery

| Failure | Recovery |
|---|---|
| Readiness gap (unverified task, open high/critical) | Stop; route back to the owning workflow; no partial "ship" |
| Missing credentials/secrets in target env | BLOCKED; list secret names and where to set them; never request values in chat logs |
| Staging deploy fails | Read build/deploy logs, fix config in owning task, redeploy staging; no prod attempt |
| Migration fails on staging | Fix forward in database task; rehearse again; prod migration blocked meanwhile |
| Production health check fails | Execute rollback runbook (authorization per policy unless pre-approved in PR-08), verify old version healthy, open bug-fix contract |
| Error spike in watch window | Compare with baseline; rollback if above threshold set in PR-01; record incident |
| User declines authorization | Hand off with exact commands and verified artifact; statuses remain VERIFIED |
