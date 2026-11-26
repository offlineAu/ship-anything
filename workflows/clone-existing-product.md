---
name: clone-existing-product
description: >-
  Builds an original product inspired by an existing one: authorization/legal gate,
  public-surface feature and UX-pattern analysis, original brand and assets, then routing
  into the matching build workflow. Never copies proprietary code, assets, trademarks or
  content, and never bypasses access controls.
level: [L2, L3, L4]
required_agents: [research-agent, product-director, ux-agent, qa-agent]
optional_agents: [architecture-agent, frontend-agent, backend-agent, mobile-agent, security-agent]
required_skills: [competitive-product-analysis, product-research, requirements-analysis, ui-ux-design]
composes: [product-discovery, website, web-app, mobile-app, fullstack-platform, production-release]
---

# Clone existing product

## Purpose

"Build something like X" means: reproduce **functionality and UX patterns** in an original
product with original branding, copy and assets. Output is a pattern inventory and a brief
that feed a normal build workflow — not a copy of X.

## When to use

- "Clone / like / similar to X", "X but for Y", competitor parity requests.
- Recreating the user's **own** product on a new stack (then `legacy-modernization` may fit better).

Do not use when: the user wants X's actual code, assets, data or branding (refuse that
part and offer the original-build path); understanding a system's internals → `reverse-engineer`.

## Inputs

- Target product name/URLs; which features/flows matter; what must differ.
- User's statement of authorization and intended use (recorded verbatim in decisions.md).
- User's own brand assets, or permission to create original placeholders.

## Agents

- `research-agent` (required): public-surface analysis, pattern inventory, sourcing.
- `product-director` (required): differentiated brief and MVP from the inventory.
- `ux-agent` (required): original visual direction; distinctiveness review.
- `qa-agent` (required): acceptance verification plus originality checks.
- Build agents come from the composed build workflow, only those it requires.
- `security-agent` (optional): when the clone handles auth/payments/PII.

## Skills and tools

`competitive-product-analysis`, `product-research`, `requirements-analysis`, `ui-ux-design`;
optional `reverse-engineering` (public behaviour only), `design-system-engineering`.
Tools: a normal browser session as an ordinary user, screenshots stored under
`docs/research/**` for internal reference only, `grep`/`rg` for originality scans.

## Task graph

```
id     agent              objective                                  depends_on      wave  owns
CL-00  orchestrator       LEGAL GATE: record user's authorization +  -               1     .ship-anything/state/decisions.md
                          intended use; confirm clone = functional/UX
                          patterns with original brand; list
                          forbidden items (below)
CL-01  research-agent     public-surface analysis: features, flows,  CL-00           2     docs/research/**
                          IA, UX patterns, pricing model; each item
                          sourced (URL + date); no gated content
CL-02  product-director   brief: MVP parity set, deliberate          CL-01           3     docs/product-brief.md
                          differentiators, out-of-scope (via
                          product-discovery)
CL-03  ux-agent           original design direction: name/brand      CL-02           4     docs/design/**, tokens
                          placeholders, palette, type, iconography
                          distinct from the target
CL-04  (build workflow)   website / web-app / mobile-app /           CL-02, CL-03    5+    per composed workflow
                          fullstack-platform tasks
CL-05  qa-agent           acceptance tests + originality check       CL-04 integrated  n   tests/**
CL-06  ux-agent           distinctiveness review vs target           CL-04 integrated  n   docs/design/review-*.md
                          screenshots
CL-07  (production-release) when deploy in scope                     CL-05, CL-06    n+1   see production-release
```

Forbidden at every step (recorded in every build contract's `constraints`):
- Copying proprietary source code, minified bundles, API keys, private APIs or datasets.
- Reusing logos, trademarks, product names, copy, illustrations, icons, photos, fonts or
  sounds from the target (openly licensed items allowed only with recorded license).
- Logging in with others' credentials, bypassing paywalls, rate limits, CAPTCHAs, robots
  rules, ToS-prohibited scraping, or any access control.
- Pixel-identical layouts designed to be confused with the target (trade dress).

## Parallel opportunities

- After CL-02/CL-03, the composed build workflow's own parallel waves apply unchanged.
- CL-05 ∥ CL-06 (tests vs design review; disjoint owns).
- CL-01 can split by product area across two research-agent tasks with separate
  `docs/research/<area>/**` dirs.

## Sequential requirements

- CL-00 legal gate before any research: no recorded authorization → stop and ask.
- Pattern inventory before brief; original design direction before any UI build.
- Originality check before release; release via production-release with authorization.

## Acceptance criteria

- decisions.md holds the user's authorization statement and the forbidden-items list.
- Every inventory item cites a public source URL and access date; nothing from gated areas.
- Shipped UI uses original name, logo, copy and assets; each asset has provenance.
- Brief's MVP parity features pass their acceptance tests in the built product.

## Quality gates

- Originality scan: `rg -i "<target name>|<target trademarks>" <src and asset dirs>` returns
  no matches outside `docs/research/**` (record command + result).
- Asset provenance: every file in shipped asset dirs listed with source/license; none sourced
  from the target.
- No code from the target: no copied bundles, no identical non-trivial code blocks; any
  similarity found → rewrite from the spec, not the source.
- ux-agent distinctiveness review signed: brand, palette, typography, iconography differ.
- Composed build workflow's gates (tests, security, performance) all pass.

## Deliverables

`docs/research/**` pattern inventory (internal), `docs/product-brief.md`, original design
direction, the built product from the composed workflow, originality/provenance report.

## Completion conditions

CL-00 recorded; build tasks VERIFIED per the composed workflow; CL-05 and CL-06 VERIFIED.
DEPLOYED/SHIPPED only through production-release. If authorization is refused or unclear,
all build tasks are BLOCKED (not DESCOPED) with the reason.

## Failure recovery

| Failure | Recovery |
|---|---|
| User cannot confirm right/intended use | BLOCKED at CL-00; explain the original-build alternative |
| Feature only visible behind login/paywall | Use public docs/marketing/user-provided descriptions; never bypass; mark unknowns |
| Originality scan hits | Replace offending text/asset; re-run scan; record in report |
| Design too close to target | ux-agent revises direction; affected UI tasks back to IN_PROGRESS |
| Request for target's assets/code | Decline that part, record in decisions.md, continue with originals |
| Target uses patented/unique mechanism | Flag to user as legal decision; implement only with their decision recorded |
