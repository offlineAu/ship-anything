---
name: backend-development
description: >-
  Builds and changes server-side services: selects a runtime and framework from requirements
  (Node with Express/Fastify/NestJS/Hono, Python FastAPI/Django, Go, Rust, Laravel, .NET,
  Java), structures handlers, domain logic, persistence, background jobs, config, logging and
  error handling, and proves behaviour with tests. Use for APIs, workers, business logic and
  server bug fixes.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [backend-agent]
---

# Backend development

## Purpose

Deliver correct, observable, secure server code in the language and framework that fit the
requirements and the existing codebase. Keep the domain logic testable without HTTP or a
real database.

## When to use

- Implementing endpoints, services, domain logic, background jobs, queues, scheduled tasks or CLIs.
- Choosing a backend runtime and framework for a new service.
- Fixing server bugs, adding validation, logging, configuration or graceful shutdown.

Do not use when:
- The main work is designing the API contract. Use `api-development` first, then this skill.
- The main work is schema design or migrations. Use `database-engineering`.
- The main work is wiring a third-party provider (payments, email, webhooks). Use `integration-engineering`.
- The main work is login, sessions or permissions. Use `authentication-and-authorization`.
- The task is a full vertical slice including UI. Use `fullstack-development`.

## Inputs

- Task contract with acceptance criteria and `owns:` globs.
- API contract (OpenAPI/SDL/proto) if one exists, data model, non-functional requirements
  (latency, throughput, availability, data residency).
- Existing repo: manifest and lockfile, framework config, test setup, Dockerfile/CI, `.env.example`.

## Procedure

1. **Map the existing service.** Find entrypoint, routing, middleware chain, DI/container,
   data access layer, config loading, error handling and test conventions. Follow them.
2. **Baseline.** Run install from the lockfile, then lint, typecheck/compile and the test
   suite with the project's own commands (`npm test`, `pytest`, `go test ./...`,
   `cargo test`, `php artisan test`, `dotnet test`, `./gradlew test` or `mvn test`).
   Record pre-existing failures.
3. **Choose the stack (new services only)** with `## Decision rules`. Record the choice as
   an ADR (`.ship-anything/templates/architecture-decision.md`, logged in
   `.ship-anything/state/decisions.md`).
4. **Layer the code.** Transport (HTTP/gRPC/queue handler) → application service → domain →
   repositories/adapters. Handlers parse, validate and map errors. Domain code has no
   framework imports.
5. **Validate at the edge.** Use schema validation for every external input (body, query,
   headers, messages): zod/TypeBox, Pydantic, go-playground/validator, serde with explicit
   types, FormRequest, FluentValidation or Bean Validation. Reject unknown fields where the
   contract says so.
6. **Errors.** Use one error model (RFC 9457 problem details unless the project has one).
   Map domain errors to status codes in one place. Never leak stack traces or SQL to clients.
7. **Config and secrets.** Read config from env vars validated at startup and fail fast
   when one is missing. Document every variable by name in `.env.example` with empty values
   (`.ship-anything/policies/secrets.md`).
8. **Persistence.** Use the existing ORM or query builder. Keep transactions in the service
   layer. Use parameterised queries only. Schema changes go through `database-engineering`.
9. **Async work.** Anything slow or retryable goes to a queue or job runner. Make handlers
   idempotent and set timeouts on every outbound call.
10. **Observability.** Use structured logs (JSON) with request ID and no PII or secrets. Add
    health (`/healthz`) and readiness checks, and metrics or traces if the project has them.
11. **Test.** Unit-test domain logic. Integration-test handlers against a real database in a
    container or a disposable test DB. Add contract tests if an API spec exists.
12. **Run it.** Start the service locally, call changed endpoints (`curl -i` or httpie),
    and paste the status lines and response bodies (secrets redacted) into the report.

## Decision rules

| Requirement | Prefer |
|---|---|
| TypeScript team, simple API or BFF | Node + Fastify or Hono (Hono also for edge/Workers/Bun) |
| Existing Express codebase | Keep Express. Do not migrate without an ADR |
| Large TS team, modules/DI, enterprise conventions | NestJS |
| Data/ML-adjacent, typed async API | Python FastAPI |
| Admin-heavy CRUD, batteries included, ORM + admin | Django (+ DRF) or Laravel |
| High concurrency, small static binaries, infra tooling | Go (net/http, chi, or the existing router) |
| Strict performance/memory or safety, CPU-heavy work | Rust (axum) |
| Microsoft ecosystem, enterprise | .NET (ASP.NET Core minimal APIs) |
| JVM ecosystem, enterprise integrations | Java/Kotlin + Spring Boot |

- Stack choice depends on team skills, hosting target, the library ecosystem the product
  needs, and existing code, in that order. Do not choose on hype.
- Serverless versus long-running: choose serverless for spiky, stateless request/response.
  Choose long-running for WebSockets, heavy background work or connection-pool-sensitive
  databases.
- Monolith first. Split a service out only for a demonstrated scaling, ownership or
  isolation need, and record that need in an ADR.

## Tools

- Language toolchains and the project's test runners. Docker or Testcontainers for real
  dependencies in tests. `curl`, httpie or the framework's test client.
- Linters/formatters already configured (ESLint/Biome, ruff, golangci-lint, clippy, Pint,
  dotnet format, Spotless).
- Related skills: `api-development`, `database-engineering`, `authentication-and-authorization`,
  `integration-engineering`, `api-testing`, `performance-optimization`.

## Quality standards

- Every external input is validated. Every outbound call has a timeout. Every handler has
  an error path test.
- No secrets in code, logs or reports. No string-built SQL. Authorization is checked
  server-side on every protected route.
- Graceful shutdown drains in-flight requests and jobs.
- Tests are deterministic: no reliance on wall clock, network or test order.

## Common failures

- Business logic in controllers, which makes it untestable without HTTP.
- N+1 queries hidden by the ORM. Check query logs for changed endpoints.
- Swallowed errors (`catch {}`) and generic 500s with no log correlation ID.
- Unbounded list endpoints (no pagination or limit).
- Claiming an endpoint works based on unit tests only, without calling the running service.

## Outputs

- Code, tests, updated `.env.example`, and any OpenAPI or doc updates inside `owns:` globs.
- Agent report listing commands run with real results and sample request/response pairs.
- ADR for stack or architecture decisions.

## Done when

- Acceptance criteria are demonstrated by passing tests and real requests against the
  running service.
- Lint, typecheck/compile and the full test suite pass (pre-existing failures documented).
- Config is documented by name. Logs contain no secrets.
- Report filed. Status is no higher than TESTED until independently verified.
