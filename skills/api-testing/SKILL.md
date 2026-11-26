---
name: api-testing
description: >-
  Tests HTTP, GraphQL, gRPC and webhook APIs against their contract: status codes, schemas,
  error formats, authentication and authorization per role, validation, pagination,
  idempotency, rate limits and backward compatibility, using OpenAPI-driven and contract
  tests. Use when verifying an API, an integration with a third-party API, a webhook
  consumer, or when asked to "test the endpoints" or "check the API contract".
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [integration-agent, qa-agent]
---

# API testing

## Purpose

Prove that an API does what its contract says for every caller who can reach it, including
callers who should be refused, and that changes do not break existing consumers.

## When to use

- A new or changed endpoint, resolver, RPC or webhook handler needs verification.
- An integration with an external API needs contract or sandbox tests.
- An OpenAPI/GraphQL schema changed and consumers might break.
- QA needs API-level evidence for acceptance criteria.

Do not use when:
- Designing the API itself: use `api-development`.
- A deep security assessment is required: use `security-audit` (this skill covers authz
  smoke checks only).
- Throughput or latency targets are the question: use `performance-optimization`.
- The target is a production third-party API with real side effects (charges, emails) and no
  sandbox. Ask the user first.

## Inputs

- Contract: OpenAPI/AsyncAPI spec, GraphQL schema, `.proto`, or documented examples.
- Base URL of a local or test environment; never production unless the user authorizes
  read-only checks there.
- Test identities for each role, by env var name (`TEST_ADMIN_TOKEN`), and fixture data.

## Procedure

1. Inventory endpoints from the contract and from the router code; list endpoints present in
   code but missing from the contract (and the reverse) as findings.
2. Start the API from a clean build with a seeded test database. Record commit and config.
3. For each endpoint write tests covering:
   - Happy path: status, headers (`Content-Type`, caching, `Location`), body validated
     against the schema (Ajv/zod for JSON Schema, `jsonschema` in Python).
   - Validation: missing, wrong-type, oversized, boundary and unicode inputs give 400/422
     with the documented error shape, not 500.
   - Authentication: no token, expired token, malformed token give 401.
   - Authorization: each role, plus another user's resource ID (IDOR), gives 403/404 as
     specified. Build a role x endpoint matrix.
   - Not found, method not allowed, conflict (409) and precondition cases.
   - Pagination: first/last page, empty page, stable ordering, limit caps.
   - Idempotency: retries of POST with idempotency keys, PUT/DELETE repeated.
   - Concurrency: two simultaneous updates; check for lost updates or duplicate rows.
   - Rate limits: 429 with `Retry-After` when documented.
4. Webhooks: verify signature checking (bad signature rejected), replay protection
   (timestamp tolerance), duplicate-delivery handling, and that the handler responds fast
   and processes asynchronously when the provider requires it.
5. Third-party integrations: use the provider's sandbox or test mode; record request/response
   fixtures with secrets redacted; add a contract test (Pact or schema check) so provider
   drift is detected.
6. Backward compatibility: diff the old and new spec (`oasdiff breaking old.yaml new.yaml`,
   `graphql-inspector diff`, `buf breaking`). Breaking changes need a version bump or a
   documented migration.
7. Fuzz from the schema when the API is public-facing: `schemathesis run openapi.yaml
   --url <base>` against a test environment only.
8. Run the suite twice from scratch; record pass/fail counts and any flaky test.
9. Report findings with the exact request (method, path, redacted headers, body) and the
   actual response.

## Decision rules

| Situation | Approach |
|---|---|
| Spec exists | Generate schema assertions from it; spec is the oracle |
| No spec | Write examples-based tests, then propose a spec as a finding |
| Internal service consumed by another team | Consumer-driven contract tests (Pact) |
| 500 on bad input | Always a bug (input validation or error handling) |
| Response leaks stack traces, SQL, internal IDs or other users' data | High severity; hand to `security-audit` |
| Endpoint undocumented but reachable | Finding: document it or remove it |
| External API with no sandbox | Mock at the HTTP boundary (msw, nock, WireMock, respx); flag the residual risk |

## Tools

- Runners: the project's test framework with supertest, httpx/pytest, REST Assured, Go
  `net/http/httptest`.
- Collections: Bruno, Hurl, Postman/Newman (only if already used).
- Contract and diff: Pact, oasdiff, graphql-inspector, buf.
- Fuzzing: Schemathesis.
- Mocks: msw, nock, WireMock, respx.

## Quality standards

- Assertions check status, schema and the important fields, not only `200`.
- Every role in the system appears in the authorization matrix.
- No real secrets or customer data in fixtures, recordings or reports
  (`.ship-anything/policies/secrets.md`).
- Tests clean up or isolate their data; they pass in any order.

## Common failures

- Testing only as an admin user, so authorization bugs never show.
- Accepting a 200 with an error message in the body as success.
- Snapshotting whole responses including timestamps, making tests brittle.
- Hitting live payment or email APIs during tests.
- Ignoring endpoints that exist in code but not in the spec.

## Outputs

- API test files, updated spec (if gaps were found), recorded fixtures.
- Role x endpoint authorization matrix with results.
- Findings list: request, expected, actual, severity.
- Agent report per `.ship-anything/templates/agent-report.md` with commands and real results.

## Done when

- Every endpoint in scope has happy, validation, authn and authz tests that you ran.
- Spec and implementation agree, or each mismatch is filed.
- Breaking-change check ran and its output is in the report.
- The suite passed twice from a clean start, or failures are filed as bugs.
