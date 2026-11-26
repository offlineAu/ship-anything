---
name: accessibility-engineering
description: >-
  Builds and audits interfaces to WCAG 2.2 AA: semantic HTML, keyboard operation, visible
  focus, ARIA only when native semantics fall short, contrast, reduced motion, target size,
  forms and announcements, verified with automated tools (axe-core, Lighthouse) plus manual
  keyboard and screen-reader checks. Use for a11y requirements, audits, fixes, and before
  shipping any user-facing UI.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent, frontend-agent, mobile-agent, motion-agent, qa-agent]
---

# Accessibility Engineering

## Purpose

Make the product usable by people who navigate with keyboards, screen readers, zoom,
voice control or reduced motion, and prove it with evidence rather than a passing
automated score.

## When to use

- Specifying accessibility requirements for new UI.
- Implementing or reviewing components, forms, dialogs, menus, custom widgets.
- Auditing an existing product against WCAG 2.2 AA.
- Before a release gate for any user-facing surface.

Do not use when:

- The work has no user-facing surface (CLI internals, backend jobs).
- Only a legal compliance opinion is requested — that needs a qualified human; this
  skill gives engineering findings, not legal conformance statements.
- Native mobile-only specifics beyond web concepts dominate; use platform guidelines
  (iOS Accessibility, Android Accessibility) via `mobile-development` alongside this.

## Inputs

- Running app URL or component sources; the list of primary user journeys.
- `docs/design-direction.md` (tokens, focus style, motion rules).
- Target standard (default WCAG 2.2 AA) and any stricter contractual requirement.

## Procedure

1. **Semantics first.** Use native elements: `<button>`, `<a href>`, `<label>`, `<input>`,
   `<dialog>`, landmarks (`header`, `nav`, `main`, `footer`), one `h1` and ordered headings.
   Add ARIA only when no native element fits; follow the ARIA Authoring Practices pattern
   for that widget exactly. No ARIA is better than wrong ARIA.
2. **Keyboard.** Every interactive element reachable with Tab, operable with Enter/Space
   (and arrows for composite widgets), no keyboard traps, Escape closes overlays, focus
   order matches visual order. Provide a skip link on content-heavy pages.
3. **Focus.** Visible `:focus-visible` indicator with ≥3:1 contrast against adjacent
   colors; focus not hidden behind sticky headers (WCAG 2.4.11). Move focus into opened
   dialogs and return it to the trigger on close.
4. **Contrast.** Text ≥4.5:1, large text (≥24px or ≥18.66px bold) ≥3:1, UI components and
   graphics ≥3:1, in every theme and state (hover, disabled excluded per WCAG).
5. **Forms.** Programmatic labels, `autocomplete` tokens, error text tied via
   `aria-describedby`, errors announced and not by color alone, no CAPTCHA-only or
   memory-test-only authentication (WCAG 3.3.8), no re-entry of already-given data (3.3.7).
6. **Dynamic content.** Status messages via `role="status"`/`aria-live="polite"`; loading
   states announced; route changes move focus or announce the new page title.
7. **Media and images.** Meaningful `alt`; decorative images `alt=""`; captions for video
   with speech; no autoplaying audio.
8. **Motion.** Honour `prefers-reduced-motion: reduce` (remove or replace large movement,
   parallax, autoplay); nothing flashes more than three times per second.
9. **Target size.** Pointer targets ≥24×24 CSS px or sufficiently spaced (WCAG 2.5.8);
   drag interactions have a single-pointer alternative (2.5.7).
10. **Zoom and reflow.** Usable at 200% zoom and at 320 CSS px width without
    two-dimensional scrolling (1.4.10); text spacing overrides do not break layout.
11. **Automated checks.** Run axe-core (e.g. `@axe-core/playwright` in tests, or
    `npx @axe-core/cli <url>`) and Lighthouse accessibility
    (`npx lighthouse <url> --only-categories=accessibility --output=json`). Save output.
12. **Manual checks.** Keyboard-only walkthrough of each primary journey; one screen-reader
    pass (VoiceOver on macOS/iOS, NVDA on Windows, TalkBack on Android) of the key flow;
    200% zoom; reduced-motion setting on. Record what was actually tested.
13. **Report** findings with WCAG success criterion, severity, location, reproduction,
    fix; save evidence (tool JSON, screenshots).

## Decision rules

| Situation | Decision |
|---|---|
| Native element exists | Use it; restyle rather than rebuild |
| Custom widget unavoidable | Follow the APG pattern: roles, states, keyboard map |
| Automated scan passes | Still run manual checks; automation catches only a subset of issues |
| Brand color fails contrast | Propose an accessible shade; escalate if brand owner objects |
| Screen reader not available | Mark that check "not performed"; never imply it was done |
| Third-party widget fails | Report it with the vendor; wrap or replace if it blocks a primary journey |

## Tools

- axe-core (`@axe-core/playwright`, `@axe-core/cli`), Lighthouse, eslint-plugin-jsx-a11y.
- Browser accessibility tree inspector; contrast checker.
- Screen readers: VoiceOver, NVDA, TalkBack (manual).
- Optional upstream: `anthropic-webapp-testing` (see .ship-anything/registry.yaml) — Playwright harness for automated runs.

## Quality standards

- Zero critical/serious axe violations on primary journeys, with saved output.
- Every primary journey completed keyboard-only, recorded step by step.
- Report states explicitly which manual checks were and were not performed.
- Never describe a product as "WCAG compliant" based on automated results alone;
  automated tools detect only a portion of WCAG failures.

## Common failures

- `div` with `onClick` instead of `button`; `role="button"` without key handling.
- `outline: none` with no replacement focus style.
- `aria-label` overriding visible text, breaking voice control (2.5.3 Label in Name).
- Modal without focus trap or focus return; toasts not announced.
- Placeholder used as the only label.
- Reduced-motion handled for CSS but not for JS-driven animation.

## Outputs

- Requirements section for `docs/design-direction.md` (accessibility line items).
- Audit report: findings table (criterion, severity, location, evidence, fix).
- Automated tool output files (JSON/HTML) at the path in the task contract.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Automated scans run and saved; no critical/serious violations on primary journeys,
  or each remaining one is reported with a reason.
- Manual keyboard pass completed for each primary journey; screen-reader, zoom and
  reduced-motion checks completed or explicitly marked not performed.
- Status follows `.ship-anything/policies/status-model.md`.
