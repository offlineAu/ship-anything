# Contributing to SHIP ANYTHING

Thanks for helping. This project values **usefulness and honesty over volume**: one well-tested skill beats ten
placeholder ones.

## Setup

```bash
git clone <repo> && cd ship-anything
npm install            # installs the CLI workspace (single dependency: yaml)
npm run check          # validator + CLI tests — must pass before every PR
```

Requires Node.js ≥ 20 and git.

## What to contribute
See [docs/community/contribution-roadmap.md](docs/community/contribution-roadmap.md). High-value areas:
verifying the Cursor and Gemini CLI adapters on real installs, new workflows, CLI features, and skill
improvements backed by real usage.

## Rules for content
- Follow [docs/architecture/authoring-spec.md](docs/architecture/authoring-spec.md) exactly; the validator enforces it.
- Add new agents/skills to [docs/architecture/catalog.md](docs/architecture/catalog.md), then run
  `node scripts/generate/registry.mjs` (never hand-edit `skills.internal`).
- No fabricated numbers, test results, compatibility claims, stars or testimonials.
- Third-party material: only with a compatible license and attribution. Prefer registering an upstream skill
  in `.ship-anything/registry.yaml` (with license + security notes + evidence in `docs/research/`) over copying it.
- Skills must not instruct agents to bypass user permissions, auto-approve tools, or perform authorization-gated
  actions without asking (`.ship-anything/policies/authorization.md`).

## Rules for code
- ESM, Node ≥ 20, no new runtime dependencies without discussion (ADR-007).
- Every behaviour change needs a test in `packages/cli/test/` (`node --test`).
- The CLI must stay non-destructive: preview, managed blocks, backups, rollback.

## Pull requests
- One logical change per PR. Fill in the PR template, including the exact commands you ran and their output.
- Update `CHANGELOG.md` under "Unreleased".

By contributing you agree your contributions are licensed under the MIT License and that you follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
