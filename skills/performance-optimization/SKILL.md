---
name: performance-optimization
description: >-
  Improves measured performance of web, backend, database, 3D and app code: establishes a
  baseline, profiles to find the real bottleneck, fixes it, and re-measures. Covers Core Web
  Vitals (LCP, INP, CLS at p75), bundle size, backend p95 latency, query plans, rendering and
  load tests with k6 or autocannon. Use when something is slow, a performance budget is
  set, or before launch; reports before/after numbers only when measured.
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [database-agent, threejs-agent, monitoring-agent, performance-agent]
---

# Performance optimization

## Purpose

Make the product measurably faster where users or budgets need it, by changing the thing
that actually costs time. No measurement, no claim.

## When to use

- A page, endpoint, query, job, scene or app start is reported or measured as slow.
- Acceptance criteria or `production-readiness` include a performance budget.
- A field metric regressed (Web Vitals, p95 latency, error rate under load).
- Capacity planning before launch or a marketing event.

Do not use when:
- There is no baseline and no complaint; do not micro-optimize speculatively.
- The issue is correctness or a crash: use `testing-and-qa` / `regression-prevention`.
- The work is setting up dashboards and alerts: use `observability`.
- A load test would hit production or a third party without user authorization.

## Inputs

- The slow scenario: URL/route, endpoint, query, user flow, device class, data size.
- Budget or target (from contract), or the standards below.
- Access to field data if present (RUM, CrUX, APM traces) and a production-like build.

## Procedure

1. Define the metric and scenario precisely: which metric (LCP, p95 latency, query time,
   frame time), which percentile, device/network profile, data volume.
2. Baseline: measure at least 5 runs (lab) on a production build, record median and spread,
   tool versions, hardware, throttling. Save raw output (`lighthouse --output=json`, k6
   summary JSON). Use field data when available; lab data explains, field data decides.
3. Profile to locate time:
   - Frontend: Chrome DevTools Performance panel, Lighthouse, `web-vitals` attribution
     build, bundle analyzer (`npx vite-bundle-visualizer`, `@next/bundle-analyzer`,
     `source-map-explorer`).
   - Backend: tracing spans (OpenTelemetry), flame graphs (`0x`, `clinic flame`, `py-spy
     record`, `pprof`, `cargo flamegraph`).
   - Database: `EXPLAIN (ANALYZE, BUFFERS)` on Postgres, `EXPLAIN ANALYZE` on MySQL,
     slow query log, `pg_stat_statements`; count queries per request to catch N+1.
   - 3D/graphics: renderer info (draw calls, triangles, textures), GPU frame time, Spector.js.
4. Form one hypothesis naming the bottleneck and the expected effect. Change one thing.
5. Fix the bottleneck with the least invasive change: remove work, cache it, batch it,
   index it, defer it, move it off the critical path, then consider parallelism.
6. Re-measure with the identical setup. Keep the change only if the improvement exceeds the
   run-to-run noise; otherwise revert it.
7. Run the functional test suite: a faster wrong answer is a regression.
8. Load test when concurrency matters, against local or staging only:
   `k6 run --vus 50 --duration 2m script.js` or `npx autocannon -c 50 -d 60 <url>`. Ramp up,
   watch p95/p99, error rate, saturation (CPU, memory, DB connections). Never load test
   production or third-party APIs without explicit authorization.
9. Add a guard so it stays fixed: Lighthouse CI budget, bundle size limit (`size-limit`),
   k6 thresholds, query-count assertion in a test.
10. Report before/after with raw numbers, conditions and the evidence files.

## Decision rules

Core Web Vitals ("good" thresholds, at the 75th percentile of page loads):

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5 s | ≤ 4.0 s | > 4.0 s |
| INP | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |

| Symptom | Likely fix to test first |
|---|---|
| Slow LCP | Preload/prioritize the LCP resource (`fetchpriority="high"`), responsive images (AVIF/WebP, correct `sizes`), cut render-blocking CSS/JS, server/CDN caching, SSR/SSG |
| Poor INP | Break long tasks, defer non-urgent work, reduce hydration, move heavy work to a worker, avoid layout thrash |
| High CLS | Reserve space (`width`/`height`, `aspect-ratio`), font `size-adjust`/`font-display`, no content injected above existing content |
| Large JS bundle | Code-split routes, remove or replace heavy deps, tree-shake, lazy-load below-the-fold |
| Backend p95 high, DB dominant | Index from the query plan, fix N+1, paginate, select fewer columns, connection pooling |
| Backend p95 high, CPU dominant | Profile the hot function; cache results; move to async job |
| Repeated identical reads | Cache with explicit TTL and invalidation rule |
| 3D frame drops | Reduce draw calls (instancing, merging), compress textures (KTX2), LOD, Draco/meshopt |

- Backend targets: use the contract's SLO; if none, report p50/p95/p99 and propose a target
  for the user to accept rather than inventing one.
- An improvement smaller than the measured noise is "no change".
- Never trade correctness, security or accessibility for speed without user sign-off.

## Tools

- Lighthouse / Lighthouse CI, PageSpeed Insights (field data via CrUX), WebPageTest,
  `web-vitals` library, Chrome DevTools.
- k6, autocannon, wrk, Locust for load. OpenTelemetry, clinic.js, py-spy, pprof for profiling.
- Database EXPLAIN tooling; `browser-automation` for scripted, repeatable lab runs.

## Quality standards

- Same build, hardware, network profile and data for before and after; all stated.
- Percentiles, not averages, for latency. Sample count recorded.
- Raw outputs saved under `reports/perf/` and referenced.
- Every reported number came from a run in this session or a cited monitoring source.

## Common failures

- Optimizing without profiling (guessing the bottleneck).
- Measuring a dev build or a single run.
- Reporting estimated or "expected" improvements as results.
- Adding caches without invalidation, creating stale-data bugs.
- Load testing production or a paid third-party API without authorization.

## Outputs

- Code/config changes with the guard (budget, threshold, test).
- `reports/perf/<topic>-<date>.md`: scenario, conditions, baseline, bottleneck evidence,
  change, after numbers, remaining risks.
- Agent report per `.ship-anything/templates/agent-report.md`.

## Done when

- Target met with measured evidence, or the gap and its cause are documented.
- Functional tests still pass.
- A regression guard is in place and was run.
