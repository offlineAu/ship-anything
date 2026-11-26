---
name: deployment
description: >-
  Deploys applications to preview, staging and production on Vercel, Netlify, Render,
  Railway, Fly.io, AWS, Azure, GCP or a VPS with Docker and Caddy, following a 14-step
  process: inspect, validate config and secrets, build, test, obtain authorization, deploy,
  verify health and logs, confirm behaviour and document rollback. Use when asked to
  "deploy", "ship", "go live" or "publish the site"; never reports a local build as deployed.
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [infrastructure-agent, release-agent]
---

# Deployment

## Purpose

Get a specific build running in a specific environment, prove it is healthy there, and
leave a documented way back. A deployment exists only when it has a URL or ID and a passing
health check in the target environment.

## When to use

- Deploying a preview, staging or production environment.
- Choosing a hosting provider for a new project.
- Rolling back or redeploying a known-good version.

Do not use when:
- Only building locally: that is a build, report it as IMPLEMENTED/TESTED.
- Publishing packages (npm, crates, app stores): use `release-management`.
- Provisioning the underlying resources: `infrastructure-engineering` first.
- The go-live gate has not run for a first production launch: run `production-readiness`.

## Inputs

- Release commit/tag and artifact; target environment (preview, staging, production).
- Provider and project identifiers; env var names per environment.
- Authorization status for this exact deploy (`.ship-anything/state/decisions.md`).

## Procedure

1. **Inspect the environment.** Detect the provider and existing config: `vercel.json`,
   `.vercel/`, `netlify.toml`, `render.yaml`, `railway.json`, `fly.toml`, `Dockerfile`,
   `app.yaml`, `*.tf`, `Caddyfile`. Check CLI login state read-only (`vercel whoami`,
   `fly auth whoami`, `gcloud config list`).
2. **Determine requirements.** Runtime version, build command, output dir, ports, regions,
   services needed (DB, cache, cron, queues), domains.
3. **Validate configuration.** Lint config files; confirm framework settings match the
   project; confirm migrations strategy (run before or after traffic switch).
4. **Check secrets and permissions.** Every required env var exists in the target
   environment by name (`vercel env ls`, `fly secrets list`); none are printed. The deploying
   identity has the needed, and only the needed, permissions.
5. **Prepare artifacts.** Clean checkout of the release commit; lockfile install; artifact
   or image tagged with the commit SHA.
6. **Build** with production settings and record the command and result.
7. **Run tests**: the release suite and smoke tests against the built artifact.
8. **Obtain authorization.** Production deploys, paid resources, DNS changes and
   destructive migrations need explicit user approval for this action
   (`.ship-anything/policies/authorization.md`). Ask with: exact command, environment, what
   changes, cost, rollback. Preview deploys to the user's own account are still remote
   actions: confirm the user wants them unless already authorized for this session's task.
9. **Deploy** with the provider's CLI or pipeline; capture the deployment ID and URL.
10. **Verify the deployment**: URL responds over HTTPS, correct commit/version is served
    (version endpoint or header), assets load.
11. **Health checks**: `curl -fsS <url>/healthz` and readiness endpoint; check DB
    connectivity; repeat a few times across regions if multi-region.
12. **Inspect logs** for errors since deploy (`vercel logs <url>`, `fly logs`, `railway
    logs`, cloud log explorer); check error tracking for new issues.
13. **Confirm behaviour**: run critical-journey smoke tests against the deployed URL
    (`browser-automation`, `api-testing`) and compare with acceptance criteria.
14. **Document rollback**: the exact command or steps to restore the previous version
    (`vercel rollback <deployment>`, `fly releases` + `fly deploy --image <previous>`,
    redeploy previous tag), data implications of migrations, and who can run it.

## Decision rules

| Provider | Fits | Notes |
|---|---|---|
| Vercel | Next.js and frontend frameworks, serverless/edge functions | Preview per branch; prod via `vercel --prod` or promotion |
| Netlify | Static sites, Jamstack, simple functions | Deploy previews; `netlify deploy --prod` for prod |
| Render | Web services, workers, cron, managed Postgres | Blueprint `render.yaml`; free tiers may sleep |
| Railway | Quick full-stack services with DBs | Usage-based billing; check plan |
| Fly.io | Docker apps close to users, multi-region | `fly.toml`; volumes are per-region |
| AWS | Broad control, enterprise needs | App Runner/ECS/Lambda; IaC strongly recommended |
| Azure | Microsoft-centric orgs | App Service, Container Apps, Static Web Apps |
| GCP | Containers with scale-to-zero | Cloud Run; Firebase Hosting for static |
| VPS (Docker + Caddy) | Fixed cost, full control, several services on one box | Caddy auto-HTTPS; you own patching, backups, monitoring |

- Status rules: local build = not deployed. Preview deploy = DEPLOYED(preview). Only a
  production deploy with health checks = DEPLOYED(production)
  (`.ship-anything/policies/status-model.md`).
- Health check fails or error rate jumps after deploy: roll back first, investigate second
  (the rollback itself is covered by the same authorization only if the user said so;
  otherwise ask immediately and explain).
- Never change DNS or attach domains without explicit authorization.
- Pricing: mention the plan/tier that applies and link the provider pricing page; do not
  invent prices.

## Tools

- Provider CLIs: `vercel`, `netlify`, `render` (Blueprints/API), `railway`, `fly`, `aws`,
  `az`, `gcloud`; `docker`, `ssh` + `docker compose` + Caddy for VPS.
- Host-provided deployment skills or MCP servers for a provider may be used when present;
  they do not bypass authorization.
- `curl`, `browser-automation`, `api-testing` for verification.

## Quality standards

- The report includes: environment, commit, command run, deployment ID, URL, health check
  output, log excerpt summary, smoke test results, rollback steps.
- Secrets never appear in commands, logs or reports.
- No output is described as deployed without the deployment URL/ID and a check against it.

## Common failures

- Reporting `npm run build` success as "deployed".
- Deploying from a dirty working tree or a different commit than the one tested.
- Missing env vars in production that existed only in preview.
- Running migrations that break the still-running old version (use expand/contract).
- Calling a deploy healthy because the CLI exited 0.

## Outputs

- Deployment record in the agent report (`.ship-anything/templates/agent-report.md`) and
  the release notes: environment, version, URL, ID, verification evidence, rollback.

## Done when

- All 14 steps are complete with evidence, or the process stopped at step 8 awaiting
  authorization (status stays below DEPLOYED).
- The target URL serves the expected version and health checks pass.
- Rollback steps are written down and specific.
