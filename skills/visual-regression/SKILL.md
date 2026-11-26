---
name: visual-regression
description: >-
  Sets up and runs screenshot-based visual regression testing: baseline screenshots
  (e.g. Playwright toHaveScreenshot), deterministic rendering with pinned fonts, disabled
  animations, frozen time and fixture data, sensible diff thresholds, masking of dynamic
  regions, CI integration and a human review protocol for baseline updates. Use to catch
  unintended UI changes across components, pages, themes and viewports.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent, qa-agent]
---

# Visual Regression

## Purpose

Detect unintended visual changes automatically, with tests stable enough that a failure
means something changed, and a review protocol that prevents bad baselines from being
accepted silently.

## When to use

- A design system or app with stable screens that must not drift.
- Before refactors of CSS, tokens, component libraries or framework upgrades.
- Capturing an approved design state after a `ui-ux-design` review.

Do not use when:

- The UI is still changing daily (prototype phase); baselines would churn.
- Verifying behaviour or data → `testing-and-qa` / `browser-automation`.
- Judging aesthetic quality; visual regression only detects change, not quality.

## Inputs

- Running app or Storybook; list of pages/components, themes and viewports to cover.
- Fixture data and a way to start the app in a deterministic test mode.
- CI environment details (OS image, browsers).

## Procedure

1. **Pick scope.** Primary pages and design-system components; light and dark; 375px and
   1280px. Prefer component-level shots (Storybook stories) plus a few full pages.
2. **Make rendering deterministic.**
   - Same OS and browser for baseline and comparison (run in the CI container image, or
     Playwright's Docker image locally); font rendering differs across OSes.
   - Self-host or install fonts; wait for `document.fonts.ready`.
   - Disable animations: Playwright `animations: 'disabled'`, plus CSS
     `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent; }`
     injected via `stylePath`.
   - Freeze time (`page.clock.setFixedTime(...)` or app-level clock), seed random, use
     fixture data and network mocks (`page.route`).
   - Mask volatile regions (`mask: [locator]`): avatars from remote, ads, maps, timestamps.
3. **Write tests.** Example:
   ```ts
   await page.goto('/settings');
   await page.evaluate(() => document.fonts.ready);
   await expect(page).toHaveScreenshot('settings-light-desktop.png', {
     fullPage: true, animations: 'disabled', mask: [page.getByTestId('avatar')],
     maxDiffPixelRatio: 0.01,
   });
   ```
4. **Thresholds.** Start strict (`threshold` default 0.2 per-pixel color tolerance, small
   `maxDiffPixels`/`maxDiffPixelRatio`), loosen per test only with a recorded reason.
   Never set a global loose threshold to silence flakiness.
5. **Generate baselines** with `npx playwright test --update-snapshots` in the canonical
   environment; commit baselines with the change that produced them.
6. **Stabilise.** Run the suite 3× consecutively; any test that fails without code changes
   is flaky — fix the nondeterminism before relying on it.
7. **CI.** Run on pull requests; upload diff images (`test-results/`) as artifacts.
8. **Review protocol.** On failure: open expected/actual/diff images. Classify each as
   regression (fix code) or intended (update baseline). Baseline updates require the
   diff images to be reviewed and listed in the report/PR, with the reason per image.

## Decision rules

| Situation | Decision |
|---|---|
| Diff limited to anti-aliasing noise | Fix environment mismatch first; per-test threshold only as last resort |
| Intended design change | Update only affected baselines; list them with reasons |
| Unexplained diff | Treat as regression until explained |
| Dynamic content unavoidable | Mask it or replace with fixture |
| Cross-browser coverage needed | Separate baselines per browser project; no shared images |
| Hosted service (Chromatic, Percy, Argos) already used | Use it; same determinism rules apply |

## Tools

- Playwright Test (`toHaveScreenshot`, `--update-snapshots`), Storybook test runner.
- Hosted alternatives if already in the repo: Chromatic, Percy, Argos (paid tiers need
  user authorization per `.ship-anything/policies/authorization.md`).
- Optional upstream: `anthropic-webapp-testing` (see .ship-anything/registry.yaml) — Playwright patterns.

## Quality standards

- Suite passes 3× consecutively with no code change.
- Baselines generated in the same environment CI uses.
- Every baseline update in a change is listed with a reason and reviewed diff.
- Thresholds documented per test where non-default.

## Common failures

- Baselines generated on macOS, compared on Linux CI.
- Blanket `--update-snapshots` to make CI green, accepting real regressions.
- Animations or web fonts still loading at capture time.
- Full-page shots of pages with live data, producing constant noise.
- Hundreds of near-duplicate screenshots nobody reviews.

## Outputs

- Test files and committed baseline images.
- CI configuration for running and uploading diffs.
- Review notes for any baseline change.
- Agent report per `.ship-anything/templates/agent-report.md` with run output cited.

## Done when

- Suite covers agreed scope, passes 3× consecutively in the canonical environment
  (output cited), and runs in CI (or the report states CI is not configured).
- Status follows `.ship-anything/policies/status-model.md`.
