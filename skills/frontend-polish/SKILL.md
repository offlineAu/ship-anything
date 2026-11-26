---
name: frontend-polish
description: >-
  Final-mile UI refinement of a working frontend: alignment and spacing rhythm, type
  details, states, edge cases with worst-case data, micro-interactions, layout shift,
  perceived performance and consistency with the design direction, verified on rendered
  screenshots. Use after a feature works but feels rough, unfinished or inconsistent, or
  before a demo or release.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [frontend-agent]
---

# Frontend Polish

## Purpose

Close the gap between "it works" and "it feels finished": remove visual noise, fix edge
cases and rough states, and make the interface consistent with its design direction
without changing scope.

## When to use

- A feature is functionally complete and passes tests but looks or feels rough.
- Pre-demo or pre-release pass over primary screens.
- Review findings from `ui-ux-design` list minor/major visual issues to fix.

Do not use when:

- The feature does not work yet → `frontend-development`.
- No design direction exists and the UI needs one → `ui-ux-design`.
- The request is a redesign (new layout, new visual language) → `ui-ux-design`.
- The issue is accessibility conformance → `accessibility-engineering` (polish still
  must not regress it).

## Inputs

- Running app and the screens in scope.
- `docs/design-direction.md` and token files.
- Any review findings list.

## Procedure

1. **Capture before.** Screenshot each screen in scope at 375px and ≥1280px, light and
   dark, to `docs/design/polish/before/`.
2. **Stress with worst-case data.** Long names, 0 items, 1 item, 1,000 items, missing
   images, slow network (DevTools throttling), errors from the API, RTL or long-word
   locales if supported. Note every break.
3. **Rhythm and alignment.** Snap spacing to the token scale; align to a shared edge;
   consistent gaps between related vs unrelated groups; remove one-off margins.
4. **Typography details.** Correct scale steps, no orphaned single words in headings
   where `text-wrap: balance` fits, tabular numbers (`font-variant-numeric: tabular-nums`)
   for changing figures, truncation with full text available (tooltip or expand).
5. **States.** Every interactive element has hover, focus-visible, active, disabled and
   loading; buttons keep width when showing a spinner; forms show inline validation.
6. **Layout stability.** Reserve space for images (`width`/`height` or `aspect-ratio`),
   skeletons match final layout, fonts use `font-display` with metric-compatible fallback.
   Target CLS ≤ 0.1.
7. **Feedback and micro-interactions.** Immediate response to input (pressed states,
   optimistic UI where safe), short transitions per motion tokens; respect reduced motion.
8. **Icons and imagery.** One icon set, consistent stroke and size; no emoji standing in
   for icons; images sized and compressed.
9. **Copy.** Verbs on buttons, specific error messages with recovery, consistent
   capitalisation.
10. **Capture after** to `docs/design/polish/after/` and compare pairs. Run lint, tests
    and an axe scan to confirm nothing regressed.

## Decision rules

| Situation | Decision |
|---|---|
| Fix needs a new token | Ask ux-agent / record decision; do not invent values inline |
| Polish would change behaviour or scope | Stop; raise in report |
| Two components look alike but differ slightly | Converge on the design-system version |
| Animation added for delight | Only if it communicates state; keep within motion tokens |
| Time-boxed | Fix blockers on primary journeys first, then most-visible screens |

## Tools

- Browser DevTools (layout overlay, throttling, rendering panel for layout shift).
- Playwright or host browser tool for screenshots.
- Optional upstream: `impeccable` (see .ship-anything/registry.yaml) — `polish`/`audit`/`harden` vocabulary; hooks and live mode off by default.
- Optional upstream: `emil-kowalski-skills` (see .ship-anything/registry.yaml) — `break-ui`, `emil-design-eng` for interaction details.
- Design stack rule from `ui-ux-design`: at most two supporting skills, one end-of-turn design check.

## Quality standards

- Before/after screenshots exist for every screen touched.
- No regressions: tests, lint and axe results equal or better than before.
- Spacing, color and type values come from tokens.
- Worst-case data cases listed and each handled or reported.

## Common failures

- Polishing only the happy path with ideal demo data.
- Introducing raw values or one-off components while "tweaking".
- Adding motion everywhere; ignoring reduced motion.
- Spinner swaps causing buttons and rows to jump.
- Declaring polish done from code review without rendering.

## Outputs

- Code changes in owned files.
- `docs/design/polish/before/` and `after/` screenshots.
- List of edge cases found and their resolution.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- All in-scope screens rendered and compared before/after with files cited.
- Worst-case data cases handled or reported.
- Tests, lint and axe scan pass with outputs cited.
- Status follows `.ship-anything/policies/status-model.md`.
