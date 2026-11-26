---
name: integration-engineering
description: >-
  Connects products to third-party services (payments, email/SMS, storage, CRMs, analytics,
  AI APIs, OAuth providers) safely: uses sandbox/test keys, verifies webhook signatures,
  writes idempotent handlers, retries with exponential backoff, references secrets only by
  env var name, keeps the provider abstraction thin, and records which calls are mocked
  versus live-verified. Use for any external API, SDK or webhook integration.
license: MIT
metadata:
  category: software-engineering
  version: "0.1.0"
  agents: [integration-agent]
---

# Integration engineering

## Purpose

Make external dependencies reliable and honest. The integration handles provider failures,
duplicate deliveries and slow responses. It never leaks credentials. Every claim about
behaviour states whether it was observed against the provider's sandbox or only against a
mock.

## When to use

- Adding or changing calls to a third-party API or SDK (Stripe, Paddle, Resend, Twilio,
  S3/R2, Slack, HubSpot, OpenAI/Anthropic, maps, search).
- Receiving webhooks or events from a provider.
- Swapping providers, or adding a fallback provider.

Do not use when:
- Designing your own API for others to call. Use `api-development`.
- Implementing sign-in with an identity provider. Use `authentication-and-authorization`
  (this skill may assist with the provider wiring).
- Provisioning paid accounts or plans. That needs user authorization and is not
  integration code.

## Inputs

- Task contract, provider choice (or criteria for choosing), and the provider's official
  API docs and SDK version.
- Env var **names** for credentials and where they live (`.ship-anything/policies/secrets.md`).
- Whether sandbox/test-mode credentials are available to this session.

## Procedure

1. **Read the provider docs** for auth, rate limits, idempotency support, webhook signing,
   API versioning and sandbox behaviour. Pin the SDK version and, where offered, the API
   version (e.g. a dated version header).
2. **Credentials.** Read keys only from env vars (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`).
   Add the names to `.env.example` with empty values. Never hardcode, log, echo or paste key
   values, including in tests, fixtures, reports and commit messages. Use test/sandbox keys
   (`sk_test_…`-style) for development. Do not create or rotate keys without authorization
   (`.ship-anything/policies/authorization.md`).
3. **Thin adapter.** Wrap the provider in a small module exposing only the operations the
   app needs, in domain terms (`chargeCustomer`, `sendReceipt`). Map provider errors to
   domain errors. Do not build a generic multi-provider framework unless two providers are
   actually required.
4. **Outbound calls.** Set explicit timeouts. Retry only idempotent or idempotency-keyed
   requests, on transient failures (network errors, 408, 429, 5xx), with exponential backoff
   and jitter and a capped attempt count. Honour `Retry-After`. Pass the provider's
   idempotency key on creates and derive it from your own stable operation ID.
5. **Webhooks.**
   - Verify the signature over the **raw** request body with the provider's SDK or documented
     HMAC scheme. Use constant-time comparison and reject stale timestamps (tolerance per
     provider docs).
   - Respond `2xx` fast. Enqueue the work and process it asynchronously.
   - Make handlers idempotent: store processed event IDs with a unique constraint and skip
     duplicates. Do not assume ordering; re-fetch the object from the API when state matters.
   - Log the event ID and type, never the full payload if it contains PII.
6. **Failure modes.** Decide per call what happens on provider outage (queue and retry,
   degrade, or fail the user action) and implement it. Add a dead-letter or alert path for
   exhausted retries.
7. **Tests.**
   - Unit-test the adapter with recorded fixtures or mocks (MSW, nock, responses, VCR-style
     cassettes with secrets scrubbed).
   - Test webhook signature verification with a valid, a tampered and an expired payload.
   - Test duplicate webhook delivery and out-of-order delivery.
8. **Live verification (sandbox).** If test credentials are available, run the real flow
   against the sandbox (e.g. the provider CLI's webhook forwarding, test cards, a test
   inbox). Capture the IDs and status codes with secrets redacted.
9. **Record verification status.** In the report, include a table listing every external
   call: `operation | mocked | sandbox-verified | live-verified | evidence`. Never describe a
   mocked call as working against the provider.

## Decision rules

| Situation | Do |
|---|---|
| No sandbox credentials in session | Implement against mocks. Mark calls `mocked`. Status cannot exceed TESTED. List what the user must provide |
| Provider offers official SDK | Use it, pinned. Raw HTTP only if the SDK is unmaintained or too heavy for the runtime |
| Provider supports idempotency keys | Always send them on creates |
| Provider does not | Dedup on your side before calling (store intent + status) |
| Webhook and API response disagree | Treat the API (re-fetched) as source of truth |
| Call costs money or contacts real people (live charges, real SMS/email) | Requires explicit user authorization. Use test mode otherwise |
| Choosing between providers | Compare on required features, pricing model, data residency, SDK quality and lock-in. Record in an ADR |

## Tools

- Provider CLIs and dashboards in test mode (e.g. Stripe CLI `stripe listen` /
  `stripe trigger`). Mock tools: MSW, nock, WireMock, `responses`, Prism.
- Tunnel tools for local webhook testing, run only with user consent.
- Related skills: `api-development`, `authentication-and-authorization`, `api-testing`,
  `backend-development`.

## Quality standards

- Zero secret values in the repo, logs, tests or reports. Only env var names appear.
- Every webhook endpoint verifies signatures and is idempotent, with tests proving both.
- Every outbound call has a timeout. Retries are bounded and only on safe or keyed requests.
- The verification table is present and accurate.

## Common failures

- Parsing JSON before signature verification, which changes the raw body and breaks the
  signature check.
- Retrying a non-idempotent create and double-charging or double-sending.
- Long synchronous work in the webhook handler, causing provider timeouts and redelivery
  storms.
- Test keys committed in fixtures, or live keys used in development.
- Over-abstracted "provider-agnostic" layers that hide provider-specific semantics.
- Reporting "payments work" when only mocks were exercised.

## Outputs

- Adapter module, webhook handlers, queue/job wiring, tests and fixtures (scrubbed), and
  `.env.example` entries.
- Agent report with the mocked/sandbox/live verification table and the setup steps the user
  must do (keys, webhook endpoint registration).

## Done when

- Adapter and webhook tests pass, including tampered-signature and duplicate-delivery cases.
- Each external call is marked mocked, sandbox-verified or live-verified with evidence.
- No secret values appear anywhere. Required env var names are documented.
- Report filed with status no higher than TESTED.
