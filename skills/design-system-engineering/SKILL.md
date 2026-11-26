---
name: design-system-engineering
description: >-
  Turns a design direction into an engineered design system: layered design tokens
  (primitive, semantic, component), light/dark theming, component APIs and state
  coverage, documentation and drift checks. Use when creating or refactoring tokens,
  CSS variables, Tailwind theme config, theming, a shared component library, or when UI
  values are inconsistent across the codebase.
license: MIT
metadata:
  category: design
  version: "0.1.0"
  agents: [ux-agent]
---

# Design System Engineering

## Purpose

Make the design direction enforceable in code: one source of truth for color, type,
spacing, radii, elevation and motion, consumed by components with predictable APIs,
so visual consistency survives many contributors and agents.

## When to use

- Establishing tokens and theming for a new product after `ui-ux-design` set direction.
- Consolidating hard-coded colors/sizes into tokens; adding dark mode or a second brand.
- Defining or refactoring a shared component library (API, variants, states).
- Auditing drift: raw hex values, one-off spacing, duplicate components.

Do not use when:

- No direction exists yet → `ui-ux-design` first.
- Building a single feature screen with existing tokens → `frontend-development`.
- Accessibility audit → `accessibility-engineering`.
- Throwaway prototype where the user explicitly declined a system.

## Inputs

- `docs/design-direction.md`.
- Stack: framework, styling approach (CSS variables, Tailwind, CSS-in-JS, native themes).
- Existing component inventory and token files, if any.
- Platforms to target (web, iOS, Android, desktop) — determines token export formats.

## Procedure

1. **Inventory.** Grep for raw values to size the problem:
   `grep -rEn '#[0-9a-fA-F]{3,8}\b|rgba?\(' src --include='*.{css,scss,tsx,jsx,vue,svelte}' | wc -l`
   and list existing components and duplicates.
2. **Define token layers.**
   - Primitive: raw scales (`gray-50…950`, `space-1…12`, `radius-sm…xl`, `duration-fast…slow`).
   - Semantic: intent (`color-bg`, `color-surface`, `color-text`, `color-text-muted`,
     `color-accent`, `color-danger`, `color-focus`, `space-inset-md`).
   - Component (only where needed): `button-bg`, `input-border-focus`.
   Components consume semantic or component tokens, never primitives directly.
3. **Choose the source format.** Single source (JSON in DTCG format, or CSS custom
   properties, or Tailwind theme) and generate others from it if several platforms exist
   (e.g. Style Dictionary). Do not maintain two hand-edited copies.
4. **Theming.** Implement light/dark by swapping semantic tokens (e.g. `[data-theme=dark]`
   or `prefers-color-scheme`), not by rewriting components. Respect user choice over system.
   Avoid flash of wrong theme by setting the attribute before first paint.
5. **Contrast gate.** Script or tool that checks every declared text/background semantic
   pair in each theme against WCAG 2.2 AA (4.5:1 text, 3:1 large text and UI). Record results.
6. **Component API.** For each component: props for variant/size/state, sensible defaults,
   `className`/style escape hatch, forwarded refs, native element semantics preserved.
   Required states: default, hover, focus-visible, active, disabled, loading, invalid.
7. **Document.** One page per component (usage, do/don't, props, states). Storybook or a
   plain docs route is fine; choose what the repo already uses.
8. **Prevent drift.** Add lint rules where the stack supports them (e.g. stylelint
   `color-no-hex` in component dirs, Tailwind arbitrary-value restrictions) and replace
   existing raw values incrementally, highest-traffic components first.
9. **Verify.** Run build, lint and tests; render key components in both themes and
   screenshot (or hand to `visual-regression`).

## Decision rules

| Situation | Decision |
|---|---|
| Single web app, Tailwind already used | Tailwind theme maps to CSS variables holding semantic tokens |
| Multiple platforms | DTCG JSON source + generator; generated files are not hand-edited |
| Existing component library (shadcn/ui, Radix, MUI…) | Theme it via its token layer; do not fork components unless required |
| New one-off value requested | Add to scale only if reused ≥2 places; otherwise use nearest token |
| Brand color fails contrast | Keep brand primitive, derive an accessible semantic shade |
| Component needs >6 boolean props | Split into variants or composed subcomponents |

## Tools

- Style Dictionary or equivalent token transformer (only if multi-platform).
- Linters: stylelint, eslint plugins for Tailwind/class order where present.
- Storybook or the existing docs tooling.
- Optional upstream: `impeccable` (see .ship-anything/registry.yaml) — `document`/`extract` for DESIGN.md context; hooks off by default.
- Optional upstream: `ui-ux-pro-max` (see .ship-anything/registry.yaml) — token export reference only.

## Quality standards

- Zero raw color values inside component source after migration (tokens only).
- Every semantic text/background pair passes AA in both themes, with recorded ratios.
- Theme switch requires no component changes.
- Every component documents its states and keyboard behaviour.
- Token names describe intent, not appearance (`color-danger`, not `color-red`).

## Common failures

- Semantic layer skipped: components reference `blue-600` and dark mode breaks.
- Two sources of truth (Figma export and hand-edited CSS) diverging.
- Dark theme created by inverting lightness without checking contrast or elevation.
- Over-abstraction: component tokens for every property of every component.
- Focus styles removed by a reset and never restored.

## Outputs

- Token source file(s) and generated outputs at the contract path.
- Theme implementation and contrast check results.
- Component docs; lint config changes.
- Agent report per `.ship-anything/templates/agent-report.md` with the contrast table.

## Done when

- Tokens exist in all three layers needed, from one source, consumed by components.
- Both themes render without component edits; contrast check passes and is recorded.
- Build, lint and tests pass (outputs cited); drift lint is active where supported.
- Status follows `.ship-anything/policies/status-model.md`.
