---
name: testing-and-qa
description: >-
  Plans and runs independent quality assurance: re-runs every check instead of trusting
  implementer claims, applies the test pyramid across unit, integration, API, end-to-end,
  browser, visual, accessibility, mobile, desktop, performance, security and database-integrity
  testing, builds an acceptance-criteria traceability matrix, and files reproducible bug
  reports. Use when verifying a task, feature or release, or when asked to "QA", "test",
  "verify" or "check acceptance criteria".
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [qa-agent]
---

# Testing and QA

## Purpose

Establish, with evidence produced by the tester, whether a change meets its acceptance
criteria and has not broken anything else. QA is independent of implementation: the
implementer's report is a list of claims to check, never a result to copy. Only this
independent check can move a task to VERIFIED (`.ship-anything/policies/status-model.md`).

## When to use

- A task reached TESTED and needs independent verification.
- A feature, release candidate or bug fix needs acceptance-criteria sign-off.
- A project has no test strategy and needs one (which layers, which tools, what coverage).
- Before `production-readiness` runs its go-live gate.

Do not use when:
- You are the implementer of the same change in the same session. Hand off to another
  agent or follow single-session rule 3 in the status model.
- The task is writing the fix's own regression test: use `regression-prevention`.
- Only one layer is needed and a dedicated skill exists: `browser-automation`,
  `api-testing`, `visual-regression`, `accessibility-engineering`, `performance-optimization`,
  `security-audit`.

## Inputs

- Task contract (`.ship-anything/templates/task-contract.yaml`) with acceptance criteria.
- Implementer report (`.ship-anything/state/tasks/<id>.md`): files, commands, claimed results.
- The repository at the commit under test; how to run it (scripts, env vars by name only).
- Target platforms: browsers, devices, OS versions, screen sizes, locales.

## Procedure

1. Read the contract and turn each acceptance criterion into one or more observable checks.
   If a criterion is not testable ("fast", "nice"), record it and ask for a measurable form.
2. Record the environment: commit SHA, OS, runtime versions (`node -v`, `python --version`),
   browser versions, dependency lockfile hash.
3. Start from a clean state: fresh install from the lockfile (`npm ci`, `pnpm install
   --frozen-lockfile`, `pip install -r requirements.txt`, `cargo build --locked`), fresh
   test database or fixtures. Never reuse the implementer's running server or build output.
4. Re-run every command the implementer listed. Compare results line by line with the
   report. Any mismatch is a finding, even if the new result is a pass.
5. Run static gates: type check, lint, formatter check, build. Treat warnings introduced by
   the change as findings.
6. Choose layers using the pyramid (Decision rules). Run what exists; add missing tests at
   the lowest layer that can catch the defect.
7. Exercise each acceptance criterion through the real interface (UI, API, CLI), including
   negative paths: invalid input, empty state, unauthorized user, network failure, slow
   network, concurrency, boundary values, large data, unicode, timezone and locale.
8. Run cross-cutting checks in scope: accessibility (axe plus keyboard-only pass), visual
   comparison, responsive breakpoints, performance budget, security smoke (authz on every
   new endpoint), database integrity (constraints, foreign keys, migration up/down on a copy).
9. Exploratory session, time-boxed: try what the criteria did not mention. Log what you tried.
10. Fill the traceability matrix (Outputs). Every criterion maps to a check, a result and
    evidence (log excerpt, screenshot path, trace file).
11. File one bug report per defect (format below). Retest fixes; when a fix lands, re-run
    the affected suite plus a smoke pass of neighbouring features.
12. Verdict per task: VERIFIED only if every criterion passes with evidence and no open
    blocker or high-severity bug remains. Otherwise return it to IN_PROGRESS with bug IDs.

## Decision rules

| Situation | Layer to use |
|---|---|
| Pure logic, parsing, calculations | Unit (most tests live here) |
| Module talks to DB, queue, filesystem | Integration with real dependency in a container or test instance |
| HTTP/GraphQL/RPC contract | API tests (`api-testing`) |
| User journey across pages | E2E in a real browser (`browser-automation`), few and critical |
| Layout or styling change | Visual comparison (`visual-regression`) |
| Any UI change | Automated a11y scan plus manual keyboard and screen-reader spot check |
| Mobile app | Emulator/simulator for breadth, one physical device for touch, perf, permissions |
| Desktop app | Packaged build on each target OS, install/upgrade/uninstall path |
| Latency or throughput criterion | `performance-optimization` load test |
| Auth, input handling, file upload | `security-audit` focused checks |
| Schema or data migration | Migration up, down, up on a production-like copy; row counts and constraints compared |

- Flaky test: rerun to confirm flakiness, quarantine with an issue link, never delete or
  retry-until-green silently.
- Cannot run a check (no device, no credentials): mark it "not run" with the reason.
  Never infer a pass.
- Severity: blocker (no workaround, data loss, security), high (core flow broken), medium
  (workaround exists), low (cosmetic).

## Tools

- Unit/integration: the project's runner (Vitest, Jest, pytest, `go test`, `cargo test`).
- Browser/E2E: Playwright (preferred), Cypress, WebdriverIO.
- Accessibility: axe-core (`@axe-core/playwright`), Lighthouse, pa11y.
- Mobile: XCTest/XCUITest, Espresso, Maestro, Detox. Desktop: Playwright for Electron,
  WebDriver for Tauri.
- Database: the ORM's migration CLI, `pg_dump --schema-only` diffs, constraint queries.
- Optional upstream: `anthropic-webapp-testing` (see .ship-anything/registry.yaml) for
  Playwright-driven webapp checks. Its scripts run only if approved under
  `.ship-anything/policies/external-skills.md`.

## Quality standards

- Every result in the report comes from a command you ran in this session, with output.
- Tests are deterministic: fixed seeds, frozen clocks, no reliance on test order or real
  third-party services (use contract tests or recorded fixtures).
- Assertions check behaviour the user sees or the API returns, not implementation details.
- Each bug is reproducible from its report alone by someone who did not find it.

## Common failures

- Copying "all tests pass" from the implementer report.
- Testing only the happy path the implementer demoed.
- Running against a dev server with hot reload or stale build output instead of a clean build.
- Huge E2E suites covering logic that unit tests could catch faster and more reliably.
- Marking a criterion passed when its check was skipped, or a screenshot was never opened.
- Bundling several defects into one report.

## Outputs

Traceability matrix:

| Criterion | Check (command or steps) | Result | Evidence |
|---|---|---|---|
| AC-1 user can reset password | `npx playwright test reset.spec.ts` | pass 3/3 | `test-results/reset/trace.zip` |

Bug report (one per defect):

```
ID / title:    BUG-012 Checkout total ignores discount when cart has 1 item
Severity:      high
Environment:   commit abc1234, Chrome 131 / macOS 15, staging DB fixture v3
Steps:         1. ... 2. ... 3. ...
Expected:      total = 90.00
Actual:        total = 100.00
Evidence:      screenshot path, log excerpt, failing test name
Frequency:     5/5 attempts
Suspected area: src/cart/total.ts (hypothesis, not confirmed)
```

Agent report per `.ship-anything/templates/agent-report.md` with the verdict per task.

## Done when

- Every acceptance criterion has a row with a real result and evidence, or "not run" plus reason.
- All implementer commands were re-run and discrepancies recorded.
- Every defect has a reproducible bug report and severity.
- Task statuses were updated only where the evidence supports them.
