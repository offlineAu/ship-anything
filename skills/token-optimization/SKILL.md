---
name: token-optimization
description: >-
  Reduces token spend in agent workflows without sacrificing correctness or security:
  progressive disclosure, compact handoffs, no duplicated investigation, cached repo maps
  and filtered tool output, plus a measurement procedure and honest benchmarking against an
  unoptimized baseline. Use when sessions run long or expensive, context fills quickly, or
  someone asks how many tokens an approach costs or saves.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator]
---

# Token optimization

## Purpose

Spend tokens on reasoning and verification, not on re-reading, re-explaining and
re-printing. Measure before claiming improvement; correctness and security always win
over savings.

## When to use

- Multi-agent runs (L2+) where context is duplicated across agents.
- Sessions that hit context limits or compaction repeatedly.
- Large repositories, verbose build/test output, long-running projects.
- A user asks for token cost, savings, or a comparison between approaches.

Do not use when:
- The task is small and already cheap — optimisation overhead would exceed savings.
- Savings would require skipping tests, security review, or reading code you change.
- Shrinking shell output specifically — use `terminal-output-optimization`.

## Inputs

- Host usage reporting (see Tools) and session logs if the host keeps them.
- `.ship-anything/state/plan.yaml`, `repo-map.md`, task reports.
- The workflow being optimised and its validation commands.

## Procedure

**A. Apply the techniques (in order of typical payoff)**

1. **Progressive disclosure**: load skill/agent bodies only when selected; read file
   outlines (`grep -n "^export\|^def \|^class "`, symbol search) before whole files; read
   ranges, not files, when you know the location.
2. **Compact handoffs**: contracts and reports per `context-management`; link artifacts by
   path instead of pasting; no conversation history to subagents.
3. **No duplicated investigation**: before investigating, check `state/repo-map.md`,
   `decisions.md` and existing task reports. Record findings once in the report's
   "Investigated" section so other agents reuse them. Assign one investigator per question.
4. **Repo maps**: build once per significant change (`repository-mapping`), cache in
   `.ship-anything/state/repo-map.md`, refresh by diff, not from scratch.
5. **Output filtering**: quiet flags, failure-only output, logs to files
   (`terminal-output-optimization`). Never filter away errors.
6. **Right-size delegation**: don't spawn a subagent for a few edits; each agent pays its
   own startup context (instructions, skills, repo orientation).

**B. Measure (before changing anything)**

7. Pick a representative, repeatable task (fixed commit, fixed prompt, fixed acceptance
   criteria). Record host, model and version.
8. Capture, per run:
   - input tokens and output tokens (and cached-input tokens if reported);
   - repeated context: tokens of identical content loaded more than once (same file read
     twice, same instructions in several agents) — estimate by listing duplicated reads;
   - tool output volume: bytes/lines returned by shell and file reads (log tool results);
   - coordination overhead: tokens in contracts, reports, and orchestrator integration turns;
   - reload frequency: number of compactions, resumes, and re-reads of the same file.
9. Use host-reported numbers where available: OpenCode `opencode stats`; Claude Code
   `/cost` or the session usage display; Codex usage output from its CLI/session; provider
   dashboards or API `usage` fields. If the host reports nothing, say so and report proxy
   metrics (bytes of tool output, file-read counts) explicitly labelled as proxies.

**C. Benchmark honestly**

10. Baseline: run the task **without** the optimisation (same commit, prompt, model).
    Treatment: same task **with** it. Run each at least 3 times; model output varies.
11. Report per run and median: tokens in/out, wall time, and **outcome quality** — did
    acceptance criteria pass, did tests pass. A cheaper run that fails is not a saving.
12. Publish only measured numbers with the method, n, host and date. If not measured,
    write "not measured". Never extrapolate a percentage from one run or from a vendor
    claim.

## Decision rules

| Situation | Action |
|---|---|
| Considering skipping a file read to save tokens | Don't, if you will edit it or depend on its behaviour |
| Same file read by 3 agents | Put the needed facts in the contract or repo map |
| Verbose passing output | Filter; keep full log on disk |
| Failing output | Show the failure in full (trimmed to relevant lines, never the error itself removed) |
| Savings claim requested without data | Run the benchmark or state "not measured" |
| Optimisation hides security findings or warnings | Reject the optimisation |

## Tools

- Host usage: `opencode stats`, Claude Code `/cost` / session usage, Codex usage output.
- Optional upstream: `repomix` (pinned, `--compress`, includes token counts per file),
  `rtk` (user-installed shell output compressor), `headroom` (compression proxy, telemetry
  default on), `claude-mem` (memory with progressive retrieval, telemetry default on) —
  see .ship-anything/registry.yaml. Never auto-install; follow
  `.ship-anything/policies/external-skills.md`.
- Reference: `context-mode` (keep raw tool output out of context; return only printed results).

## Quality standards

- Every savings statement cites measured numbers, n, host, model and date — or says
  "not measured".
- Optimised runs meet the same acceptance criteria as the baseline.
- No technique removes error output, security warnings or required reads.

## Common failures

- Claiming "X% fewer tokens" from intuition or a third-party README.
- Comparing a passing baseline with a failing optimised run.
- Single-run comparisons presented as conclusions.
- Truncating test output with `head` and missing the failure at the end.
- Spawning many agents that each re-orient in the repo, costing more than one agent.

## Outputs

- Applied changes to contracts, repo map, and command habits.
- When measured: a benchmark note (`.ship-anything/logs/token-benchmark-<date>.md`) with
  method, raw numbers per run, medians, and outcome quality.

## Done when

- Applicable techniques are in use and no correctness/security check was dropped.
- Any reported savings are backed by a baseline-vs-treatment measurement, or explicitly
  marked "not measured".
