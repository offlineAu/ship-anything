---
name: competitive-product-analysis
description: >-
  Compares a product against real alternatives — features, journeys, UX patterns, pricing,
  platforms and positioning — using publicly available, cited evidence to identify table
  stakes, gaps and differentiation for the MVP. Use when defining scope for a product in an
  existing market, positioning a feature, choosing UX conventions users expect, or when the
  user asks what competitors do.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [product-director, research-agent]
---

# Competitive product analysis

## Purpose

Learn from what already exists so the MVP includes the table stakes users expect, avoids
known pitfalls, and differentiates on purpose — without copying protected material.

## When to use

- A new product enters a category with established players.
- Deciding which features are table stakes vs. differentiators.
- Choosing interaction conventions (checkout, onboarding, settings) users already know.
- The user names competitors or asks "how do others do it?".

Do not use when:
- There is no meaningful market (internal tool with a fixed process) — use `product-discovery`.
- Answering a single feasibility fact — use `product-research`.
- The goal is to analyse a product's internals or binaries — that is `reverse-engineering`
  and needs explicit authorization.

## Inputs

- `docs/product-brief.md` (users, journeys, MVP draft).
- Named competitors from the user, or a category to search.

## Procedure

1. **Select 3–6 alternatives**: direct competitors, an adjacent tool users substitute,
   and the "do nothing / spreadsheet" baseline. Justify each choice in one line.
2. **Define comparison dimensions** from the brief's journeys, not generic checklists:
   primary journey steps, key features, platforms, pricing model, onboarding, integrations,
   accessibility, notable UX patterns.
3. **Collect evidence** from public sources only: product sites, docs, pricing pages,
   changelogs, app-store listings, public demos, reviews. Record URL and access date. Use
   free tiers/trials only if the user authorises sign-up.
4. **Walk the primary journey** in each product where publicly possible (docs, demo videos,
   screenshots); note step count and friction points.
5. **Build the matrix**: rows = dimensions, columns = products; cells = observed fact with
   source ref, or "unknown". No scores invented without a defined scale.
6. **Classify features**: TABLE STAKES (most alternatives have it and users expect it),
   DIFFERENTIATOR (few have it; aligned with our users' pain), PARITY TRAP (common but not
   needed for our primary journey), GAP (no one does it well).
7. **Recommend**: MVP additions/removals with rationale; UX conventions to adopt; explicit
   differentiation hypothesis. Hand to product-director to update the brief.
8. **IP hygiene**: describe patterns in your own words; never copy copy-text, logos,
   proprietary assets or code.

## Decision rules

| Situation | Action |
|---|---|
| Feature in every competitor and on our primary journey | Table stakes → MVP |
| Feature in every competitor, off our journey | Parity trap → enhancement unless user insists |
| Information only behind sign-up/paywall | Mark unknown, or ask user authorization to sign up |
| Review sites disagree | Report the range and sample size; no averaged invented score |
| User's idea already exists | Say so plainly, with sources, and highlight differentiation options |

## Tools

- Web search/fetch; app-store listings; public changelogs; `gh` for open-source alternatives.
- Optional upstream: `rea` (see .ship-anything/registry.yaml) only for authorised technical
  teardowns, routed through `reverse-engineering`.

## Quality standards

- Every matrix cell is sourced or marked unknown, with access dates.
- Recommendations tie back to the brief's users and journeys.
- No fabricated market share, revenue or user numbers.
- No copied proprietary text or assets.

## Common failures

- Feature-count arms race that bloats the MVP.
- Comparing against stale pricing or deprecated features.
- Generic SWOT with no link to decisions.
- Treating marketing claims as observed behaviour.

## Outputs

- `docs/research/competitive-analysis.md`: alternatives, matrix, classification,
  recommendations, sources.
- Proposed brief changes for product-director.

## Done when

- The matrix covers the chosen alternatives with sourced cells, features are classified,
  and MVP/differentiation recommendations are recorded for the product-director.
