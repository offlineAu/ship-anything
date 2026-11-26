---
name: rust-modernization
description: >-
  Moves a proven performance or safety bottleneck from an existing JS/TS, Python or other
  codebase into Rust incrementally — via napi-rs, PyO3, WASM, FFI or a sidecar process —
  after profiling, with behavioural tests recorded from the original and benchmarks before
  and after. Use when profiling shows a CPU-bound hot path, memory-safety problem or
  resource cost that targeted native code can fix; not for rewrites by preference.
license: MIT
metadata:
  category: product-intelligence
  version: "0.1.0"
  agents: [architecture-agent, backend-agent, desktop-agent, performance-agent]
---

# Rust modernization

## Purpose

Get measurable improvement by replacing the smallest proven hot spot with Rust, keeping
behaviour identical and the rest of the system untouched. Evidence first; rewrite last.

## When to use

- A profiler shows a CPU-bound function/module dominating latency or cost (parsing,
  compression, image/audio processing, crypto, diffing, large data transforms).
- Memory-safety or concurrency bugs in native extensions (C/C++) that Rust would prevent.
- A desktop app (e.g. Tauri) needs a native core for heavy local work.

Do not use when:
- No profile exists, or the bottleneck is I/O, network, database queries, or algorithmic
  (fix the query/algorithm first — see `performance-optimization`).
- The motivation is "Rust is faster/modern" without a measured problem.
- The team cannot maintain Rust and the gain is marginal.
- A full rewrite is proposed; reject unless the user explicitly asks and evidence justifies it.

## Inputs

- Performance goal (user-given or from requirements), workload description.
- Existing code, tests, and a runnable environment.
- `docs/audit/*` and `repo-map.md` if available.

## Procedure

1. **Baseline**: define a reproducible benchmark on realistic input (fixed data, warm-up,
   enough runs for stable results — hyperfine defaults to at least 10 — report median and p95). Tools: `hyperfine` for CLIs, `vitest bench`/
   `tinybench` (Node), `pytest-benchmark`/`timeit` (Python), load tools for services.
   Record hardware, versions, commit.
2. **Profile** to find the real bottleneck: `node --cpu-prof` or `0x`/clinic for Node,
   `py-spy record`/`cProfile` for Python, `perf`/Instruments for native. Identify the
   function(s) with the largest self/inclusive time on the benchmark.
3. **Try cheaper fixes first**: algorithmic change, caching, batching, avoiding
   serialization, existing optimised library. Re-benchmark. Stop if the goal is met.
4. **Record behaviour of the original**: build a golden corpus — representative and edge
   inputs (empty, huge, unicode, malformed) with outputs (and errors) captured from the
   current implementation. Store under `tests/golden/` with a runner that compares any
   implementation against it. Add property tests where feasible.
5. **Choose the boundary** (smallest unit with a clean interface):

   | Host | Bridge | Notes |
   |---|---|---|
   | Node/Electron | napi-rs | prebuilt binaries per platform/arch in CI |
   | Python | PyO3 + maturin | wheels per platform; GIL release for long work |
   | Browser/edge | wasm-bindgen / wasm-pack | copy cost across JS↔WASM boundary; check bundle size |
   | Any language, isolation needed | sidecar process (stdin/stdout, gRPC, HTTP) | crash isolation; IPC overhead |
   | C ABI consumers | `extern "C"` FFI + cbindgen | manual memory rules; unsafe review |
   | Tauri desktop | Rust commands | already native |

6. **Port the unit**: idiomatic Rust, no `unsafe` unless justified and reviewed;
   `cargo clippy -- -D warnings`, `cargo test`, `cargo fmt --check`.
7. **Diff against golden**: run the golden runner against both implementations; all
   cases identical (or differences documented and approved, e.g. float formatting).
8. **Integrate behind a switch**: feature flag or fallback to the original implementation;
   keep the original until the new path is verified in the target environment.
9. **Benchmark after** with the identical harness; include boundary/marshalling overhead
   and cold start. Report baseline vs. new (median, p95, n, environment).
10. **Ship decision**: adopt only if the goal is met and tests/golden pass on all target
    platforms in CI; otherwise revert and record why in an ADR.
11. **Packaging**: CI builds for each OS/arch shipped; document toolchain version
    (`rust-toolchain.toml`). Publishing packages requires user authorization.

## Decision rules

| Evidence | Action |
|---|---|
| Hot path < goal gap even if made free | Don't port; optimise elsewhere |
| Boundary crossing per tiny call dominates | Batch calls or move a larger unit |
| Golden diff non-empty | Fix port; never update golden from the new implementation |
| Gain marginal, maintenance cost high | Keep original; record ADR |
| Multiple hot spots | One at a time, each with its own before/after |

## Tools

- `cargo`, `clippy`, `rustfmt`, `cargo-criterion`/`criterion`, `hyperfine`, `napi-rs` CLI,
  `maturin`, `wasm-pack`, `cbindgen`; profilers listed above.
- Reference: `rust-anything` (see .ship-anything/registry.yaml) — record behaviour, port
  unit by unit, diff against recording, gate each step. Its `setup` edits global agent
  configs; do not install without user approval per `.ship-anything/policies/external-skills.md`.

## Quality standards

- Before/after numbers come from the same harness, are reported with n and environment,
  and are real — never estimated.
- Golden behaviour tests pass for both implementations.
- No unreviewed `unsafe`; clippy clean.
- Fallback path exists until verified.

## Common failures

- Porting without a profile and speeding up code that wasn't slow.
- Losing the speedup to JS↔Rust or Python↔Rust marshalling.
- Golden files regenerated from the new code, hiding behaviour changes.
- Shipping native binaries for the dev machine only.
- Expanding scope into a full rewrite.

## Outputs

- Benchmark harness and results (baseline vs. after), profile artefacts.
- Golden corpus and comparison runner; Rust crate and bridge; ADR with decision.

## Done when

- The ported unit meets the stated goal on the shared benchmark, matches the recorded
  behaviour of the original, builds in CI for all target platforms, and the decision is
  recorded in an ADR — or the port was rejected with evidence.
