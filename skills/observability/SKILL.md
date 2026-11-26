---
name: observability
description: >-
  Instruments and monitors running services: health and readiness endpoints, structured
  logs without PII or secrets, error tracking with Sentry or OpenTelemetry, metrics and
  traces, uptime checks, SLOs with burn-rate alerting, and proof that signals actually
  arrive. Use when preparing a service for production, after an incident, when adding
  monitoring or alerts, or when asked "how will we know if it breaks?".
license: MIT
metadata:
  category: delivery
  version: "0.1.0"
  agents: [monitoring-agent]
---

# Observability

## Purpose

Make production behaviour visible: know within minutes that users are affected, and have
the logs, traces and metrics to find out why, without leaking personal data or secrets.

## When to use

- Before go-live (`production-readiness` requires it).
- Adding a new service, job, queue consumer or third-party dependency.
- After an incident revealed a blind spot.
- Defining SLOs, alerts or dashboards.

Do not use when:
- Diagnosing a specific slow path with a profiler: use `performance-optimization`.
- Local debugging prints during development.
- Product analytics and marketing tracking (different consent and data rules).

## Inputs

- Service list, critical user journeys, dependencies (DB, queues, third-party APIs).
- Hosting platform and existing tooling (platform logs, APM, Sentry, Grafana, Datadog).
- Availability or latency expectations from the user or contract.

## Procedure

1. Health endpoints:
   - Liveness `GET /healthz`: process is up; no dependency calls; returns 200 fast.
   - Readiness `GET /readyz`: checks critical dependencies (DB ping, cache) with short
     timeouts; returns 503 when not ready. No secrets or stack traces in the body.
   - Version endpoint or header exposing commit SHA/version for deploy verification.
2. Structured logging: JSON logs via the stack's logger (pino, structlog, zap, tracing),
   with timestamp, level, service, environment, version, request/trace ID, route, status,
   duration. Configure redaction for `authorization`, `cookie`, `password`, `token`,
   `secret`, card numbers and emails; log user IDs, not personal data. Avoid logging full
   request/response bodies.
3. Error tracking: Sentry SDK or OpenTelemetry exporter to the chosen backend. Set
   `environment` and `release`, upload source maps privately (not public), scrub PII
   (`sendDefaultPii: false`, `beforeSend` scrubbing), sample rates stated explicitly.
4. Metrics and traces: RED metrics per endpoint (rate, errors, duration histograms), USE for
   resources (utilization, saturation, errors), queue depth and age, job success/failure.
   OpenTelemetry SDK with auto-instrumentation for HTTP/DB where available; propagate trace
   context across services.
5. Uptime checks: external synthetic checks on the public URL and `/readyz` from more than
   one region, plus a check of one critical journey (login or checkout) if the tool supports it.
6. SLOs: pick SLIs from user-facing signals (availability = good requests / valid
   requests; latency = share of requests under a threshold). The target value is the user's
   decision; propose options and record the choice. Derive an error budget.
7. Alerting: alert on symptoms users feel (SLO burn rate, uptime failure, error-rate spike),
   not on every cause. Use multi-window burn-rate alerts when SLOs exist. Each alert has a
   severity, a route (on-call, channel), and a runbook link. Creating paid monitoring
   resources or sending alerts to real people's channels needs user authorization.
8. Verify signals arrive end to end, in the target environment:
   - Hit `/healthz` and `/readyz`; record responses.
   - Trigger a test error (a guarded debug route or SDK test event) and confirm it appears in
     the error tracker with release and environment tags.
   - Find a specific request's log line by its request ID in the log backend.
   - Confirm metrics series appear on the dashboard.
   - Fire a test alert (or use the tool's "test notification") and confirm it reaches the
     configured route.
9. Write the runbook: what each alert means, first checks, dashboards, rollback pointer.

## Decision rules

| Situation | Choice |
|---|---|
| Small app on a managed platform | Platform logs + Sentry + external uptime check |
| Several services | OpenTelemetry traces + metrics to one backend; shared trace IDs |
| Vendor-neutral requirement | OpenTelemetry SDK + collector; swap exporters later |
| Background jobs/cron | Heartbeat (dead-man's switch) monitor + failure metric |
| Third-party dependency | Timeout, error metric and circuit/fallback alert per dependency |
| Alert fires often without action | Tune or delete it; noisy alerts get ignored |

- Instrumentation that was configured but not observed arriving is "not verified".
- PII in logs is a defect (security severity per `security-audit`).
- Sampling and retention settings are stated, with their cost implications noted from the
  vendor pricing page (no invented numbers).

## Tools

- Sentry, OpenTelemetry (SDKs, collector), Prometheus + Grafana, Grafana Cloud, Datadog,
  Honeycomb, Better Stack, provider-native (CloudWatch, Azure Monitor, Cloud Logging).
- Uptime: Checkly, Better Stack, UptimeRobot, provider synthetics.
- `curl -fsS`, log CLIs (`vercel logs`, `fly logs`) for verification.

## Quality standards

- Health endpoints exist and match platform health-check config.
- Logs are structured, correlated by request/trace ID and free of secrets/PII.
- Every alert has a route and a runbook; every SLO has a recorded owner-approved target.
- Each signal type was observed arriving, with evidence.

## Common failures

- Readiness endpoint that always returns 200.
- Logging tokens, cookies or full bodies "for debugging".
- Error tracker installed but DSN missing in production env.
- Alerts routed to a channel nobody watches, never tested.
- Public source maps exposing source code.

## Outputs

- Health/version endpoints, logger config, error-tracking and telemetry setup, uptime and
  alert definitions (as code where the tool supports it), runbook, dashboard links.
- Verification log: each signal, how it was triggered, where it was observed.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Health, logs, errors, metrics, uptime and alerts are configured for in-scope services.
- Each signal was verified arriving in the target environment, or marked "not verified"
  with the reason (e.g. production deploy pending authorization).
- Runbook and SLO decisions recorded.
