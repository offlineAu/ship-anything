# SHIP ANYTHING — Bootstrap Status

> Resumable checkpoint file. If a session is interrupted, read this file first and resume from the
> last phase whose status is `VERIFIED` or `TESTED`. Do not regenerate completed work.

## Current phase

Bootstrap phases 1–10 complete (2026-11-26). Next: **Phase 11 — field validation** (see `reports/bootstrap-validation.md`).

## Phase tracker

| # | Phase | Status | Evidence |
|---|-------|--------|----------|
| 1 | Research and architecture | VERIFIED | 23 repos inspected via GitHub API; `docs/research/*`, `docs/architecture/*` |
| 2 | Core agent foundation | TESTED | 22 agents pass validator (21 sections, skills resolve) |
| 3 | Core skill library | TESTED | 57 skills pass validator; registry generated (`--check` clean) |
| 4 | Workflow engineering | TESTED | 15 workflows pass validator; references resolve |
| 5 | Efficiency engineering | TESTED | context/token skills, state templates, `scripts/benchmark/context-budget.mjs` (static only) |
| 6 | Quality and security | TESTED | policies, security-model, SECURITY.md; secret scan 0 hits |
| 7 | Universal adapters | PARTIAL | Claude Code ✔ and OpenCode ✔ loaded agents; Codex skills ✔, agents ✖ (untrusted project); Cursor and Gemini untested |
| 8 | npm CLI | TESTED | 20/20 tests; `npm pack --dry-run` OK; not published |
| 9 | Documentation / OSS readiness | TESTED | README, governance files, branding, community, guides; 153 internal links resolve |
| 10 | Validation | DONE | `reports/bootstrap-validation.md` |

## Environment (bootstrap machine)

macOS (Darwin 25.6), Node v24.21.0, npm 11.19.0, git 2.50.1. Claude Code 2.1.332, Codex CLI 0.160.1 and
OpenCode 1.19.5 are installed. Cursor and Gemini CLI are not.

## Decisions

See `docs/research/architecture-decisions.md` (ADR-001 to ADR-011).

## Known limitations and next actions

See `reports/bootstrap-validation.md`.

## How to verify this checkpoint

```bash
npm install && npm run check && node scripts/generate/registry.mjs --check
```
