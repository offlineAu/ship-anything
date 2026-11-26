# OWASP audit checklist

Loaded on demand by `security-audit` (procedure step 6). Mark each line pass / fail / N/A /
not checked, with evidence for fail and pass on anything security-critical.

Mapping keys:
- **Top 10 (2021)**: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection,
  A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated
  Components, A07 Identification and Authentication Failures, A08 Software and Data
  Integrity Failures, A09 Security Logging and Monitoring Failures, A10 SSRF.
  If the project tracks the newer 2025 edition, map by category name; the categories were
  reordered and partly merged (for example SSRF folded into access control, and supply-chain
  failures got their own category), so do not reuse the 2021 numbers blindly.
- **ASVS**: chapter references below use ASVS 4.0.3 numbering (V2 Authentication, V3 Session,
  V4 Access Control, V5 Validation/Encoding, V6 Cryptography, V7 Errors/Logging, V8 Data
  Protection, V9 Communication, V10 Malicious Code, V12 Files, V13 API, V14 Configuration).
  For ASVS 5.0 projects, map by chapter name.
- Target level: ASVS L1 for all apps, L2 for apps handling personal or financial data.

## Authentication — A07, ASVS V2
- [ ] Passwords hashed with Argon2id, scrypt or bcrypt (cost tuned); never plain SHA/MD5.
- [ ] Minimum length 8 (12+ recommended without MFA), long passphrases allowed, checked against breached-password lists; no forced composition rules.
- [ ] Login, reset and MFA endpoints rate-limited and protected against enumeration (same response and similar timing for unknown users).
- [ ] Password reset tokens single-use, short-lived, high-entropy, invalidated on use and on password change.
- [ ] MFA available for privileged accounts; recovery codes hashed.
- [ ] OAuth/OIDC: `state` and PKCE used, redirect URIs exact-match allowlisted, ID token signature, `iss`, `aud`, `exp`, `nonce` validated.
- [ ] JWTs: algorithm pinned server-side (no `alg: none`, no HS/RS confusion), expiry enforced, keys rotated.

## Authorization, role permissions, access control — A01, ASVS V4
- [ ] Deny by default; every route/resolver/RPC has an explicit check on the server.
- [ ] Object-level checks: resource ownership or tenant verified on every read/update/delete (IDOR test with a second user).
- [ ] Function-level checks: non-admin roles get 403 on admin endpoints, including hidden or undocumented ones.
- [ ] Field-level: mass assignment blocked (allowlisted fields; `role`, `isAdmin`, `tenantId` not client-settable).
- [ ] Multi-tenant isolation enforced in queries (row-level security or mandatory tenant filter), tested across tenants.
- [ ] Role matrix documented and matches implementation.
- [ ] Directory listing off; static files and storage buckets not publicly listable unless intended.

## Input validation — A03, ASVS V5
- [ ] Server-side validation with schemas (zod, pydantic, JSON Schema) on every input: body, query, headers, path, cookies.
- [ ] Size limits on bodies, arrays, strings, uploads; pagination limits capped.
- [ ] Types and enums enforced; unknown fields rejected or stripped.
- [ ] Business-logic limits (negative quantities, price tampering, replayed coupons).

## Output encoding and XSS — A03, ASVS V5
- [ ] Framework auto-escaping in use; every `dangerouslySetInnerHTML`, `v-html`, `innerHTML`, `|safe` reviewed and sanitized (DOMPurify).
- [ ] User-controlled URLs restricted to `http(s):` (no `javascript:`).
- [ ] Content-Security-Policy set (no `unsafe-inline` for scripts where feasible; nonces or hashes).
- [ ] JSON responses served with `application/json`; no user data reflected into HTML or script contexts unencoded.

## Injection: SQL, NoSQL, command, template — A03, ASVS V5
- [ ] Parameterized queries or ORM bindings everywhere; grep for string-built SQL (`${`, `+`, `f"`, `%s` with raw SQL).
- [ ] NoSQL operators from user input blocked (`$where`, `$ne`, `$gt` objects).
- [ ] No shell execution with user input; if unavoidable, argument arrays without a shell.
- [ ] No server-side template rendering of user-supplied templates; no `eval`/`Function` on input.
- [ ] LDAP, XPath, header (CRLF) injection considered where those sinks exist.

## CSRF — A01, ASVS V4/V3
- [ ] Cookie-authenticated state-changing requests protected by SameSite=Lax/Strict plus CSRF token or origin check.
- [ ] No state changes on GET.
- [ ] CORS: no wildcard origin with credentials; allowlist exact origins.

