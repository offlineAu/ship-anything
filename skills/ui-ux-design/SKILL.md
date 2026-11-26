---
name: ui-ux-design
description: >-
  Derives a product-specific visual and UX direction from audience, industry, purpose and
  brand, then specifies typography, color (light and dark, contrast-checked), spacing,
  layout, components, loading/empty/error states and mobile usability, and reviews the
  rendered UI via screenshots. Use for new user-facing surfaces, redesigns, "the UI looks
  generic" complaints, design direction documents and rendered design reviews.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent]
---

# UI/UX Design

## Purpose

Give a product an intentional, recognisable interface that fits the people who use it,
written down precisely enough that two implementers would build visibly similar UI, and
then confirm the built result against that direction by looking at it.

## When to use

- A new product, screen or flow needs a visual and interaction direction.
- An existing UI is being redesigned, restyled or called "generic", "AI-looking", "bland".
- A design direction document (`docs/design-direction.md`) must be created or updated.
- Built UI must be reviewed against its direction (rendered review).

Do not use when:

- The task is only implementing an already-specified component → `frontend-development`.
- The task is token plumbing, theming infrastructure or component APIs → `design-system-engineering`.
- The task is a WCAG audit → `accessibility-engineering`; animation → `motion-design`.
- The change is a copy tweak or a bug with no visual decision involved.
- A marketing site is being built with the optional taste-skill profile as lead (see Decision rules).

## Inputs

- `docs/product-brief.md` (audience, jobs-to-be-done, platforms) and the task contract.
- Brand assets if any: logo, colors, fonts, voice guide, existing design system.
- Existing UI: running app URL, screenshots, or component paths.
- Constraints: framework/component library already in use, licensing limits on fonts/assets.

## Procedure

1. **Read context.** Brief, journeys, brand assets, existing UI. If a UI exists, start the
   dev server and capture current screenshots at 375px and ≥1280px before proposing anything.
2. **Profile the audience.** Who, where, which device, how often, in what mood, what they
   are trying to finish. Industry conventions that carry trust (e.g. finance: density and
   restraint; consumer creative tools: expressive type) are inputs, not defaults to copy.
3. **Choose a personality** of three words and name 2–4 real references with the specific
   thing to borrow from each (e.g. "Linear's keyboard-first density", not "Linear's vibe").
   Name anti-references explicitly.
4. **Typography.** Pick display/text/mono families with a stated license source (system,
   Google Fonts/OFL, or user-licensed). Define a modular scale, line-heights (body ≈1.4–1.6),
   measure (≈45–75 characters for reading text) and weights in use. Avoid the default of
   one sans for everything unless the reason is stated.
5. **Color.** Define semantic tokens (bg, surface, text, muted, border, accent, danger,
   warning, success, focus) for light and dark. Check each text/background pair: ≥4.5:1
   normal text, ≥3:1 large text and non-text UI (WCAG 2.2 AA). Record tool and ratios.
   Never convey meaning by color alone.
6. **Spacing and layout.** Base unit (4 or 8 px), spacing scale, grid, content max-width,
   density level, breakpoints. Decide where structure comes from: whitespace, rules,
   typography, or containers. Do not wrap every block in a card.
7. **Shape and depth.** Radii scale, border vs shadow strategy, elevation levels with purpose.
8. **Components.** Choose a library (or custom) with a reason. For each component list
   states: default, hover, focus-visible, active, disabled, loading, error, selected.
9. **Screen states.** For every screen specify loading (skeleton vs spinner and when),
   empty (why it is empty + next action), error (cause + recovery), partial data, long
   content/overflow, and success feedback. Write the microcopy.
10. **Mobile usability.** Thumb reach for primary actions, targets ≥24×24 CSS px
    (WCAG 2.5.8) with 44×44 preferred for primary touch actions, no hover-only affordances,
    input types/autocomplete set, safe areas.
11. **Write the direction** to `docs/design-direction.md` using
    `.ship-anything/templates/design-direction.md`. Specs reference token names, never raw hex.
12. **Rendered review** (after build). When a browser or screenshot tool exists: open the
    app at 375px and ≥1280px in light and dark, capture screenshots to `docs/design/review/`,
    do a keyboard-only pass, and compare against the direction. Record findings as
    blocker/major/minor with screenshot path, location, expected vs actual.
    If no rendering tool is available, write "not visually reviewed" in the report.

## Decision rules

| Situation | Decision |
|---|---|
| Existing brand/design system present | Extend it; change only with a stated reason or user request |
| No brand, B2B tool used daily | Prioritise density, legibility, keyboard flow; restrained accent |
| Consumer / marketing surface | More expressive type and imagery; still contrast-checked |
| Dashboard requested | Show the 1–3 numbers that drive a decision; no tiles for numbers nobody acts on |
| Generic patterns (purple/indigo gradient, all-cards layout, Inter everywhere, glassmorphism, emoji icons, centred hero + 3 feature cards) | Use only with a stated reason tied to audience or brand |
| Paid font or asset needed | Escalate to user; never assume a license |
| Brand conflicts with accessibility | Adjust shade to pass contrast, record the deviation, inform user |

**Design stack rule:** one lead skill per UI task — `anthropic-frontend-design` by default,
or `taste-skill` for marketing/landing sites (instead of, not alongside) — plus at most two
supporting skills (`impeccable` for critique/audit, `emil-kowalski-skills` for motion).
At most one end-of-turn design check. One direction format:
`.ship-anything/templates/design-direction.md`.

## Tools

- Browser automation / screenshot tool (Playwright, the host's browser tool) for rendered review.
- Contrast checker: any WCAG ratio calculator or a script using the WCAG relative-luminance formula.
- Optional upstream: `anthropic-frontend-design` (see .ship-anything/registry.yaml) — lead for aesthetic direction.
- Optional upstream: `impeccable` (see .ship-anything/registry.yaml) — critique/audit/polish; hooks and live mode stay off unless the user enables them.
- Optional upstream: `ui-ux-pro-max` (see .ship-anything/registry.yaml) — palette/font-pairing data; its picks may conflict with the lead skill, the lead wins.
- Optional upstream: `taste-skill` (see .ship-anything/registry.yaml) — marketing-site lead only.
- External skills are enabled only through `.ship-anything/policies/external-skills.md`.

## Quality standards

- Direction is specific: families, scale, tokens and references are named, not adjectives.
- All token pairs contrast-checked in both themes, ratios recorded.
- Every screen has loading, empty and error states with copy.
- Every interactive element has a visible focus style.
- Mock data is synthetic; screenshots contain no secrets or real personal data.
- Review claims cite screenshot files that exist.

## Common failures

- Shipping the framework's default look and calling it a direction.
- Light theme only; dark theme "inverted" without re-checking contrast.
- Stat-tile dashboards that fill space instead of answering a question.
- Happy-path-only specs; empty and error states improvised by implementers.
- Claiming the UI "looks good" from reading code without rendering it.
- Specs with raw hex values that drift from tokens.

## Outputs

- `docs/design-direction.md` (from `.ship-anything/templates/design-direction.md`).
- Token definitions at the contract path (handed to `design-system-engineering`).
- Screen/state specs in `docs/design/`.
- Review mode: findings list plus screenshots in `docs/design/review/`.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Direction document is complete for every template field and contrast is recorded.
- Every primary screen has a state matrix with microcopy.
- For review tasks: screenshots at mobile and desktop exist and are cited, or the report
  states "not visually reviewed"; no blocker/major finding is left unreported.
- Status follows `.ship-anything/policies/status-model.md`.
