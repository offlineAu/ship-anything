---
name: codebase-intelligence
description: >-
  Answers precise questions about an existing codebase — where behaviour is implemented,
  how data flows, what calls what, what a change will break — using targeted search,
  symbol navigation, call tracing and git history, with findings tied to file:line
  evidence. Use when locating code, tracing a request or bug through layers, assessing
  change impact, or building understanding of an unfamiliar subsystem.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator, research-agent]
---

# Codebase intelligence

## Purpose

Turn "how does X work here?" into a short, evidence-backed answer with file:line
references, at the lowest reading cost, so implementation starts from facts instead of
guesses.

## When to use

- Finding where a feature, route, table, event or config key lives.
- Tracing a flow end to end (UI action → API → service → DB) before changing it.
- Impact analysis: who calls this function, who reads this column, what tests cover it.
- Understanding why code is the way it is (history, linked issues).

Do not use when:
- You need a whole-repo overview — run `repository-mapping` first.
- The answer is already in `repo-map.md`, an ADR, or a task report.
- The target is a binary or third-party product without source — see `reverse-engineering`.

## Inputs

- A concrete question, ideally phrased as "where/how/what-breaks".
- `.ship-anything/state/repo-map.md` if available.

## Procedure

1. **Check existing knowledge**: `repo-map.md`, `decisions.md`, task reports. Reuse before
   searching.
2. **Find anchors** with literal, distinctive strings: route paths, error messages, UI
   copy, table/column names, env var names, event names.
   `rg -n --hidden -g '!node_modules' -g '!dist' "orders/:id/refund"` (or `git grep -n`).
3. **Find definitions** of the symbols at the anchor:
   `rg -n "(function|const|class|def|fn|func|type|interface) refundOrder\b"`; use the
   language server / IDE "go to definition" or `ctags` when available.
4. **Find references** (callers, readers): `rg -n "\brefundOrder\("`, plus dynamic forms
   (string-based dispatch, DI registrations, route tables, event subscriptions).
5. **Trace across boundaries**: HTTP client → route definition → handler → service →
   repository/ORM → schema/migration. At each hop, record `path:line` and what passes
   through (types, payload shape).
6. **Read narrowly**: open the surrounding function or range (`sed -n '120,190p' file`),
   not whole files, unless the file is the unit you will modify.
7. **History for "why"**: `git log -L :refundOrder:src/orders/service.ts`,
   `git log -S "refund_window" --oneline`, `git blame -L 120,140 file`.
8. **Tests as specification**: `rg -n "refund" -g '*test*' -g '*spec*'`; note what
   behaviour is pinned and what is not.
9. **Answer** in the report's "Investigated" section: the question, a numbered trace with
   `path:line` evidence, confidence, and open unknowns. Add durable structural facts to
   `repo-map.md`.

## Decision rules

| Situation | Action |
|---|---|
| Search returns hundreds of hits | Add path filters (`-g 'src/**'`), word boundaries, or a more distinctive anchor |
| No hits for a symbol | Check generated code, string dispatch, other casing (`refund_order`), vendored packages |
| Behaviour depends on config/env | Record the key and where its value is set; never print secret values |
| Conflicting implementations found | Find which is wired at runtime (entry point → imports), report both |
| Claim not verified by reading code | Mark "hypothesis" and say how to verify |

## Tools

- `rg` (ripgrep) or `git grep`; language servers; `ctags`; `git log -L/-S`, `git blame`.
- Structural search where installed: `ast-grep` (`sg -p 'refundOrder($$$)'`).
- Optional upstream: `understand-anything` (codebase knowledge graph; heavy first run,
  hooks) and `repomix` (pack a slice) — see .ship-anything/registry.yaml; opt-in only.

## Quality standards

- Every claim has a `path:line` reference or is labelled a hypothesis.
- The trace covers dynamic wiring, not only static imports.
- Reading cost proportional to the question: ranges, not whole directories.
- No secret values quoted (`.ship-anything/policies/secrets.md`).

## Common failures

- Stopping at the first match that "looks right" when another implementation is the one wired in.
- Missing callers that use reflection, string routes, or dependency injection.
- Reading entire large files to answer a one-function question.
- Presenting assumptions about framework conventions as facts about this repo.

## Outputs

- Evidence-backed answer or trace in the task report.
- Updated `repo-map.md` entries for durable structural facts.

## Done when

- The question is answered with file:line evidence, unknowns are listed, and the answer is
  recorded where other agents will find it.