## SSRF — A10, ASVS V5/V12
- [ ] Server-side URL fetches (webhooks, previews, imports) use an allowlist of hosts/schemes.
- [ ] Private, loopback, link-local and metadata addresses blocked after DNS resolution (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 incl. 169.254.169.254, ::1, fc00::/7, fe80::/10); redirects re-checked.
- [ ] Cloud metadata endpoint hardened (IMDSv2 required on AWS).

## File uploads — A04, ASVS V12
- [ ] Type checked by content (magic bytes), not just extension or `Content-Type`.
- [ ] Size and count limits; decompression bombs and image pixel-flood limits.
- [ ] Stored outside the web root or in object storage with random names; served with `Content-Disposition: attachment` or from a separate domain.
- [ ] SVG/HTML uploads sanitized or blocked; path traversal (`../`) in names rejected.
- [ ] Malware scanning where users share files with each other.

## API security — A01/A04, ASVS V13
- [ ] Authentication required on every non-public endpoint, including GraphQL introspection in production (disable or restrict).
- [ ] GraphQL depth/complexity limits; batching limits.
- [ ] Rate limiting and quotas per user and per IP.
- [ ] Responses return only needed fields (no full ORM objects, password hashes, internal flags).
- [ ] Webhooks verify signatures and timestamps.
- [ ] API keys scoped, revocable, stored hashed.

## Session handling — A07, ASVS V3
- [ ] Cookies `Secure`, `HttpOnly`, `SameSite`; `__Host-` prefix where possible.
- [ ] Session ID rotated on login and privilege change; invalidated on logout and password change server-side.
- [ ] Idle and absolute timeouts defined.
- [ ] Tokens not stored in `localStorage` when an XSS would make that catastrophic; not in URLs.

## Secrets — A02/A05, ASVS V6/V14
- [ ] No secrets in source, git history, images, client bundles (`NEXT_PUBLIC_`, `VITE_` prefixes reviewed), logs or error pages.
- [ ] Secrets loaded from env or a secret manager; `.env*` gitignored; `.env.example` has no values.
- [ ] Separate credentials per environment; least-privilege API keys.

## Cryptography and transport — A02, ASVS V6/V9
- [ ] TLS everywhere; HSTS on production domains.
- [ ] Sensitive data at rest encrypted where required; keys not stored beside data.
- [ ] Random values from a CSPRNG; no home-grown crypto.

## Dependency vulnerabilities and integrity — A06/A08, ASVS V10/V14
- [ ] Audit tools run (npm/pnpm audit, pip-audit, cargo audit, govulncheck, osv-scanner); high/critical triaged for reachability.
- [ ] Lockfiles committed; installs use frozen lockfiles in CI.
- [ ] CI actions pinned to commit SHAs; third-party scripts loaded with SRI or self-hosted.
- [ ] Deserialization of untrusted data avoided (pickle, Java serialization, YAML `load`).

## Insecure configuration — A05, ASVS V14
- [ ] Debug mode, stack traces, admin consoles and default credentials off in production.
- [ ] Security headers: CSP, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, frame protection (`frame-ancestors`).
- [ ] Error responses generic; details only in server logs.
- [ ] Unused endpoints, sample apps and ports removed.

## Data exposure and privacy — A02/A04, ASVS V8
- [ ] Data classified; PII minimized and retention defined.
- [ ] Caching headers prevent sensitive responses being cached by shared caches.
- [ ] Exports, backups and analytics events exclude secrets and unnecessary PII.

## Sensitive logging and monitoring — A09, ASVS V7
- [ ] Logs exclude passwords, tokens, full card numbers, session IDs, secrets; PII masked.
- [ ] Security events logged: login success/failure, privilege changes, access denied, admin actions.
- [ ] Log injection prevented (structured logging, newline handling).
- [ ] Alerts exist for auth-failure spikes and error spikes (`observability`).

## Infrastructure — A05, ASVS V14
- [ ] IAM least privilege; no wildcard `*:*` policies; no long-lived keys in CI (use OIDC).
- [ ] Storage buckets private by default; public access blocks on.
- [ ] Databases not exposed to the internet; security groups/firewalls minimal.
- [ ] Containers run as non-root, read-only filesystem where possible, images scanned.
- [ ] CI `permissions:` minimal; `pull_request_target` workflows do not run untrusted code with secrets.
