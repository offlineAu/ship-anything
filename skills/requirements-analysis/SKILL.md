---
name: requirements-analysis
description: >-
  Converts a request or product brief into testable requirements: functional and
  non-functional requirements, measurable acceptance criteria, edge cases, dependencies and
  explicit out-of-scope items that task contracts and QA can validate. Use when planning any
  task beyond a trivial edit, writing task contracts, clarifying ambiguous requests, or
  when QA needs criteria to verify against.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [orchestrator, product-director]
---

# Requirements analysis

## Purpose

Make "done" checkable before work starts. Every task leaves this skill with acceptance
criteria that an independent agent can verify with a command, a test, or an observable
behaviour.

## When to use

- After product discovery, before architecture and task contracts.
- When a request is ambiguous ("make it faster", "add login").
- When writing `acceptance_criteria` and `validation` in a task contract.
- When QA reports a dispute about whether something meets the requirement.

Do not use when:
- The change is a typo or one-line fix with self-evident verification.
- The open question is *what product to build* — run `product-discovery` first.

## Inputs

- User request; `docs/product-brief.md`; existing behaviour (code, tests, docs).
- Constraints from ADRs and policies.

## Procedure

1. **Extract requirements** as atomic statements: one behaviour each, numbered `FR-n`
   (functional) and `NFR-n` (performance, security, accessibility, reliability, compatibility).
2. **Write acceptance criteria** per requirement, `AC-n`, in Given/When/Then or as a
   checkable assertion. Each must name how it is verified: test command, e2e scenario,
   manual step with expected observation, or metric with threshold.
3. **Use standard thresholds** where the user gave none and the domain has one:
   WCAG 2.2 AA (text contrast 4.5:1, large text 3:1); Core Web Vitals "good" at p75
   (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1). Otherwise, do not invent numeric targets;
   record `ASSUMPTION:` with the chosen value or leave it to the user.
4. **Enumerate edge cases** per journey: empty, loading, error, offline/timeouts,
   permission denied, duplicate submit, very large input, concurrent edits, locale/timezone,
   unauthenticated access. Keep those that matter to the MVP.
5. **Security and data requirements** when risk flags apply: authz rules per role,
   PII handling, input validation, audit needs. Route to security-agent review.
6. **Out of scope**: list explicitly what will not be done (prevents scope creep and
   false "missing feature" bugs).
7. **Dependencies**: external services, data, credentials, design inputs; mark blocking ones.
8. **Trace**: map each AC to a journey (brief) and later to the task(s) that implement it.
9. **Review for testability**: reject words like "fast", "intuitive", "robust", "secure"
   unless paired with a check.
10. **Record** in `docs/product-brief.md#acceptance-criteria` (product-level) and in each
    task contract (task-level subset).

## Decision rules

| Vague phrase | Rewrite as |
|---|---|
| "fast" | metric + threshold + measurement method, or ASSUMPTION |
| "secure login" | concrete rules: hashing, session expiry, rate limit, lockout, CSRF, tested how |
| "works on mobile" | viewports/devices + journeys that must pass on them |
| "user-friendly" | specific states and flows that must exist, with a11y checks |
| Conflicting requirements | Surface both; orchestrator/product-director decides; record in decisions.md |

## Tools

- `.ship-anything/templates/product-brief.md`, `.ship-anything/templates/task-contract.yaml`.
- Existing tests as executable specs (`rg -n "describe\(|it\(|def test_" tests/`).

## Quality standards

- Every AC is verifiable by someone other than the implementer.
- Every MVP journey has at least one AC; every AC traces to a requirement.
- Numeric targets are user-given, standard, or labelled assumptions.
- Out-of-scope list exists.

## Common failures

- ACs that restate the feature name ("user can log in") without verification method.
- Missing error/empty states, discovered only in QA.
- Invented performance numbers presented as requirements.
- Requirements that prescribe implementation (a framework) without reason.

## Outputs

- Numbered FR/NFR and AC lists, edge cases, out-of-scope list, dependencies.
- Task-level acceptance criteria and validation commands in contracts.

## Done when

- Each planned task has measurable acceptance criteria with a named verification method,
  and scope boundaries are explicit.
