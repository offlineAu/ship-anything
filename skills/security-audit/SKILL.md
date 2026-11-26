---
name: security-audit
description: >-
  Performs authorized application and infrastructure security reviews mapped to OWASP Top 10
  and OWASP ASVS: threat modelling (STRIDE-lite), authentication, authorization, injection,
  XSS, CSRF, SSRF, file uploads, sessions, secrets and git-history secret scanning,
  dependency vulnerabilities, insecure configuration and sensitive data exposure, with
  reproducible, severity-rated findings. Use for security reviews, pre-release audits,
  "is this secure?", or after auth, payment, upload or infra changes.
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [security-agent]
---

# Security audit

## Purpose

Find exploitable weaknesses before attackers do, and report each one so a developer can
reproduce it, understand its impact and fix it. Findings without evidence are hypotheses
and are labelled as such.

## When to use

- Before a release or go-live (`production-readiness` gate).
- After changes to authentication, authorization, payments, file handling, webhooks,
  tenant isolation, infrastructure or CI permissions.
- When adopting a codebase (`existing-project-audit`) or adding many dependencies.
- When a secret may have been committed.

Do not use when:
- Designing auth from scratch: use `authentication-and-authorization` (then audit it here).
- Reviewing a small diff for general correctness: `code-review` covers its security basics.
- The target is a system the user does not own or is not authorized to test. Stop and say so
  (`.ship-anything/policies/authorization.md`).

## Inputs

- Scope: repositories, environments (local/staging only unless the user authorizes more),
  and explicitly out-of-scope systems.
- Architecture notes, data classification (PII, payment, health), roles and tenants.
- Test accounts per role (secrets by env var name), dependency lockfiles, IaC and CI config.

## Procedure

1. Confirm scope and authorization in writing in `.ship-anything/state/decisions.md`. Active
   testing (sending crafted requests) runs against local or staging only, never production
   without explicit user authorization for that exact activity.
2. Threat model (STRIDE-lite): list assets, entry points, trust boundaries and actors. For
   each entry point ask Spoofing (can identity be faked?), Tampering (can data be altered in
   transit or at rest?), Repudiation (is the action logged?), Information disclosure (what
   leaks?), Denial of service (what is unbounded?), Elevation of privilege (can a role act
   above itself?). Keep it to a table; it drives where to look first.
3. Secret scanning, working tree and full history:
   `gitleaks git --redact -v .` (or `gitleaks detect --redact` on older versions) and
   `trufflehog git file://. --only-verified`. Also check `.env*`, CI variables files, Docker
   layers and build output. On a hit: stop, report the secret's name and location (never the
   value), recommend rotation, and do not rewrite history without authorization
   (`.ship-anything/policies/secrets.md`).
4. Dependency vulnerabilities: `npm audit --omit=dev` (or `pnpm audit`, `yarn npm audit`),
   `pip-audit`, `cargo audit`, `govulncheck ./...`, or `osv-scanner scan source -r .` (v2;
   `osv-scanner -r .` on v1) across ecosystems. For each high or critical issue check whether the vulnerable code path is
   reachable before rating it.
5. Static analysis: `semgrep scan --config auto` (or the project's SAST), plus manual review
   of the hotspots the threat model identified.
6. Work through `references/owasp-checklist.md` for every in-scope area: authentication,
   authorization and role permissions, input validation, output encoding, SQL/NoSQL/command
   injection, XSS, CSRF, SSRF, file uploads, API security, sessions, secrets, configuration,
   data exposure, sensitive logging, access control and infrastructure.
7. Verify each suspected issue with the smallest proof that demonstrates it (e.g. a request
   showing user A reading user B's invoice). Never exfiltrate real data, pivot to other
   systems, run destructive payloads, or attempt denial of service.
8. Rate severity with the rubric below; map each finding to OWASP Top 10 and ASVS.
9. Propose a concrete fix and a regression test for each finding; hand fixes to the owning
   agent, then re-test the fix yourself.

## Decision rules

Severity rubric:

| Severity | Typical criteria | Release impact |
|---|---|---|
| Critical | Unauthenticated RCE, auth bypass, cross-tenant data access, live secret exposed | Blocks release; notify user now |
| High | Authenticated privilege escalation, stored XSS, SQLi, IDOR on sensitive data, SSRF to metadata | Blocks release |
| Medium | Reflected XSS needing interaction, CSRF on non-critical action, missing rate limit on login, verbose errors | Fix or accept with written reason |
| Low | Missing hardening header, weak but non-exploitable config | Backlog |
| Info | Best-practice gap without demonstrated risk | Note only |

- Severity is impact x exploitability in this deployment, not the scanner's label.
- A vulnerable dependency whose code path is unreachable is downgraded, with the reason.
- Unverified findings are labelled "suspected" and cannot be rated above Medium.
- Accepting a risk is the user's decision; record it in `decisions.md`.

## Tools

- Secrets: gitleaks, trufflehog. Dependencies: npm/pnpm audit, pip-audit, cargo audit,
  govulncheck, osv-scanner. SAST: Semgrep, CodeQL. IaC: Checkov, tfsec/Trivy config.
- Containers: `trivy image <image>`, `docker scout cves` (if available).
- DAST against local/staging only: OWASP ZAP baseline (`zap-baseline.py -t <url>`).
- Headers/TLS: `curl -sI`, testssl.sh for authorized hosts.
- Installing a scanner binary is an untrusted executable under the authorization policy;
  prefer tools already present or containerized versions the user approved.

## Quality standards

- Every finding includes: title, severity, OWASP/ASVS mapping, location (file:line or
  endpoint), reproduction steps, evidence (redacted request/response, tool output),
  impact, fix, and regression test idea.
- Secrets never appear in findings, logs or screenshots; redact `sk_live_…`, `AKIA…`, JWTs.
- Scanner output is triaged, not pasted wholesale.

## Common failures

- Testing only as an admin, missing IDOR and role escalation.
- Scanning the working tree but not git history for secrets.
- Reporting raw `npm audit` counts as the security posture.
- Trusting client-side checks (hidden buttons, disabled fields) as authorization.
- Exploiting beyond what proves the issue, or testing production without authorization.

## Outputs

- `reports/security-audit-<date>.md`: scope, threat model table, findings ordered by
  severity, tool versions and commands run, items not covered and why.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Threat model, secret scan (including history), dependency scan and checklist pass are
  complete for the agreed scope, with commands and outputs recorded.
- Each finding is reproducible with evidence, rated and mapped.
- Critical and high findings are fixed and re-tested, or the user explicitly accepted them.
