---
name: browser-automation
description: >-
  Drives real browsers to test and inspect web apps: end-to-end user journeys, cross-browser
  runs, screenshots, traces, network mocking, console-error capture and accessibility scans,
  preferring Playwright with resilient role-based locators. Use when writing or running E2E
  tests, reproducing a UI bug, checking a page actually renders, or capturing browser
  evidence for QA, performance or frontend work.
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [frontend-agent, performance-agent, qa-agent]
---

# Browser automation

## Purpose

Produce trustworthy evidence of how a web app behaves in a real browser: journeys that
pass or fail for the right reason, screenshots that were actually captured and looked at,
and traces that let someone else replay the failure.

## When to use

- Writing or maintaining E2E tests for critical user journeys.
- Reproducing a reported UI bug or confirming a fix in a browser.
- Verifying that a page renders without console errors after a change.
- Capturing screenshots, traces or HAR files as QA or performance evidence.
- Running a Lighthouse or Web Vitals measurement in a controlled browser.

Do not use when:
- The behaviour can be tested at unit or API level; test it there instead (`testing-and-qa`).
- The goal is pixel-diff baselines across many components: use `visual-regression`.
- Scraping third-party sites, bypassing logins, CAPTCHAs or bot protection, or automating
  accounts the user does not own. These are out of scope.
- Testing a native mobile or desktop UI: use that platform's driver.

## Inputs

- App URL or the command that starts it (`npm run build && npm run start`).
- Journeys or acceptance criteria to cover; test accounts and fixtures (secrets by env name).
- Target browsers and viewports (default: Chromium, Firefox, WebKit; 375x812 and 1440x900).

## Procedure

1. Check for an existing setup: `playwright.config.*`, `cypress.config.*`, `wdio.conf.*`.
   Extend it rather than adding a second framework.
2. If none exists, add Playwright: `npm init playwright@latest` (pins `@playwright/test` in
   devDependencies), then `npx playwright install --with-deps chromium` locally. Installing
   browsers is pre-authorized as a dev dependency; global installs are not.
3. Configure `webServer` to build and start the app (production build, not dev mode, for
   E2E and performance), `baseURL`, `trace: 'on-first-retry'`, `screenshot:
   'only-on-failure'`, and projects per browser and viewport.
4. Write each journey as a test: arrange state via API or fixtures, act through the UI,
   assert on what the user sees. Use `getByRole`, `getByLabel`, `getByText`, then
   `getByTestId`. Avoid CSS/XPath tied to layout.
5. Rely on auto-waiting assertions (`await expect(locator).toBeVisible()`); never
   `waitForTimeout`. Wait for specific network responses with `page.waitForResponse`.
6. Fail on unexpected console errors and failed requests: collect `page.on('console')` and
   `page.on('requestfailed')` in a fixture and assert the list is empty at test end.
7. Isolate tests: new browser context per test, reuse login via `storageState` produced by a
   setup project, unique test data per run.
8. Mock only third-party services you do not control (`page.route`); keep the app's own API
   real for E2E.
9. Add an accessibility scan per key page: `new AxeBuilder({ page }).analyze()` and assert
   no serious or critical violations.
10. Run: `npx playwright test --project=chromium` while iterating, then all projects. Repeat
    new tests with `--repeat-each=5` to catch flakiness before declaring them done.
11. On failure open the trace (`npx playwright show-trace <trace.zip>`), find the first
    divergence and report it with the trace path.
12. For screenshots used as evidence, open each image and describe what it shows. An image
    file that exists is not proof the page rendered correctly.

## Decision rules

| Need | Choice |
|---|---|
| New project, cross-browser | Playwright |
| Existing Cypress suite | Stay on Cypress; do not migrate without a task |
| Locator choice | role > label > text > test id > CSS |
| Login in every test | Setup project + `storageState` |
| Flaky test | Find the race (trace), fix the wait; quarantine with issue link if blocked |
| Third-party payment/maps/analytics | Route-mock in E2E; test the real integration in a sandbox separately |
| Performance measurement | Production build, throttled CPU/network profile stated in the report |

## Tools

- Playwright (`@playwright/test`), Playwright MCP if the host provides it, Cypress,
  WebdriverIO, Puppeteer for scripted capture.
- `@axe-core/playwright` for accessibility; Lighthouse CLI (`npx lighthouse <url>
  --output=json`) for lab metrics.
- Optional upstream: `anthropic-webapp-testing` (see .ship-anything/registry.yaml) for
  Playwright-based webapp testing patterns.

## Quality standards

- No fixed sleeps; no `force: true` clicks to get past overlays without a reason recorded.
- Each test runs alone and in any order; parallel-safe data.
- Failures produce a trace or screenshot path in the report.
- Browser and viewport matrix stated with every result.

## Common failures

- Testing against `next dev`/`vite` dev servers and reporting production behaviour.
- Selectors bound to generated class names that break on every style change.
- Retries configured high enough to hide real flakiness.
- Claiming "renders correctly" from a screenshot that was never viewed, or from a
  successful navigation alone.
- Swallowing console errors and 4xx/5xx responses that signal broken features.

## Outputs

- Test files under the project's E2E directory and config changes.
- Run results: command, browsers, pass/fail counts, flaky count, trace/screenshot paths.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Every assigned journey has a test that passes on all target browsers in the run you made.
- New tests passed `--repeat-each=5` without flakes.
- Console-error and accessibility assertions are in place for the covered pages.
- Evidence paths are in the report and screenshots were inspected.
