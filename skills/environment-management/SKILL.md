---
name: environment-management
description: >-
  Manages application configuration and secrets across environments: .env.example
  contracts, an environment matrix for dev, preview, staging and production, secret manager
  usage, client vs server variable exposure, and fail-fast config validation at boot with
  zod, envalid or pydantic-settings. Use when adding env vars, setting up a new environment,
  debugging "works locally but not in prod", or auditing config and secrets handling.
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [infrastructure-agent]
---

# Environment management

## Purpose

Make every environment's configuration explicit, validated and secret-safe, so a missing or
malformed variable fails loudly at startup instead of silently in production.

## When to use

- Adding, renaming or removing an environment variable or feature flag.
- Creating a new environment (preview, staging, production) or onboarding a developer.
- Configuration bugs that differ between environments.
- Auditing how secrets are stored and exposed.

Do not use when:
- Provisioning infrastructure: use `infrastructure-engineering`.
- Wiring CI secrets into pipelines specifically: use `ci-cd` (this skill defines which
  variables exist).
- A secret has leaked: follow `.ship-anything/policies/secrets.md` and `security-audit`.

## Inputs

- Code that reads config (`process.env`, `import.meta.env`, `os.environ`, `std::env`).
- Existing `.env*` files (read names only; never copy values into reports), platform env
  listings, secret manager inventory.
- Environment list and who owns each.

## Procedure

1. Inventory variables used in code:
   `grep -rnoE "process\.env\.[A-Z0-9_]+|import\.meta\.env\.[A-Z0-9_]+|os\.environ(\.get)?\(?\[?['\"][A-Z0-9_]+" src`
   (adapt per language). Compare with `.env.example` and platform listings
   (`vercel env ls`, `fly secrets list`, `gh secret list`), which show names only.
2. Write or update `.env.example`: every variable, empty or safe placeholder value, a comment
   with purpose, format, required/optional, and where the real value lives. Ensure `.env`,
   `.env.local`, `.env.*.local` are in `.gitignore`.
3. Build the environment matrix (Outputs) covering dev, preview, staging and production:
   value source per variable, whether it differs, and owner.
4. Add config validation at boot, in one module that the rest of the app imports:
   - TypeScript: zod (`z.object({...}).parse(process.env)`), `@t3-oss/env-*`, or envalid.
   - Python: pydantic-settings `BaseSettings`.
   - Go/Rust: typed config struct loaded with `envconfig`/`envy`/`figment`, error on missing.
   Validate types, URLs, enums, required-ness; fail fast with the variable name (never its
   value) in the error.
5. Separate client-exposed from server-only variables. Anything prefixed `NEXT_PUBLIC_`,
   `VITE_`, `PUBLIC_`, `EXPO_PUBLIC_` is shipped to browsers/apps: it must not hold secrets.
   Grep built bundles for server secret names as a check.
6. Secrets: store in the platform's env store or a secret manager (AWS Secrets Manager, GCP
   Secret Manager, Azure Key Vault, Doppler, 1Password, Infisical, Vault). Use separate
   credentials per environment; least-privilege keys; document rotation steps.
7. Setting or rotating real secret values, or reading secret stores, requires user
   authorization (`.ship-anything/policies/authorization.md`). Prepare the exact commands
   with placeholders (`vercel env add STRIPE_SECRET_KEY production`) for the user to run or
   approve; never echo values into the terminal transcript or files.
8. Verify: start the app with a variable removed and confirm a clear startup error; start
   with a complete env and confirm boot; run tests with the test env.
9. Document the matrix and onboarding steps in the README or `docs/configuration.md`.

## Decision rules

| Question | Rule |
|---|---|
| Is it secret? (grants access, costs money, identifies a person) | Secret store only; never in repo, client bundle or logs |
| Differs per environment? | Env var; otherwise a constant in code |
| Needed in the browser? | Public-prefixed var with non-secret value only |
| Preview deployments | Use non-production credentials and data; never prod DB |
| Local dev | `.env.local` from `.env.example`; test/sandbox keys only |
| Feature toggles | Flag service or env var with a documented default |

## Tools

- zod, envalid, `@t3-oss/env-nextjs`, pydantic-settings, dotenv/dotenvx.
- Platform CLIs: `vercel env`, `netlify env`, `fly secrets`, `railway variables`,
  `gh secret`. Secret managers listed above.
- `gitleaks` to confirm no secrets committed.

## Quality standards

- `.env.example`, validation schema and docs list the same variable set.
- App refuses to start with invalid config; error names the variable, not the value.
- No secret values in repo, reports, logs, screenshots or prompts.
- Production and non-production credentials are distinct.

## Common failures

- Secrets in `NEXT_PUBLIC_`/`VITE_` variables.
- Defaults that silently point production at a dev database.
- Validation that logs the whole `process.env` on failure.
- Variables added to code but not to `.env.example` or the platform.
- Copying production data or keys into preview environments.

## Outputs

- `.env.example`, config validation module, `.gitignore` entries.
- Environment matrix:

| Variable | Purpose | Secret | dev | preview | staging | production | Source |
|---|---|---|---|---|---|---|---|
| `DATABASE_URL` | Postgres connection | yes | local docker | preview DB | staging DB | prod DB | platform env |

- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Every variable read by code is in `.env.example`, the schema and the matrix.
- Boot-time validation exists and was shown to fail on a missing variable and pass on a
  complete set (commands and output recorded).
- Secret handling matches the secrets policy; pending secret changes are prepared as
  authorization requests.
