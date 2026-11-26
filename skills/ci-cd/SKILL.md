---
name: ci-cd
description: >-
  Builds and hardens CI/CD pipelines on GitHub Actions or GitLab CI: lint, type check, test,
  build and security jobs, actions pinned to commit SHAs, least-privilege permissions,
  dependency caching, secrets from the CI secret store or OIDC, required status checks and
  gated deploy jobs with environments. Use when adding or fixing a pipeline, making checks
  required, speeding up CI, or automating preview and production deploys.
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [infrastructure-agent, release-agent]
---

# CI/CD

## Purpose

Run the project's quality gates on every change, automatically and reproducibly, and deploy
only what passed, with the minimum privileges needed.

## When to use

- A repo has no CI, or CI is flaky, slow or insecure.
- New checks (tests, audit, e2e) must run on every PR or become required.
- Automating preview deploys or gated production deploys.

Do not use when:
- Running a one-off local check: run it directly.
- Choosing hosting or provisioning resources: `deployment` / `infrastructure-engineering`.
- Defining which env vars exist: `environment-management`.

## Inputs

- Repo layout, package manager and lockfile, test/build commands, runtime versions.
- CI platform (GitHub Actions, GitLab CI, other) and existing workflow files.
- Deploy targets and their credentials model (secret store or OIDC).

## Procedure

1. Read existing pipelines (`.github/workflows/*.yml`, `.gitlab-ci.yml`) and the local
   commands developers use. CI must run the same commands as local scripts.
2. Design jobs: `lint` + `typecheck`, `test` (unit/integration with service containers),
   `build`, `e2e` (on built artifact), `security` (dependency audit, secret scan, optional
   SAST). Run independent jobs in parallel; fail fast on cheap checks.
3. Pin runtime versions from the repo (`.nvmrc`, `.python-version`, `rust-toolchain.toml`)
   and install from the lockfile (`npm ci`, `pnpm install --frozen-lockfile`,
   `uv sync --frozen`, `cargo build --locked`).
4. Security hardening (GitHub Actions):
   - Pin third-party actions to full commit SHAs with a version comment:
     `uses: actions/checkout@<40-char-sha> # v4.x.y`. Look up the SHA from the action's
     release tag (`git ls-remote https://github.com/actions/checkout refs/tags/v4.x.y`); never
     invent one.
   - Top-level `permissions: contents: read`; grant more per job only as needed
     (`id-token: write` for OIDC, `pull-requests: write` for comments).
   - Do not run untrusted PR code with secrets: avoid `pull_request_target` checkouts of the
     PR head; secrets are unavailable to fork PRs by design, keep it that way.
   - Treat `${{ github.event.* }}` text as untrusted; pass via `env:` instead of inlining into
     `run:` scripts (script-injection).
   - `actions/checkout` with `persist-credentials: false` when the job does not push.
   - Set `timeout-minutes` and `concurrency` (cancel in-progress for the same ref).
5. GitLab CI equivalents: pin images by digest or version, protected and masked variables,
   `rules:` to limit deploy jobs to protected branches/tags, ID tokens for OIDC.
6. Caching: use setup actions' built-in caches (`actions/setup-node` `cache: npm`,
   `setup-python` `cache: pip`), or `actions/cache` keyed on lockfile hash. Cache
   dependencies, not build outputs that might mask failures.
7. Secrets: store in the CI secret store or environment secrets; reference by name
   (`${{ secrets.VERCEL_TOKEN }}`); prefer OIDC federation to cloud providers over static
   keys. Never echo secrets; mask derived values. Creating or changing CI secrets is a
   credentials action needing user authorization.
8. Deploy jobs: preview on PRs (if desired); production only from the default branch or
   tags, through a protected `environment:` with required reviewers. Deploy jobs depend on
   (`needs:`) all quality jobs.
9. Required checks: list the job names to mark required in branch protection/rulesets.
   Changing repository settings is a remote action; prepare the change (`gh api` command or
   UI steps) and ask the user.
10. Validate locally: `actionlint` for GitHub workflows, `zizmor` for security linting if
    available, `gitlab-ci-lint` via API for GitLab. Then observe a real run: pushing a branch
    to trigger CI needs authorization; otherwise report the workflow as "written, not yet
    run".

## Decision rules

| Situation | Choice |
|---|---|
| Monorepo | Path filters or affected-graph tools (Turborepo, Nx) to skip unaffected jobs |
| Slow E2E | Run on PR to main only, shard (`--shard=1/4`), upload traces as artifacts |
| Flaky test in CI | Quarantine with issue; do not add blanket retries |
| Cloud deploy credentials | OIDC > short-lived token > static secret |
| Matrix builds | Only for versions/OSes actually supported |
| Third-party action needed | Prefer official/verified publishers; pin SHA; review its code for write permissions |

## Tools

- GitHub Actions, GitLab CI; `actionlint`, `zizmor`, `gh` CLI (read-only unless
  authorized), Dependabot/Renovate for action and dependency updates (which keep SHA pins
  current).

## Quality standards

- Every third-party action pinned to a full SHA; top-level `permissions` set.
- CI commands identical to documented local commands.
- No secret printed in logs; no secrets available to untrusted code.
- Production deploy gated by passing checks and a protected environment.

## Common failures

- `uses: some/action@main` or unpinned tags.
- Default write-all token permissions.
- Caching `node_modules` across lockfile changes, hiding install failures.
- Deploy job that runs even when tests fail (missing `needs:`).
- Reporting a workflow as passing without a real run link.

## Outputs

- Workflow files, required-check list, branch-protection change request.
- Run evidence: CI run URL and job results, or "not yet run" with the reason.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Workflows lint clean (`actionlint` output recorded).
- A real CI run passed with a link, or the user has the authorization request to push and
  trigger it.
- Required checks and deploy gates are defined and documented.
