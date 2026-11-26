---
name: frontend-development
description: >-
  Builds and changes web frontends: picks a rendering model and framework from requirements
  (Next.js, Nuxt, SvelteKit, Astro, Vite SPA, plain HTML), structures components, routing,
  state, data fetching, forms and styling, and proves the result with builds, tests and
  browser checks. Use for implementing pages, components, client state, SSR/SSG/SPA work and
  frontend bug fixes.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [frontend-agent]
---

# Frontend development

## Purpose

Ship working, accessible, fast web UI in the stack that fits the product. Keep the
project's existing conventions. Back every claim ("builds", "renders", "passes") with
command output or a screenshot.

## When to use

- Implementing or changing pages, layouts, components, client routing, forms, client or
  server state, or data fetching in a web app.
- Choosing a frontend framework or rendering model for a new web project.
- Fixing frontend bugs: hydration errors, broken builds, stale data, layout regressions.

Do not use when:
- The task is visual direction, typography or palette. Use the lead design skill instead
  (see `## Tools`) and implement only from its output.
- The work spans UI, API and data in one vertical slice. Use `fullstack-development`.
- The target is a native mobile or desktop shell. Use `mobile-development` or
  `desktop-development`.
- The task is only an audit of accessibility, performance or responsiveness. Use the
  dedicated quality skill.

## Inputs

- Task contract (`.ship-anything/templates/task-contract.yaml`): acceptance criteria and `owns:` globs.
- Product brief, design direction (`DESIGN.md` per `.ship-anything/templates/design-direction.md`), API contract if any.
- Existing repo: `package.json`, lockfile, framework config, lint/format config, test setup, `.ship-anything/state/repo-map.md`.
- Target browsers, SEO needs, auth model, deployment target.

## Procedure

1. **Read before writing.** Identify framework, router, styling system, state library,
   test runner and package manager from the lockfile (`package-lock.json` → npm,
   `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb`/`bun.lock` → bun). Use that
   manager only.
2. **Establish a baseline.** Run the existing install, typecheck, lint, test and build
   scripts (e.g. `npm ci && npm run typecheck && npm run lint && npm test && npm run build`).
   Record failures that existed before you touched anything.
3. **Choose the stack (new projects only)** with the table under `## Decision rules`. In an
   existing project, keep the framework. A switch needs an ADR
   (`.ship-anything/templates/architecture-decision.md`, logged in
   `.ship-anything/state/decisions.md`).
4. **Model the UI.** List routes, the data each route needs, where that data is fetched
   (server, edge or client) and every loading, empty, error and success state.
5. **Build components bottom-up.** Use semantic HTML first (`button`, `a`, `label`, `nav`,
   `main`). Keep components small and typed. Keep server-only code (secrets, DB clients)
   out of client bundles.
6. **Wire data.** Use one fetching/caching approach per project (framework loaders, TanStack
   Query, SWR, etc.). Validate API responses at the boundary (zod/valibot or generated
   types from the API contract). Handle aborts and errors.
7. **Forms.** Validate on the client for UX and on the server for trust. Give inputs labels
   and error messages, disable the submit button while pending, and make submits idempotent.
8. **Styling.** Follow the existing system: Tailwind, CSS Modules or a component library.
   Use design tokens from `DESIGN.md`. No one-off magic values when a token exists.
9. **Test.** Unit-test logic. Component-test interactive pieces (Testing Library). Add at
   least one end-to-end test per critical user flow (Playwright or the existing tool).
10. **Verify in a browser.** Start the dev or preview server. Load each changed route at
    mobile (~375px) and desktop widths, check the console for errors, and capture
    screenshots as evidence.
11. **Report** using `.ship-anything/templates/agent-report.md`. List only the commands you
    actually ran.

## Decision rules

| Requirement | Prefer | Avoid when |
|---|---|---|
| SEO-critical app with dynamic data, React team | Next.js (App Router) | Pure static content (overkill) |
| Same as above, Vue team | Nuxt | Team has no Vue experience |
| Lean full-stack app, small bundles | SvelteKit | Heavy dependence on React-only libraries |
| Content site, docs, marketing, mostly static | Astro (islands) | Highly interactive app shell |
| Authenticated dashboard/internal tool, no SEO | Vite + React/Vue/Svelte SPA | Public pages needing crawlable HTML |
| A few static pages, no build step wanted | Plain HTML/CSS + minimal JS | App state across many views |

- Rendering: static content → SSG. Per-request personalised content → SSR. Authenticated
  app shell → SPA or SSR with client navigation. Mixed → per-route choice.
- State: server data in a query cache, URL state in the router, and form state local. Add a
  global store (Zustand, Pinia, Redux Toolkit) only when several distant components share
  client-only state.
- Adding a dependency: check license, maintenance and bundle impact. Lockfiles are shared
  files: request the change through the orchestrator
  (`.ship-anything/policies/file-ownership.md`).
- Conflicting instructions: preserve existing conventions over personal preference.

## Tools

- The project's package manager, framework CLI, TypeScript, ESLint/Biome, Prettier,
  Vitest/Jest, Testing Library, and Playwright or Cypress.
- Lighthouse or the browser devtools Performance panel for Core Web Vitals checks.
- Lead design skill: optional upstream `anthropic-frontend-design` (see
  `.ship-anything/registry.yaml`). For marketing sites use optional upstream `taste-skill`
  instead (one lead only). Optional upstream `anthropic-webapp-testing` for Playwright flows.
- Related skills: `responsive-design`, `accessibility-engineering`, `frontend-polish`,
  `interaction-design`, `browser-automation`.

## Quality standards

- Typecheck, lint and build pass with no new warnings introduced.
- WCAG 2.2 AA: text contrast 4.5:1 (3:1 for large text and UI components), full keyboard
  operation, visible focus, labelled controls.
- Core Web Vitals "good" thresholds on key routes: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
  Report how they were measured (lab or field).
- No secrets or server-only modules in client bundles. No `dangerouslySetInnerHTML` or
  `v-html` on untrusted input.
- Every async view has loading, empty and error states.

## Common failures

- Hydration mismatch from `Date.now()`, `Math.random()` or `window` access during server render.
- Fetch waterfalls: sequential awaits that could run in parallel or be hoisted to the route loader.
- Env vars exposed by the wrong prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) and leaking secrets.
- Introducing a second styling or state system next to the existing one.
- Claiming "it works" without opening the page. A passing build does not prove the page renders.

## Outputs

- Source changes inside the task's `owns:` globs, with tests.
- Screenshots or Playwright traces of changed routes (paths recorded in the report).
- Agent report with commands run and results. ADR if a stack decision was made.

## Done when

- Acceptance criteria are met and demonstrated with evidence (test output, screenshots).
- Typecheck, lint, unit/component tests and production build pass (or pre-existing
  failures are documented as unchanged).
- Changed routes were loaded in a real browser at mobile and desktop widths with no
  console errors.
- Report filed. Status is set no higher than TESTED (`.ship-anything/policies/status-model.md`).
