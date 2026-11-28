---
name: systematic-debugging
description: >-
  Finds the root cause of a bug, failing test, crash, flaky behaviour or performance
  regression before any fix is written: reproduce first, keep a hypothesis log, bisect and
  minimise, prove the cause with one-variable experiments, pin it with a failing regression
  test, then verify the fix with fresh evidence. Includes explicit stop-and-escalate
  rules. Use when the cause of a defect is unknown or a previous fix did not work.
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [qa-agent, backend-agent, frontend-agent, performance-agent]
---

# Systematic debugging

## Purpose

Replace guess-and-patch with a short, recorded investigation. A fix is only worth
shipping when the cause is known, a test showed the defect before the change, and fresh
output shows it gone after. This skill owns the *diagnosis*; `regression-prevention` owns
making the fix permanent (impact, sibling call sites, data fixes).

## When to use

- A bug, failing test, build break, crash or wrong output whose cause is not yet known.
- A flaky test or an intermittent production error.
- A performance regression with a known good and a known bad version.
- A fix was already tried and the symptom came back or moved.

Do not use when:
- The cause is obvious and confirmed (a typo the error message points at): fix it under
  `regression-prevention`.
- The work is a new feature with no defect: use the implementation skill.
- The task is only to report a bug: use the bug report format in `testing-and-qa`.

## Inputs

- Symptom: exact error text, stack trace, failing test name, or metric with values.
- Expected behaviour and where it is defined (acceptance criterion, spec, earlier version).
- Environment: commit SHA, runtime versions, OS, config and data shape (secrets by name).
- A known good point if one exists: commit, release tag, dependency version, date.

## Procedure

1. **Read the evidence fully.** Whole error, whole stack trace, warnings before it, exit
   code. Note file paths, line numbers and error codes.
2. **Reproduce.** Get a command that shows the failure on a clean checkout. Record how
   often it fails (e.g. `for i in $(seq 20); do <cmd> || echo FAIL; done`). If it will not
   reproduce, collect more data (logs, versions, inputs); do not change code yet.
3. **Start the hypothesis log** in the task report (`.ship-anything/state/tasks/<id>.md`):
   one row per idea with hypothesis, prediction, experiment, result, verdict. Write the
   row before running the experiment.
4. **Look at what changed.** `git log --oneline <good>..<bad>`, `git diff <good> <bad>`,
   lockfile diffs, config and environment differences between where it works and where
   it fails.
5. **Bisect** when a good and a bad point exist: `git bisect start <bad> <good>`, then
   `git bisect run <command that exits non-zero on failure>`; finish with `git bisect reset`.
   For dependencies, bisect versions the same way. For a test polluted by another test,
   halve the set of tests that run before it until one remains.
6. **Minimise.** Shrink the failing input, data set, config or test until removing any
   part makes the failure disappear. A small repro often names the cause by itself.
7. **Instrument boundaries** in multi-part systems (CI → build → deploy, client → API →
   DB): log what enters and leaves each part, once, to find the first part where data
   goes wrong. Remove the temporary logging afterwards.
8. **Trace back to the source.** From the point where a bad value is seen, walk up the
   callers until you find where it was first produced. Fix there, not where it surfaced.
9. **Test one hypothesis at a time.** Smallest change that would confirm or refute it;
   one variable per experiment; revert experiments that refute. Never stack guesses.
10. **Pin it.** Write a regression test at the lowest layer that reproduces the defect.
    Run it and save the failing output as "before" evidence.
11. **Fix the cause** with the smallest change. No refactors or extras in the same change.
12. **Verify with fresh evidence.** Run the new test (passes), the affected suite and the
    original repro command. For flaky bugs repeat the step-2 loop and compare rates.
    Then hand off to `regression-prevention` steps for impact and sibling call sites.

## Decision rules

| Situation | Action |
|---|---|
| Cannot reproduce after gathering data | Report "not reproduced" with what was tried; add logging or monitoring; do not ship a speculative fix |
| Known good and bad versions | Bisect before reading code at length |
| Intermittent failure | Look for timing, ordering, shared state, randomness; wait for the condition, not a fixed sleep |
| Hypothesis refuted | Revert the experiment; log it; form a new one from the evidence |
| Three fixes have failed | Stop; the design may be wrong. Write up the log and escalate to `architecture-agent` or the orchestrator |
| Cause lies in a dependency or external service | Minimal repro, pin or work around, file upstream; record in `decisions.md` |
| Fix needs a schema or data change | Switch to the database protocol in `regression-prevention` |
| Investigation exceeds the contract's `budget.max_iterations` | Mark BLOCKED with the log; escalate per `agents/orchestrator.md` |

Escalate to the user only for missing access, production data, or a design change that is
expensive to reverse; otherwise escalate to the orchestrator with the hypothesis log.

## Tools

- Version control: `git bisect run`, `git log -S<string>`, `git blame -L <a>,<b> <file>`.
- Runtime: the language debugger (`node --inspect`, `python -m pdb`, `dlv`, `lldb`),
  browser devtools, structured logs and traces (`observability`).
- Performance: profilers from `performance-optimization`; compare good and bad profiles.
- Test runners in single-test and repeat modes (e.g. `vitest run <file>`, `pytest -x -k`,
  `go test -run <name> -count=20`).
- Attribution: approach informed by the systematic-debugging and
  verification-before-completion skills in obra/superpowers (MIT), read at release v7.0.2
  (commit 22f0b46). Text is our own. Its SessionStart hook and always-on context injection
  are not used; SHIP ANYTHING's orchestrator and policies stay in charge.

## Quality standards

- A reproduction command exists, or "not reproduced" is stated with what was tried.
- The hypothesis log shows each experiment and its result, including the failed ones.
- The root cause is one sentence that names the origin, not the symptom.
- The regression test failed before the fix and passes after, with both outputs recorded.
- Every claim of "fixed" comes from a command run after the final change.

## Common failures

- Changing code before reproducing, then being unable to tell if the change helped.
- Trying several fixes at once and keeping whichever combination went green.
- Adding a sleep or a retry that hides a race instead of removing it.
- Fixing where the error appeared instead of where the bad value was made.
- A fourth and fifth attempt on the same idea instead of stopping to question the design.
- Leaving debug logging or experiment code in the final diff.

## Outputs

- Hypothesis log and root-cause sentence in the task report.
- Regression test with "before" (failing) and "after" (passing) output.
- The minimal fix, and the verification commands with their results.
- Escalation note when stopped: what is known, what was ruled out, what is needed.

## Done when

- The cause is identified with evidence, a regression test pins it, the fix passes fresh
  verification, and temporary instrumentation is removed; or the work is escalated with a
  complete hypothesis log.
