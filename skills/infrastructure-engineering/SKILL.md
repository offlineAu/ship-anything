---
name: infrastructure-engineering
description: >-
  Designs and builds runtime infrastructure as code: Dockerfiles (multi-stage, non-root,
  minimal images), docker compose for local stacks, Terraform/OpenTofu or Pulumi modules,
  networking, storage, databases, backups and least-privilege IAM, with cost notes and
  plan-before-apply discipline. Use when containerizing an app, provisioning cloud
  resources, writing IaC, or hardening hosting; paid resources and DNS need user approval.
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [infrastructure-agent]
---

# Infrastructure engineering

## Purpose

Make the environment the app runs in reproducible, minimal, secure and affordable, defined
in version-controlled code that a reviewer can read and a `plan` can preview.

## When to use

- Containerizing an app or adding a local multi-service stack.
- Provisioning or changing cloud resources (compute, DB, storage, queues, networking, IAM).
- Introducing or refactoring IaC; hardening existing infrastructure.
- Setting up backups and restore procedures.

Do not use when:
- The platform is fully managed and needs only project settings (Vercel, Netlify):
  use `deployment` and `environment-management`.
- Only CI pipelines change: use `ci-cd`.
- Only env vars or secrets change: use `environment-management`.

## Inputs

- Architecture plan (services, data stores, traffic expectations, regions).
- Chosen provider(s) and existing accounts/projects (identifiers, never credentials).
- Budget constraints and compliance needs (data residency, encryption).

## Procedure

1. Inventory what exists: `Dockerfile*`, `compose*.yaml`, `*.tf`, `Pulumi.*`, `fly.toml`,
   `render.yaml`, Kubernetes manifests, cloud console notes. Extend; do not fork a second
   approach.
2. Containerize (if the target runs containers):
   - Multi-stage build: dependency install and build in a builder stage, copy only runtime
     artifacts into a slim final stage (`-slim`, distroless or alpine where compatible).
   - Pin base images by version tag at minimum, by digest for production.
   - Install from lockfile (`npm ci`, `pip install --require-hashes` when available).
   - Run as non-root (`USER node` or a created uid); no secrets in `ARG`/`ENV`/layers; use
     BuildKit secret mounts for build-time credentials.
   - `.dockerignore` excludes `.git`, `node_modules`, `.env*`, tests, local data.
   - `HEALTHCHECK` or platform health check pointing at the readiness endpoint.
   - Verify: `docker build -t app:local .`, `docker run --rm -p 3000:3000 app:local`,
     `curl -fsS localhost:3000/healthz`, `docker image inspect` for user and size,
     `trivy image app:local` if available.
3. Local stack: `compose.yaml` with app, DB, cache; named volumes; health-checked
   `depends_on`; ports bound to `127.0.0.1`.
4. IaC:
   - Structure: modules per concern, one state per environment, remote state backend with
     locking and encryption (state contains secrets; never commit it).
   - Pin provider and module versions; commit the lock file (`.terraform.lock.hcl`).
   - Run `terraform fmt -check`, `terraform validate` (or `tofu ...`), `tflint`, and an IaC
     scanner (Checkov or Trivy config).
   - Always `plan` and show the plan summary (add/change/destroy) before any `apply`.
5. Least privilege: one service identity per workload; scope policies to specific actions
   and resource ARNs/IDs; CI uses OIDC federation rather than long-lived keys; no wildcard
   admin policies.
6. Network: databases and caches in private networks, no public IPs; ingress via a load
   balancer or proxy with TLS; security groups with explicit ports.
7. Data: encryption at rest on, automated backups with retention, and one restore tested
   into a scratch instance before go-live.
8. Cost notes: for each new resource state SKU/tier, pricing model (hourly, per request,
   per GB), free-tier applicability, and the provider pricing page to confirm. Do not
   invent dollar figures; quote the provider's published price with its date, or say
   "check pricing page".
9. Authorization: `apply` that creates paid resources, changes IAM, touches DNS, or destroys
   anything requires explicit user approval with the exact command, environment, plan
   summary, cost note and rollback (`.ship-anything/policies/authorization.md`).
10. After an authorized apply, verify resources exist and work (CLI describe commands,
    health check) and record outputs (IDs, endpoints) in the report, not secrets.

## Decision rules

| Need | Default |
|---|---|
| Single web app, small team | Managed platform; IaC only for DB/storage if outside the platform |
| Several services + DB on one VM | Docker Compose + Caddy (automatic HTTPS) on a VPS |
| Multi-environment cloud resources | Terraform/OpenTofu modules + per-env state |
| Team prefers TypeScript/Python for infra | Pulumi |
| Kubernetes | Only when the user already runs it or scale requires it |
| Destroy shows in plan unexpectedly | Stop; investigate (renamed resource, provider change); use `moved` blocks |

## Tools

- Docker/BuildKit, docker compose, Podman. Terraform, OpenTofu, Pulumi, tflint, Checkov,
  Trivy. Provider CLIs (`aws`, `az`, `gcloud`, `flyctl`) for read-only inspection.

## Quality standards

- Images run as non-root and contain no secrets, build tools or source maps not needed.
- Every infra change has a reviewed plan output before apply.
- IAM policies list specific actions and resources.
- Cost note present for every resource that can bill.

## Common failures

- Applying without showing the plan, or applying to the wrong workspace/account.
- Committing `terraform.tfstate` or `.env` files.
- `latest` image tags in production.
- Public database endpoints "temporarily".
- Backups enabled but restore never tested.

## Outputs

- Dockerfile, `.dockerignore`, compose file, IaC modules, plan output summary.
- Infra notes: resources, identities, network diagram (text), cost notes, restore procedure.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Image builds and passes the local health check as non-root, with commands recorded.
- IaC formats, validates and plans cleanly; plan reviewed.
- Any apply was authorized and its result verified, or remains pending authorization.
