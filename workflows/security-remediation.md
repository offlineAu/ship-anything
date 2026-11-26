---
name: security-remediation
description: >-
  Triages and fixes security findings (audit reports, scanner output, pentest results,
  leaked secrets, gate failures): dedupe and rank, reproduce safely, fix by the owning
  agent with regression tests, independent re-verification, and coordinated release.
  Credential rotation and production changes are authorization-gated.
level: [L2, L3]
required_agents: [security-agent, qa-agent]
optional_agents: [backend-agent, frontend-agent, database-agent, infrastructure-agent, mobile-agent, release-agent, documentation-agent]
required_skills: [security-audit, authentication-and-authorization, regression-prevention, code-review]
composes: [production-release]
---

# Security remediation

## Purpose

Close security findings with proof: each fixed finding has a reproduction that no longer
works, a regression test that keeps it fixed, and an independent re-check. Nothing is
"fixed" because a scanner went quiet.

## When to use

- Security gate failed in another workflow (high/critical open).
- User supplies an audit/pentest report, scanner output, CVE alert, or suspects compromise.
- A secret was found in source or history.

Do not use when: general hardening with no findings (→ security review inside the build
workflow); suspected active breach in production → tell the user immediately, recommend
their incident process; agents only assist with analysis under authorization.

## Inputs

- Findings (report, scanner JSON, issue list) and the affected repo/environments.
- Severity rubric (CVSS if provided; else security-agent's critical/high/medium/low with reasons).
- Constraints: release windows, supported versions.

## Agents

- `security-agent` (required): triage, reproduction, fix specs, re-verification, sign-off.
- `qa-agent` (required): regression suite and functional verification after fixes.
- Implementers by file ownership only (backend, frontend, database, infrastructure, mobile).
- `release-agent` (optional): patch release via production-release.

## Skills and tools

`security-audit`, `authentication-and-authorization`, `regression-prevention`, `code-review`;
optional `api-testing`, `ci-cd`. Tools where available: `npm audit --audit-level=high`,
`pip-audit`, `cargo audit`, `osv-scanner`, `semgrep`, `gitleaks detect`, framework-specific
linters. Run against local/test environments only.

## Task graph

```
id     agent              objective                                    depends_on      wave  owns
SR-01  security-agent     intake: dedupe, map to code locations,       -               1     docs/security/findings.md
                          severity with reasoning, exploitability
SR-02  security-agent     SECRET CHECK: any exposed secret → stop,     -               1     docs/security/secrets-incident.md
                          inform user, rotation request (auth-gated)
SR-03  security-agent     reproduce each high/critical locally/test;   SR-01           2     tests/security/repro/**
                          write failing test or documented PoC
SR-04  security-agent     fix spec per finding (root cause, approach,  SR-03           2     docs/security/fixes/**
                          blast radius)
SR-05  owning agents      implement fixes; repro test now passes;      SR-04           3     per finding (disjoint)
                          no behaviour change beyond the fix
SR-06  orchestrator       dependency upgrades (lockfile owner);        SR-01           3     manifests, lockfiles
                          changelog review of each bump
SR-07  orchestrator       integration: build + full test suite         SR-05, SR-06    4     configs
SR-08  security-agent     re-verify every finding; re-run scanners;    SR-07           5     docs/security/**
                          check fix variants (bypass attempts)
SR-09  qa-agent           full regression + acceptance of affected     SR-07           5     tests/**
                          features
SR-10  documentation-agent / release-agent: advisory/changelog,        SR-08, SR-09    6     CHANGELOG.md, SECURITY.md
       → production-release when deploy in scope
```

Ordering: critical → high → medium; lows batched or backlogged with user agreement.

## Parallel opportunities

- SR-01 ∥ SR-02 (triage vs secret check).
- Fixes (SR-05) in parallel when they touch disjoint files; SR-06 alongside since only the
  orchestrator edits manifests/lockfiles.
- SR-08 ∥ SR-09 (security re-verify vs functional regression).

## Sequential requirements

- Reproduce before fixing (no blind patches); fix spec before implementation.
- Re-verification by security-agent, not by the implementer.
- Rotating credentials, rewriting git history, changing IAM, or deploying patches → explicit
  authorization each (`policies/authorization.md`).
- Security gate passed before the release that ships the fixes.

## Acceptance criteria

- Every high/critical finding is fixed and re-verified, or explicitly risk-accepted by the
  user (recorded with reason and owner).
- Each fix has a regression test that fails on the pre-fix code and passes after.
- Exposed secrets: user informed, rotation recommended; repo contains no live secret values.
- No functional regressions (baseline tests still pass).

## Quality gates

- Repro tests pass after the fix; scanners re-run with 0 open high/critical (or waivers recorded).
- Dependency audit at `high` level clean or each remaining item waived with justification
  (no fix available, not reachable — with evidence).
- `gitleaks detect` (or equivalent) on the working tree clean.
- Full test suite and build green; qa-agent checklist signed.

## Deliverables

`docs/security/findings.md` with status per finding, fix specs, regression tests, scanner
before/after summaries (secrets redacted), advisory/changelog entry, release report if shipped.

## Completion conditions

Each finding: VERIFIED (re-verified by security-agent) or DESCOPED/accepted by the user.
Fixes reaching production → DEPLOYED via authorized release; SHIPPED once the deployed
version is confirmed and post-deploy checks pass. Unrotated exposed secrets keep the
workflow BLOCKED until the user confirms rotation.

## Failure recovery

| Failure | Recovery |
|---|---|
| Cannot reproduce | Check version/config differences; if still not reproducible, document analysis and treat as fixed only with defensive change + test |
| Fix breaks functionality | Revert fix, refine spec (narrower validation, compat layer), retry once; escalate |
| Upgrade has breaking changes | Patch-level/backported fix if available; else isolated upgrade task with tests |
| No upstream fix for vulnerable dep | Mitigate (disable feature, input filter, replace dep); record risk acceptance by user |
| Bypass found in re-verification | Finding back to IN_PROGRESS; fix root cause, not the specific payload |
| Secret in git history | Do not rewrite history without authorization; rotation is the real fix |
