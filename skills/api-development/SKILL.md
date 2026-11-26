---
name: api-development
description: >-
  Designs and implements APIs contract-first (OpenAPI, GraphQL SDL, protobuf/AsyncAPI): picks
  the style (REST, GraphQL, WebSockets, gRPC, webhooks) from requirements, defines versioning,
  a consistent error model, pagination, idempotency keys and rate limits, then implements and
  verifies against the contract. Use when creating, extending, versioning or reviewing any
  API surface.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [architecture-agent, backend-agent, integration-agent]
---

# API development

## Purpose

Make the API contract the source of truth. Agree on it first, then generate types, mocks
and docs from it, implement it, and prove the implementation conforms. Consumers should
never discover the API's behaviour by trial and error.

## When to use

- Adding or changing endpoints, operations, events, messages or webhooks that other code,
  clients or partners consume.
- Choosing an API style, versioning scheme, auth scheme, pagination or error format.
- Splitting frontend/backend work across agents. The contract is the hand-off.

Do not use when:
- Only implementing handler internals behind an already agreed contract. Use `backend-development`.
- Consuming a third-party API. Use `integration-engineering`.
- Testing an existing API exhaustively. Use `api-testing`.

## Inputs

- Use cases and consumers (first-party web/mobile, partners, public), the data model, and
  auth model.
- Existing contracts (`openapi.yaml`, `schema.graphql`, `*.proto`, `asyncapi.yaml`) and
  API style guide, if any.
- Non-functional needs: latency, payload sizes, realtime needs, rate limits, compatibility
  promises.

## Procedure

1. **Inventory** existing contracts and conventions: naming (camelCase or snake_case),
   ID format, date format, error shape, auth, versioning. New work matches them.
2. **Choose the style** with `## Decision rules`. Record non-obvious choices in an ADR
   (`.ship-anything/templates/architecture-decision.md`).
3. **Write the contract first**, in the repo:
   - REST: OpenAPI 3.1 with schemas, examples, error responses and security schemes.
   - GraphQL: SDL with nullability chosen deliberately and input types for mutations.
   - gRPC: `.proto` (proto3) with field numbers never reused.
   - Events and webhooks: AsyncAPI or documented JSON Schemas plus a signature scheme.
4. **Lint the contract** (Spectral/Redocly for OpenAPI, graphql-inspector or eslint-graphql
   for SDL, `buf lint` for proto). Run a breaking-change check against the main branch
   (`oasdiff breaking`, `graphql-inspector diff`, `buf breaking`).
5. **Specify the cross-cutting rules** in the contract:
   - *Errors:* RFC 9457 `application/problem+json` (`type`, `title`, `status`, `detail`,
     `instance`, plus a stable machine `code`). Use GraphQL `errors[].extensions.code` and
     gRPC status codes with details.
   - *Pagination:* cursor-based (`limit`, opaque `cursor`/`next_cursor`) for mutable or
     large sets, with a documented max `limit`. Offset only for small, stable admin lists.
   - *Idempotency:* `Idempotency-Key` header on non-idempotent POSTs that create money,
     orders or messages. The server stores key + request hash + response for a documented
     window and returns the stored response on retry. Same key with a different body
     returns 409/422.
   - *Rate limits:* document limits per client or key. Return `429` with `Retry-After`. Expose
     remaining quota headers (`RateLimit-*` or the project's existing `X-RateLimit-*`).
   - *Versioning:* additive changes need no new version. Breaking changes need a new
     version: URL `/v2` or a header/date-based scheme matching the existing one. Announce
     deprecations with the `Deprecation` and `Sunset` headers and a removal date.
   - *Concurrency:* `ETag` + `If-Match` for update-in-place resources where lost updates
     matter.
6. **Generate** server stubs/types and client SDKs or types from the contract (openapi-typescript,
   orval, openapi-generator, graphql-codegen, buf generate). Publish a mock server
   (Prism, MSW) for parallel frontend work.
7. **Implement** handlers (`backend-development`). Authorization is checked per operation.
8. **Verify conformance.** Run contract tests (Schemathesis/Dredd against OpenAPI,
   schema-validation middleware in tests, or `buf` plus integration tests for gRPC).
   Call the running server and record real responses, including at least one error,
   paginated and rate-limited response.
9. **Document** with generated reference docs plus a short guide covering auth, errors,
   pagination, idempotency, limits and changelog.

## Decision rules

| Need | Choose | Notes |
|---|---|---|
| CRUD over resources, public/partner consumers, HTTP caching | REST + OpenAPI | Default choice |
| Many client shapes over a graph of data, first-party clients | GraphQL | Add depth/complexity limits and persisted queries. Handle N+1 with dataloaders |
| Internal service-to-service, low latency, streaming, polyglot | gRPC | Browsers need gRPC-Web or Connect |
| Bidirectional realtime (chat, collaboration, live cursors) | WebSockets | Plan auth on connect, heartbeats, reconnect and backpressure |
| Server → client one-way live updates | Server-Sent Events | Simpler than WebSockets; works over HTTP |
| Notify external systems of events | Webhooks | Sign payloads (HMAC-SHA256 + timestamp), retry with backoff, provide event IDs for dedup |
| TS monorepo, internal only | tRPC/server actions | Not for third-party consumers |

- Breaking changes (removing or renaming fields, tightening validation, changing types or
  semantics) are never shipped in place to existing consumers.
- Use nouns for resources and HTTP methods for actions. Use `PATCH` for partial updates and
  `PUT` for full replacement. Return `201` + `Location` on create.
- Do not invent a new error or pagination format when the API already has one.

## Tools

- Spectral, Redocly CLI, oasdiff, Prism, Schemathesis, openapi-typescript/orval,
  openapi-generator.
- GraphQL: graphql-codegen, graphql-inspector. gRPC: buf, grpcurl. Events: AsyncAPI CLI.
- `curl -i`, httpie, websocat for manual verification.
- Related skills: `backend-development`, `integration-engineering`, `api-testing`,
  `authentication-and-authorization`.

## Quality standards

- The contract is in the repo, passes lint, and passes the breaking-change check (or the
  break is versioned).
- Every operation documents auth, success and error responses with examples.
- List endpoints are paginated with a max page size. Create-type POSTs that move money or
  send messages accept idempotency keys.
- The implementation passes contract tests. Responses observed from the running server
  match the schema.

## Common failures

- Writing code first and back-filling a spec that no longer matches.
- Returning `200` with `{ "error": ... }`, or different error shapes per endpoint.
- Offset pagination on fast-changing data, causing skipped or duplicated items.
- Idempotency keys stored without the request hash, so a different payload replays an old
  response.
- GraphQL with no query cost limits. WebSockets with auth checked only at connect and
  never re-validated.
- Claiming conformance without running contract tests against a live server.

## Outputs

- Contract files, generated types/clients/mocks, handler implementations or stubs, and
  contract tests.
- API docs and changelog entry. ADR for style or versioning decisions.
- Agent report with lint, breaking-change and conformance results.

## Done when

- Contract linted, breaking-change check run, and the result recorded.
- Implementation passes contract tests, and real responses (success, error, paginated,
  429 if applicable) are captured.
- Consumers can generate a client from the contract.
- Report filed with status no higher than TESTED.
