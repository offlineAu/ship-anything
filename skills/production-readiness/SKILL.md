---
name: production-readiness
description: >-
  Runs the go-live gate before a production launch or major release: verifies with evidence
  that QA, security, performance, accessibility, observability, environment config, CI/CD,
  deployment and rollback, data protection, documentation and legal basics are in place,
  and returns a GO / NO-GO with blockers. Use before first production deploy, before
  promoting a release, or when asked "are we ready to ship/launch?".
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [orchestrator, monitoring-agent, release-agent]
---

# Production readiness

## Purpose

Give the user an honest, evidence-backed answer to "can this go to production?". This skill
does not redo specialist work; it checks that each specialist gate produced real evidence
and that nothing between them was missed.

## When to use

- Before the first production deployment of a product or service.
- Before promoting a release candidate that changes data, auth, payments or infrastructure.
- After a major incident, before re-enabling traffic.

Do not use when:
- Deploying a preview or staging environment: use `deployment` alone.
- A single bug fix with an existing healthy release pipeline: `release-management` covers it.
- The project is a library or CLI with no hosted runtime: use `release-management` (mark
  hosting items N/A).

## Inputs

- Plan and task statuses (`.ship-anything/state/plan.yaml`, `state/tasks/*.md`).
- Reports from QA, security, performance, monitoring, infrastructure and release agents.
- Target environment, expected traffic, data classification, compliance needs.

## Procedure

1. Collect evidence for each gate below from existing reports. Missing report = gate not
   passed; do not fill gaps from memory or assumptions.
2. Re-run cheap checks yourself to confirm the reports are current for the release commit:
   build, test suite, type check, lint, dependency audit, secret scan.
3. Walk the checklist. For each item record PASS / FAIL / N/A (with reason) and the
   evidence path or command output.
4. Classify every FAIL as blocker or accepted risk. Only the user can accept a risk; record
   acceptance in `.ship-anything/state/decisions.md`.
5. Produce the GO / NO-GO report. GO requires zero open blockers.
6. After the authorized deploy, confirm the post-launch items (health checks, alerts firing
   to the right place, dashboards receiving data) and append the results.

## Decision rules

Go-live checklist (each line needs evidence):

| Area | Gate | Evidence source |
|---|---|---|
| Scope | All in-scope acceptance criteria VERIFIED | `testing-and-qa` traceability matrix |
| Quality | Clean build, tests, type check, lint on release commit | Commands re-run in this step |
| Regressions | Every fixed bug has a regression test in CI | `regression-prevention` reports |
| Review | Release diff reviewed; no open blocker/major | `code-review` report |
| Security | No open critical/high; secret scan incl. history clean; deps audited | `security-audit` report |
| AuthZ | Role matrix tested | `api-testing` / security report |
| Performance | Budgets met (CWV good at p75 where field data exists; backend p95 within SLO) or gaps accepted | `performance-optimization` report |
| Accessibility | WCAG 2.2 AA checks on key flows | `accessibility-engineering` report |
| Config | Env matrix complete; prod secrets set by name; config validated at boot | `environment-management` |
| CI/CD | Required checks enforced; pipeline green on release commit | `ci-cd` |
| Infra | IaC reviewed; least privilege; backups enabled and a restore tested | `infrastructure-engineering` |
| Data | Migrations tested up/down on prod-like copy; backup before migration | `regression-prevention` / database reports |
| Observability | Health/readiness endpoints, structured logs, error tracking, uptime check, alerts routed | `observability` |
| Deploy | Deployment plan with authorization request prepared; rollback documented and rehearsed on staging | `deployment`, `release-management` |
| Docs | README/runbook/changelog reflect verified behaviour | `documentation` |
| Legal/basics | Privacy policy/terms if collecting personal data; cookie consent where required; licenses of dependencies compatible | Documentation + dependency license scan |

- Any FAIL in Security (critical/high), Data, Deploy rollback or Observability health
  checks is a blocker unless the user explicitly accepts it.
- N/A must state why (e.g. "no personal data collected").
- A preview deployment passing does not satisfy production items.
- "Not verified" is reported as such, never rounded up to PASS.

## Tools

- The project's build/test commands; `gitleaks`, dependency audit tools (see
  `security-audit`); `curl -fsS <url>/healthz` for health checks.
- Reports and state under `.ship-anything/state/` and `reports/`.

## Quality standards

- Every PASS links to evidence produced for this release commit.
- Blockers have an owner and the specific action that would clear them.
- The report is readable by a non-specialist in under five minutes: verdict first.

## Common failures

- Treating "IMPLEMENTED" as ready; skipping VERIFIED.
- Passing the gate on stale reports from an earlier commit.
- No rollback plan, or one never tried.
- Alerts configured but routed nowhere, or never tested.
- Declaring GO while waiting for production deploy authorization that was never given.

## Outputs

- `reports/production-readiness-<date>.md`: verdict (GO / NO-GO), release commit,
  checklist table with evidence, blockers with owners, accepted risks with who accepted.
- Status updates only where evidence supports them.

## Done when

- Every checklist row is PASS, N/A with reason, or FAIL with owner.
- Verdict delivered to the user; accepted risks recorded in `decisions.md`.
- After an authorized deploy, post-launch checks are appended with real output.
