---
name: responsive-design
description: >-
  Makes layouts work from small phones to wide desktops: content-driven breakpoints,
  fluid type and spacing, CSS grid/flex and container queries, responsive images, touch
  versus pointer input, safe areas, zoom and reflow, verified by rendering at concrete
  widths. Use when building or fixing layouts across viewport sizes, mobile web issues,
  overflow or horizontal scroll bugs.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent, frontend-agent, mobile-agent]
---

# Responsive Design

## Purpose

Deliver one interface that is genuinely usable at every viewport and input type, not a
desktop layout squeezed down, and prove it by rendering at concrete widths.

## When to use

- New layouts or pages that must work on mobile and desktop.
- Bugs: horizontal scrolling, overlapping elements, cut-off text, tiny tap targets.
- Adapting components to the space they live in (sidebars, cards, split panes).

Do not use when:

- Native app layouts (SwiftUI/Compose) → `mobile-development` with platform guidelines.
- Visual direction decisions → `ui-ux-design`.
- Fixed-size outputs such as video frames → `video-editing`/`remotion-production`.

## Inputs

- `docs/design-direction.md` (breakpoints, max widths, density).
- Target devices/browsers from the brief; analytics if available.
- Pages/components in scope and the running app.

## Procedure

1. **Mobile-first CSS.** Base styles for the narrowest supported width (320 CSS px for
   WCAG 1.4.10 reflow); add `min-width` media queries as content needs.
2. **Breakpoints from content.** Add a breakpoint where the layout breaks, not per
   device. Keep them as tokens (e.g. `sm 640`, `md 768`, `lg 1024`, `xl 1280` if the
   stack uses those defaults).
3. **Layout primitives.** Grid for two-dimensional layouts
   (`grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))`), flex for one axis,
   `gap` over margins. Container queries (`container-type: inline-size`) for components
   that appear in different-width slots.
4. **Fluid scale.** `clamp()` for headings and section spacing; body text ≥16px on mobile
   to avoid iOS zoom on focus for inputs; line length capped with `max-width: 65ch` or similar.
5. **Images and media.** `srcset`/`sizes` or framework image component; explicit
   dimensions or `aspect-ratio`; `object-fit` for crops; art direction via `<picture>`.
6. **Input modes.** `@media (hover: hover)` for hover-only enhancements; never hide
   essential actions behind hover; targets ≥24×24 CSS px (WCAG 2.5.8), 44×44 preferred
   for primary touch actions; spacing between adjacent targets.
7. **Viewport details.** `<meta name="viewport" content="width=device-width, initial-scale=1">`
   without disabling zoom; `env(safe-area-inset-*)` for notches; use `dvh`/`svh` instead of
   `100vh` for full-height mobile sections; sticky elements do not cover focused content.
8. **Tables and dense data.** Choose per case: horizontal scroll container with visible
   affordance, column priority hiding, or stacked card rows.
9. **Navigation.** Collapse to a menu only when items do not fit; the menu is keyboard
   and screen-reader operable.
10. **Verify.** Render at 320, 375, 768, 1024, 1280 and 1920 px (plus landscape phone)
    with a browser tool; screenshot each; check for horizontal overflow with
    `document.documentElement.scrollWidth > innerWidth`; test 200% zoom.

## Decision rules

| Situation | Decision |
|---|---|
| Component used in slots of varying width | Container query, not viewport media query |
| Two layouts differ only in column count | Auto-fit grid, no breakpoint |
| Content differs by device | Same content, different arrangement; hide only true duplicates |
| Mobile nav has ≤4 items | Visible inline/tab bar rather than hamburger |
| Overflow found | Fix the cause (min-width, long word, fixed width); never `overflow-x: hidden` on body to mask it |

## Tools

- Browser DevTools device mode; Playwright viewports for scripted screenshots.
- Lighthouse mobile run for tap targets and viewport checks.
- Optional upstream: `emil-kowalski-skills` (see .ship-anything/registry.yaml) — `mobile-native` for native-feeling mobile web.

## Quality standards

- No horizontal scroll at 320 CSS px except intentional scroll containers.
- Screenshots at each verification width exist and are cited.
- Targets meet WCAG 2.5.8; text readable without zoom; zoom not disabled.
- CLS ≤ 0.1 on mobile for primary pages when measured.

## Common failures

- Desktop-first CSS with stacked overrides that fight each other.
- `100vh` hero cut off by mobile browser chrome.
- Fixed pixel widths on inputs or images causing overflow.
- Hover-only menus and tooltips unreachable on touch.
- Testing only in a resized desktop browser and calling it mobile-tested.

## Outputs

- Layout code in owned files; breakpoint tokens.
- Screenshot set per width in `docs/design/responsive/` (or the contract path).
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- All in-scope pages render correctly at every verification width, with screenshots.
- Overflow check and 200% zoom check performed and recorded.
- Status follows `.ship-anything/policies/status-model.md`.
