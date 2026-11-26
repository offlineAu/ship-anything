---
name: website
description: >-
  Builds marketing, landing, content or documentation websites with little or no server
  state: information architecture, responsive accessible pages, SEO metadata, optional
  motion, and measured Core Web Vitals. Composes production-release when going live.
level: [L1, L2, L3]
required_agents: [frontend-agent, qa-agent]
optional_agents: [ux-agent, motion-agent, performance-agent, documentation-agent]
required_skills: [frontend-development, responsive-design, accessibility-engineering, testing-and-qa]
composes: [production-release]
---

# Website

## Purpose

Ship a fast, accessible, responsive site whose content and structure match the brief, with
evidence: passing build, accessibility checks, verified links/metadata, and lab-measured
Core Web Vitals. Server features stay minimal (contact form, newsletter via provider).

## When to use

- Landing pages, marketing sites, portfolios, blogs, docs sites, animated launch pages.
- A marketing route group inside a larger product (composed by build-anything with
  `owns` limited to that route group).

Do not use when: users sign in, own data, or the site needs a custom API → `web-app`;
multiple clients share a backend → `fullstack-platform`.

## Inputs

- Brief or request; content (copy, images, logos) or permission to use placeholders.
- Brand assets the user owns; `docs/design-direction.md` if it exists.
- Hosting target if known (affects framework/static export choice).

## Agents

- `frontend-agent` (required): scaffold, pages, components, SEO, forms.
- `qa-agent` (required): independent e2e, link, a11y and visual checks.
- `ux-agent` (optional, L2+ with no design direction): IA, tokens, layout direction.
- `motion-agent` (optional, only when animation is requested): `src/motion/**`.
- `performance-agent` (optional, L3 or explicit perf targets): CWV audit and fixes plan.
- `documentation-agent` (optional): content-editing guide for non-developers.

## Skills and tools

`frontend-development`, `responsive-design`, `accessibility-engineering`, `testing-and-qa`;
optional `frontend-polish`, `motion-design`, `performance-optimization`, `visual-regression`,
`browser-automation`. Tools: the project's build/lint scripts, Playwright, axe-core,
Lighthouse CLI (`npx lighthouse <url> --output json`).

## Task graph

```
id     agent              objective                                    depends_on        wave  owns
WS-01  ux-agent           IA (sitemap, page sections), tokens,         -                 1     docs/design/**, src/styles/tokens.*
                          design direction (optional)
WS-02  frontend-agent     scaffold, layout, nav, footer, base          WS-01             2     src/** except src/motion/**
                          components, SEO defaults (title, meta, OG)
WS-03  motion-agent       motion tokens + section animations,          WS-01             2     src/motion/**
                          reduced-motion variants (optional)
WS-04  frontend-agent     pages + content, forms, sitemap.xml,         WS-02             3     src/** except src/motion/**
                          robots.txt, mount WS-03 modules
WS-05  orchestrator       integration checkpoint: install, build,      WS-03, WS-04      4     package.json, lockfile, configs
                          lint, preview server boots
WS-06  qa-agent           e2e smoke per page, link check, axe,         WS-05             5     tests/**
                          responsive screenshots (mobile/tablet/desktop)
WS-07  performance-agent  Lighthouse lab run on key pages; ranked      WS-05             5     perf/**
                          fixes with evidence (optional)
WS-08  frontend-agent     fix QA/perf findings                         WS-06, WS-07      6     src/** except src/motion/**
WS-09  (production-release) when deploy is in scope                   WS-08 VERIFIED    7     see production-release
```

L1 variant (single page, no motion): WS-02+WS-04 merged, WS-06 performed by the
orchestrator as a fresh re-run ("verified in single-session mode").

## Parallel opportunities

- WS-02 and WS-03: motion modules are built in `src/motion/**`, disjoint from layout code;
  frontend mounts them in WS-04.
- WS-06 and WS-07: QA writes tests, performance writes `perf/**`; both read-only on `src/**`.

## Sequential requirements

- Design direction (WS-01) before components when ux-agent is used.
- Integration checkpoint WS-05 before QA; QA after integration, never on a red build.
- Fix round WS-08 re-verified by qa-agent before release; deploy only via production-release.

## Acceptance criteria

- Every page in the IA exists, renders at 360px, 768px and 1280px widths with no horizontal scroll.
- All interactive elements are keyboard reachable with visible focus; images have alt text.
- Each page has unique `<title>` and meta description; OG tags present; `sitemap.xml` lists all public pages.
- Animations honour `prefers-reduced-motion`; no content hidden when JS or motion is disabled.
- Forms validate input, show success/error states, and never expose provider secrets client-side.

## Quality gates

- `build` and `lint` scripts exit 0 (exact commands recorded in the report).
- Playwright smoke passes for every page; internal link check reports 0 broken links.
- axe-core: 0 serious/critical violations on every page.
- Core Web Vitals "good" thresholds when applicable: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1
  (field p75). Lab runs report LCP, CLS and TBT as the INP proxy; record values measured, not estimated.
- Visual regression baselines captured (if `visual-regression` used) and reviewed.

## Deliverables

Site source, tests in `tests/**`, `docs/design-direction.md` (if WS-01), Lighthouse JSON
summaries in `perf/` (if WS-07), README section: run, build, edit content, deploy.

## Completion conditions

- WS-02/WS-04 (and WS-03 if present) VERIFIED by qa-agent with gate evidence.
- Without deploy in scope: final state VERIFIED; DEPLOYED marked N/A. A local build or
  local preview is never DEPLOYED.
- With deploy: production-release brings tasks to DEPLOYED then SHIPPED.

## Failure recovery

| Failure | Recovery |
|---|---|
| Missing copy/images | Use clearly marked placeholders, list them in the handoff; never ship lorem ipsum as final |
| CWV target missed | performance-agent names the element/resource responsible (LCP element, layout shift source); frontend fixes; re-measure same pages/settings |
| axe serious/critical violation | Bug-fix contract to frontend-agent with selector + rule id; QA re-runs axe |
| Motion causes CLS or jank | Move to transform/opacity, reserve layout space; motion-agent fix, perf re-measure |
| Build breaks after merge of WS-03/WS-04 | Orchestrator fixes glue at checkpoint; if ownership violated, revert out-of-scope edits and reassign |
| Third-party embed blocks performance | Lazy-load behind interaction or facade; record trade-off in decisions.md |
