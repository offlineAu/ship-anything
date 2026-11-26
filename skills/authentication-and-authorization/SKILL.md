---
name: authentication-and-authorization
description: >-
  Implements sign-in, sessions and permissions with established providers and libraries
  rather than custom crypto: chooses session cookies vs JWTs, OAuth 2.0/OIDC with PKCE,
  argon2id/bcrypt password hashing, MFA/passkeys, RBAC or ABAC with an authorization matrix,
  CSRF protection and secure cookie flags, enforced server-side on every request. Use for
  login, signup, SSO, roles, permissions and access-control bugs.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [backend-agent, integration-agent, security-agent]
---

# Authentication and authorization

## Purpose

Establish who the caller is (authentication) and what they may do (authorization), with
well-reviewed building blocks, explicit rules and tests that prove denial as well as
access.

## When to use

- Adding or changing login, signup, logout, password reset, email verification, SSO,
  social login, MFA, passkeys or API keys.
- Defining roles, permissions, tenancy isolation or resource ownership checks.
- Fixing access-control bugs (IDOR, privilege escalation, session fixation).

Do not use when:
- Doing a broad security review. Use `security-audit`, which may call into this skill.
- Only consuming an already-authenticated user object in UI code. Use `frontend-development`.
- Wiring a non-identity third-party API. Use `integration-engineering`.

## Inputs

- User types, tenancy model, resources and actions. Compliance needs (e.g. SSO/SAML for
  enterprise, audit logs).
- Existing auth stack (library, provider, session store), client types (browser, mobile,
  CLI, service-to-service).
- Provider credentials by env var **name** only (`.ship-anything/policies/secrets.md`).

## Procedure

1. **Inventory** current auth: library or provider, where sessions or tokens are created
   and validated, middleware, role storage, and every route's protection. Keep the existing
   stack unless an ADR (`.ship-anything/templates/architecture-decision.md`) justifies change.
2. **Choose building blocks** with `## Decision rules`. Prefer a managed provider (Auth0,
   Clerk, Cognito, Firebase Auth, Supabase Auth, WorkOS, Keycloak) or a mature framework
   library (Auth.js, Better Auth, Lucia-style patterns, Django auth/allauth, Laravel
   Fortify/Sanctum, Spring Security, ASP.NET Core Identity, Devise). Never implement your
   own crypto, token format or password hashing.
3. **Write the authorization matrix** before coding: rows = roles or attributes, columns =
   resource × action, cells = allow / deny / condition (e.g. "own records only", "same
   tenant"). Store it in the repo (doc or policy file) and make it the test source.
4. **Authentication details.**
   - Passwords: argon2id (preferred) or bcrypt via the library. Enforce minimum length
     (NIST SP 800-63B: at least 8, allow at least 64). Check against breached-password
     lists. Use no composition rules or forced periodic rotation.
   - OAuth/OIDC: Authorization Code flow with PKCE (S256) for all clients. Validate `state`
     and `nonce`, and validate ID token `iss`, `aud`, `exp` and signature via JWKS. No
     implicit flow.
   - MFA: TOTP or WebAuthn/passkeys, with recovery codes stored hashed. Avoid SMS as the only
     second factor.
   - Login, reset and verify endpoints: rate-limit and lock out progressively, return
     generic errors ("invalid credentials"), and use single-use, short-lived reset tokens
     stored hashed.
   - On login and privilege change: rotate the session ID. On logout and password change:
     invalidate sessions server-side.
5. **Sessions and cookies.** Set `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`),
   `Path=/`, and the `__Host-` prefix where possible, with a bounded lifetime plus idle
   timeout. No tokens in `localStorage` for browser apps.
6. **CSRF.** For cookie-authenticated state-changing requests, use framework CSRF tokens or
   the synchronizer/double-submit pattern plus `SameSite`. Verify `Origin`. Never use GET
   for mutations.
