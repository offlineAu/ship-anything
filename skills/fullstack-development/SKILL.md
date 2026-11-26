---
name: fullstack-development
description: >-
  Delivers end-to-end vertical slices that span UI, API, data and auth in one change: picks
  an integrated or split architecture (meta-framework vs separate frontend and backend),
  shares types across the boundary, sequences schema, server and client work, and proves the
  whole flow from browser to database. Use for features like "users can create and share X"
  that touch every layer.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [frontend-agent, backend-agent]
---

# Full-stack development

## Purpose

Ship a feature that works through every layer: browser, API, data store and back. Keep the
contract between layers explicit, so frontend and backend can be built and verified
independently and then together.

## When to use

- A feature needs UI, server logic and persistence changes that must land together.
- Building a new small product or MVP in one meta-framework (Next.js, Nuxt, SvelteKit,
  Remix/React Router, Laravel + Inertia, Django + HTMX, Rails).
- Debugging a flow that breaks somewhere between the click and the row in the database.

Do not use when:
- The change is confined to one layer. Use `frontend-development` or `backend-development`.
- Several agents are working in parallel on separate layers. The orchestrator should split
  the work into per-layer tasks with a shared contract (`api-development`).
- The work is primarily schema or migration design. Use `database-engineering` for that step.

## Inputs

- Task contract (acceptance criteria phrased as user-visible outcomes, `owns:` globs).
- Product brief and design direction. Existing API contract and data model.
- Repo conventions: monorepo layout, shared packages, ORM, auth library, test setup.

## Procedure

1. **Trace the slice.** Write the flow as steps: user action → client validation → request
   → auth check → service → DB write → response → UI update → side effects (email, webhook,
   cache invalidation). Every acceptance criterion must map to a step.
2. **Baseline** the existing build and tests for every package you will touch.
3. **Contract first.** Define or extend the request and response shapes (OpenAPI, tRPC
   router, GraphQL SDL, server action signature or shared zod schemas). Generate or share
   types instead of hand-copying them. See `api-development`.
4. **Data.** Design the schema change and migration with `database-engineering`. Write the
   migration and seed or fixture data before the server code.
5. **Server.** Implement the handler or server action with validation, an authz check,
   transaction boundaries and error mapping (`backend-development`). Add integration tests
   against a real test database.
6. **Client.** Build the UI states: idle, pending, success, empty, error and forbidden.
   Choose optimistic updates only when rollback on failure is implemented
   (`frontend-development`).
7. **Glue.** Set up cache invalidation and revalidation, redirects, toasts and focus
   management after mutations.
8. **End-to-end test.** Write one Playwright (or existing tool) test per acceptance
   criterion. It drives the real UI against the real server and a seeded test DB.
9. **Run the whole thing.** Start DB, server and client locally. Perform the flow manually
   or via E2E, then confirm the persisted state with a read query or API call. Capture
   evidence.
10. **Report** with per-layer file lists and the commands run.

## Decision rules

| Situation | Prefer |
|---|---|
| One team, one deploy, SSR web app | Integrated meta-framework (Next.js, Nuxt, SvelteKit, Laravel+Inertia, Django) |
| Multiple clients (web + mobile + partners) | Separate API service with a versioned contract, plus a web frontend |
| TypeScript end to end, internal clients only | tRPC or server actions with shared zod schemas |
| Public or third-party consumers | REST/OpenAPI or GraphQL, never framework-internal RPC |
| Heavy server-side processing or a non-JS language | Split backend (FastAPI, Go, etc.) and a frontend talking via OpenAPI-generated client |

- Keep the existing architecture. Changing between integrated and split requires an ADR
  (`.ship-anything/templates/architecture-decision.md`).
- Where validation must run on both sides, define the schema once and import it twice.
- Build order is data → server → client → E2E. Do not build UI against imagined endpoints
  without a written contract or mock generated from it.

## Tools

- Meta-framework CLIs, ORM migration tools (Prisma, Drizzle, Django, Laravel, EF Core,
  Alembic), Docker Compose for local DB/cache, and Playwright.
- Related skills: `frontend-development`, `backend-development`, `api-development`,
  `database-engineering`, `authentication-and-authorization`, `browser-automation`.
- Optional upstream `anthropic-webapp-testing` (see `.ship-anything/registry.yaml`) for
  Playwright-driven checks.

## Quality standards

- Types flow from a single source across the boundary, with no `any` at the seam.
- Authorization is enforced on the server for every mutation and read. UI hiding is not
  security.
- Every mutation has a test at the server layer and the flow has an E2E test.
- Each layer meets its own skill's quality bar (WCAG 2.2 AA in UI, validated inputs on the
  server, reversible migrations in data).

## Common failures

- Client and server schemas drift because types were duplicated by hand.
- Optimistic UI with no rollback, so it shows success while the write failed.
- Stale caches after mutation (missing revalidate or invalidate).
- E2E tests that pass only against mocks, so the real DB path was never exercised.
- Reporting the slice done when only the UI was clicked and the DB state was never checked.

## Outputs

- Schema and migration, server code, client code, shared contract or types, and tests at
  each layer.
- E2E test results, screenshots or trace, and a DB/API read confirming persisted state.
- Agent report. ADR if architecture changed.

## Done when

- Each acceptance criterion has a passing E2E test run against a real server and test DB.
- Per-layer builds, lint and tests pass.
- Evidence of the persisted state is recorded in the report.
- Report filed. Status is no higher than TESTED until independently verified.
