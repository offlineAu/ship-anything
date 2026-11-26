# AGENTS.md — SHIP ANYTHING repository

This repository is the **source** of SHIP ANYTHING: portable agents, skills, workflows, policies and the
`ship-anything` CLI. These instructions are for coding agents working *on* this repository.
To *use* SHIP ANYTHING in another project, run `npx ship-anything init` there (see README).

## Layout
- `agents/*.md` — 22 specialist agent definitions (canonical). Format: `docs/architecture/authoring-spec.md`.
- `skills/<name>/SKILL.md` — internal Agent Skills (canonical). Catalog: `docs/architecture/catalog.md`.
- `workflows/*.md` — composable delivery workflows.
- `.ship-anything/` — config, registry, policies, templates and adapter docs that `init` installs into projects.
- `packages/cli/` — the `ship-anything` CLI (Node ≥ 20, ESM, one dependency: `yaml`).
- `scripts/validate/`, `scripts/generate/` — validation and registry generation.
- `docs/` — architecture, research (evidence for every upstream decision), integrations, branding, community.

## Working rules
1. Read `SHIP-ANYTHING-STATUS.md` first; it is the resumable checkpoint.
2. Edit canonical files only. Never hand-edit `skills.internal` in `.ship-anything/registry.yaml` — run
   `node scripts/generate/registry.mjs`.
3. After any change run `npm run check` (validator + CLI tests). Do not report success without its output.
4. New skill/agent/workflow: follow `docs/architecture/authoring-spec.md`; add it to `docs/architecture/catalog.md`.
5. Upstream integrations need evidence in `docs/research/` and a registry entry with license + security notes.
   Never vendor third-party skill text without a compatible license and attribution.
6. Never publish to npm, push to remotes, or create releases without explicit maintainer authorization.
   Releases follow `docs/guides/releasing.md`.
7. No fabricated benchmarks, stars, compatibility claims or test results in docs.

## Using the system inside this repo
The same operating model applies to work here: act as the orchestrator in `agents/orchestrator.md` for
non-trivial changes, and follow `.ship-anything/policies/`.