7. **Enforce authorization server-side on every request.** Use central middleware or a
   policy layer (CASL, Casbin, Oso, Cerbos, OpenFGA, Pundit, Django permissions, Laravel
   Policies, Spring `@PreAuthorize`). Each handler also checks resource ownership or tenant,
   and scopes queries by tenant (or uses DB RLS). Deny by default.
8. **Service and API auth.** Use scoped, revocable API keys stored hashed and shown once, or
   OAuth client credentials. For JWTs: short expiry, allow-listed `alg`, verified `aud`/`iss`,
   and rotated signing keys.
9. **Test.** Generate tests from the matrix. For each protected operation, assert one
   allowed case and at least one denied case (other user, other tenant, lower role,
   anonymous). Cover CSRF rejection, expired or tampered tokens, session invalidation and
   lockout.
10. **Verify live.** Run the real login flow locally (with the provider in test or dev mode),
    inspect cookies in devtools or `curl -i`, and attempt cross-user access with a second
    account. Record the results.

## Decision rules

| Context | Prefer |
|---|---|
| Server-rendered or same-site web app | Server-side sessions (opaque ID in cookie, store in DB/Redis). Simple revocation |
| SPA + own API on same site | Cookie session via BFF. Avoid browser-held JWTs |
| Mobile/native or third-party clients | OAuth 2.0 + PKCE. Short-lived access token, rotating refresh token in secure OS storage |
| Service-to-service, stateless verification at scale | Short-lived JWTs (minutes) or mTLS. Accept that revocation is limited to the expiry |
| B2B/enterprise customers | OIDC/SAML SSO via provider (WorkOS, Auth0, Keycloak). SCIM if required |
| Few fixed roles | RBAC |
| Ownership, tenancy, time or attribute conditions | ABAC or ReBAC (policy engine or relationship model) |

- Building auth in-house is justified only when a provider cannot meet a stated requirement
  (cost, residency, offline). Record the reason in an ADR. Even then, use libraries for
  hashing, tokens and WebAuthn.
- Hiding UI elements is cosmetic, never authorization.
- Creating provider apps, rotating keys or changing IAM needs user authorization
  (`.ship-anything/policies/authorization.md`).

## Tools

- Provider SDKs/CLIs in dev or test tenants, the framework auth libraries listed above, and
  policy engines.
- Browser devtools (Application → Cookies), `curl -i`, and jwt decoding with a local tool
  only (never paste tokens into websites).
- Related skills: `security-audit`, `backend-development`, `integration-engineering`,
  `api-development`.

## Quality standards

- Matrix exists and every protected operation has allowed and denied tests.
- OWASP ASVS-aligned basics: no plaintext or reversible passwords, rotated session IDs,
  secure cookie flags, CSRF protection, rate-limited auth endpoints, generic auth errors.
- No secrets, tokens or password hashes in logs or reports.
- Tenancy isolation is enforced at the query or RLS level, not only in the UI.

## Common failures

- Authorization checked in middleware for the route but not for the specific resource ID
  (IDOR).
- JWT `alg: none` or HS/RS confusion accepted. No `aud` check.
- Long-lived JWTs with no revocation story, or refresh tokens that never rotate.
- OAuth callback without `state` validation. PKCE missing on public clients.
- Password reset tokens that are reusable, long-lived or stored in plaintext.
- Reporting "auth works" after testing only the happy path with one admin user.

## Outputs

- Auth configuration and code, the authorization matrix, policy code, tests and
  `.env.example` names.
- Agent report with allowed/denied test results and live cookie/flow evidence (redacted).
- ADR for provider or session-model choices.

## Done when

- Login, logout and relevant flows work in a real local run with evidence.
- Every matrix cell that matters has a passing test, including denials.
- Cookie flags and CSRF protection are verified. No custom crypto was introduced.
- Report filed with status no higher than TESTED. Security-agent review is requested for
  new auth surfaces.
