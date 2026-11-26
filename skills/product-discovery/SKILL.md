---
name: product-discovery
description: >-
  Turns a raw product idea or request into a lightweight product brief: target users,
  problem, primary journeys, platforms, MVP versus enhancements, constraints and recorded
  assumptions, without blocking on questions a reasonable default can answer. Use at the
  start of a new product, app, feature set or major pivot, or when a request is vague about
  who it is for and what must ship first.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [product-director]
---

# Product discovery

## Purpose

Decide *what* to build and for *whom* before anyone decides *how*. Produce a brief that
is small enough to read in two minutes and concrete enough to derive acceptance criteria.

## When to use

- New product or app request ("build me a…"), or a major new feature area.
- A request whose users, core journey or MVP boundary is unclear.
- Before architecture-planning and UX direction on L3/L4 work.

Do not use when:
- The request is a bug fix, refactor, or small enhancement with obvious scope (L1/L2).
- A current `docs/product-brief.md` already covers the scope — update it instead.
- The need is market evidence — that is `product-research` / `competitive-product-analysis`.

## Inputs

- The user request verbatim; any linked docs, screenshots, existing product.
- `.ship-anything/templates/product-brief.md`.
- Research findings if research-agent has run.

## Procedure

1. **Restate** the request in ≤ 3 lines: who, what problem, what outcome.
2. **Identify users**: 1–3 primary personas as role + context + goal (not demographics).
   Note who pays vs. who uses if different.
3. **Frame the problem**: the job to be done, current workaround, why it hurts now.
4. **Journeys**: write 2–5 primary journeys as actor → goal → steps → success state.
   The first journey is the one that must work end to end in the MVP.
5. **Platforms and context**: web/mobile/desktop/API; device and environment (offline,
   field use, accessibility needs, locales).
6. **MVP cut**: list the smallest set of capabilities that completes journey 1 (and any
   journey the request makes non-negotiable). Everything else goes to "Enhancements".
   Test each MVP item: "Can the primary journey succeed without it?" Yes → enhancement.
7. **Constraints**: integrations (payments, auth, email, maps), data and PII, compliance
   hints, budget/hosting preferences, deadlines.
8. **Assumptions over questions**: for each unknown, choose a reasonable default and
   write `ASSUMPTION: <default> — because <reason>`. Ask the user only when the choice is
   expensive to reverse or only they can make it (brand, legal, paid providers, credentials);
   batch those questions.
9. **Success signals**: how we will know the MVP works (task completion, a measurable
   target the user stated). Do not invent market numbers.
10. **Write `docs/product-brief.md`** from the template; hand acceptance-criteria drafting
    to `requirements-analysis`.

## Decision rules

| Situation | Action |
|---|---|
| Request names a feature list but no user | Infer the user from the features; record as assumption |
| Feature is "nice", journey succeeds without it | Enhancement |
| Unknown with cheap reversal (colour, copy, list sort) | Assume and move on |
| Unknown with costly reversal (paid provider, data model for regulated data) | Ask, batched |
| User gave explicit scope | Respect it; flag risks rather than cutting silently |
| Competitive context matters to positioning | Request `competitive-product-analysis` |

## Tools

- `.ship-anything/templates/product-brief.md`.
- Web research is delegated to research-agent (`product-research`).

## Quality standards

- Brief fits on one screen per section; no marketing language.
- Every MVP item traces to a journey; every assumption has a reason.
- No fabricated market sizes, user counts or survey results.
- Explicit "not in MVP" list exists.

## Common failures

- Brief that restates the request without deciding the MVP boundary.
- Ten personas and no primary journey.
- Blocking on questions that a default would answer.
- Smuggling solution choices (frameworks, databases) into the brief.

## Outputs

- `docs/product-brief.md` (objective, users, journeys, platforms, MVP, enhancements,
  constraints, assumptions, open blocking questions).
- Assumptions copied to `.ship-anything/state/decisions.md`.

## Done when

- Primary user and primary journey are explicit, the MVP list is cut, assumptions are
  recorded, and only genuinely blocking questions remain open.
