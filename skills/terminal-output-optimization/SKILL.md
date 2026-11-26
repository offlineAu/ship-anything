---
name: terminal-output-optimization
description: >-
  Keeps shell command output small and useful for agents: quiet/reporter flags, tailing
  long logs, grepping for failures, writing full logs to files, while never suppressing
  errors, warnings or diagnostics. Use when running builds, test suites, installs, linters,
  git or docker commands whose output floods context, or when deciding whether to use an
  optional output compressor such as rtk.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator]
---

# Terminal output optimization

## Purpose

Return what the agent needs to decide the next step — pass/fail, the failing lines, the
counts — and keep the rest on disk. Output that hides an error is worse than output that
is too long.

## When to use

- Install, build, test, lint, typecheck, docker, or git commands with long output.
- Repeated runs of the same command during a fix loop.
- Capturing evidence for an agent report without pasting whole logs.

Do not use when:
- Debugging an unknown failure for the first time — read the full relevant output once.
- The command output is already short.
- Output is the deliverable (e.g. user asked to see the full log).

## Inputs

- The command, its exit code semantics, and the tool's reporter/quiet options.
- A log directory: `.ship-anything/logs/` (gitignored).

## Procedure

1. **Always capture the exit code.** Filters must not mask it:
   `set -o pipefail` before piping, or save the log and check `$?` of the command itself:
   `npm test > .ship-anything/logs/test.log 2>&1; echo "exit=$?"`.
2. **Write full output to a file, show a slice.** Prefer
   `cmd > .ship-anything/logs/<name>.log 2>&1; echo "exit=$?"; tail -n 40 .ship-anything/logs/<name>.log`.
   Keep stderr (`2>&1`) — diagnostics live there.
3. **Use quiet or compact reporters the tool provides** (verify the flag exists for the
   installed version with `--help`):
   - npm/pnpm/yarn installs: `npm ci --no-audit --no-fund`, `pnpm install --reporter=append-only`.
   - Test runners: `vitest run --reporter=dot`, `jest --silent`, `pytest -q`,
     `cargo test -q`, `go test ./...` (prints only package results and failures).
   - Linters/typecheck: `eslint --quiet` hides warnings — use only when warnings are
     tracked separately; `tsc --noEmit --pretty false` for grep-friendly errors.
   - Git: `git status --porcelain`, `git diff --stat`, `git log --oneline -n 20`.
   - Docker: `docker build --progress=plain ... 2>&1 | tail -n 60` on failure only.
4. **On failure, extract failures, not noise**:
   `grep -n -E "FAIL|ERROR|Error:|error\[|panicked|Traceback|✗|failed" .ship-anything/logs/test.log | head -n 50`
   then read context around the first hit: `sed -n '<start>,<end>p' <log>`.
5. **On success, summarise**: counts line (`grep -E "Tests:|passed|failed" <log> | tail -n 3`)
   plus exit code is enough evidence for a report; reference the log path.
6. **Re-runs**: narrow scope to the failing test/file (`npm test -- orders`,
   `pytest tests/test_orders.py::test_refund -q`) instead of the whole suite, then run the
   full suite once at the end.
7. **Never** use `> /dev/null 2>&1`, `|| true`, `2>/dev/null` or `head` on a command whose
   failure you need to know about. If a filter returns nothing for a failed command, show
   the raw `tail` instead — the pattern missed.

## Decision rules

| Situation | Action |
|---|---|
| Exit 0, long output | Counts + exit code + log path |
| Non-zero exit | grep failures + surrounding context; if grep empty, `tail -n 80` |
| Warnings present | Report count; list new warnings introduced by this change |
| Interactive/progress-bar tool | Disable progress (`CI=1`, `--no-progress`, `--progress=plain`) |
| Need evidence for VERIFIED | Fresh run, exit code, summary line, log path |
| Considering a global output compressor | Only if the user installs it; never as a requirement |

## Tools

- POSIX: `tail`, `head`, `grep -n -E`, `sed -n`, `wc -l`, `set -o pipefail`.
- Environment: `CI=1` makes many tools drop spinners and colour; `NO_COLOR=1` strips ANSI codes.
- Optional upstream: `rtk` (see .ship-anything/registry.yaml) — user-installed shell output
  compressor; its hooks rewrite every shell command (high-trust position) and parts are
  BUSL-1.1 (the `rtk-oss` edition is Apache-2.0). Agents never install or enable it; if the
  user has it, its fail-open behaviour still requires checking exit codes.
- Reference: `context-mode` — run analysis in a subprocess and return only printed results.

## Quality standards

- Every reported command result includes the real exit code.
- Errors, stack traces, and failing assertions are never filtered out of what the agent reads.
- Full logs are retained on disk for the duration of the task.
- No secrets echoed: redact per `.ship-anything/policies/secrets.md` before quoting logs.

## Common failures

- `cmd | tail` without `pipefail`, reporting `tail`'s exit code 0 as success.
- `head -n 20` on a test run whose failure summary is at the end.
- `--quiet` hiding a deprecation or security warning that mattered.
- Grepping for "error" only and missing "FAIL" or "panicked".
- Claiming tests passed from a filtered output that never showed the summary line.

## Outputs

- Logs in `.ship-anything/logs/<task>-<command>.log`.
- Report lines: command, exit code, summary, log path.

## Done when

- Command evidence in reports is compact, includes exit codes, and points to full logs.
- No error or diagnostic needed for a decision was suppressed.
