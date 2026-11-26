---
name: code-review
description: >-
  Reviews a diff, branch or pull request as an independent reviewer for correctness bugs,
  security issues, broken contracts, data and migration risks, missing or weak tests, and
  policy violations, producing severity-rated findings with file:line and a concrete failure
  scenario. Use before marking work VERIFIED, before merge or release, or when asked to
  "review", "check this PR" or "look over the changes".
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [orchestrator, security-agent]
---

# Code review

## Purpose

Catch defects a second pair of eyes can find before users do. A useful finding names the
place, the input or sequence that breaks it, and what goes wrong. Style preferences are not
findings.

## When to use

- A task reached IMPLEMENTED/TESTED and needs review before VERIFIED or merge.
- Before a release, on the diff since the last release tag.
- After a specialist agent changed shared code (APIs, schemas, auth, config).

Do not use when:
- You wrote the code in this session. Reviews must be independent; in single-session mode
  follow rule 3 of `.ship-anything/policies/status-model.md` and say so.
- A full security assessment is needed: use `security-audit`.
- The request is only formatting or lint: run the formatter/linter.
- The task is to rewrite or refactor: reviews report; the owning agent fixes.

## Inputs

- The diff (`git diff <base>...HEAD`, PR number) and the base branch.
- Task contract and acceptance criteria; the implementer's report.
- Project conventions: CLAUDE.md/AGENTS.md, lint config, architecture decisions.

## Procedure

1. Read the contract first so you know what the change is supposed to do. Then read the
   implementer's claims as hypotheses.
2. Get the full change set: `git diff --stat <base>...HEAD`, then `git diff <base>...HEAD`.
   Include new untracked files. For large diffs, review by area (data, API, UI, config).
3. For each changed function, read enough surrounding code to know its callers and
   contracts (`grep -rn "<symbol>"`). Changes to a signature or return shape require
   checking every caller.
4. Look for correctness bugs: wrong conditions, off-by-one, null/undefined paths, unhandled
   errors and promise rejections, race conditions, timezone/locale, float money, integer
   overflow, resource leaks, missing awaits, wrong default values, stale caches.
5. Security pass: authz on new endpoints, input validation, injection sinks, secrets in
   code or logs, unsafe HTML, SSRF in URL fetches, permissive CORS, new dependencies
   (license, maintenance, known vulnerabilities).
6. Contracts and data: API/schema backward compatibility, migrations (reversible, safe on
   large tables, no destructive ops without authorization), event/queue payload changes,
   config and env var additions reflected in `.env.example`.
7. Tests: do new tests cover the acceptance criteria and failure paths? Would they fail if
   the code were wrong? Are there assertions? Run the tests yourself:
   the review states what you ran and the results.
8. Policy check: file ownership (`.ship-anything/policies/file-ownership.md`), secrets
   policy, authorization policy (no added `git push`, prod deploys, paid resources in
   scripts without gating).
9. For each candidate finding, construct the failure scenario (input, state, sequence) and,
   when cheap, prove it with a test or command. Drop findings you cannot make concrete or
   label them "question".
10. Write findings ordered by severity, then deliver the verdict.

## Decision rules

| Severity | Meaning | Merge/verify |
|---|---|---|
| Blocker | Data loss, security hole, crash on main path, breaks existing consumers | Must fix |
| Major | Incorrect behaviour in a realistic case, missing authz/validation, untested critical path | Must fix before VERIFIED |
| Minor | Edge case with low impact, misleading name causing likely misuse, weak test | Fix or file |
| Nit | Optional polish | Never blocks |
| Question | Unclear intent; reviewer cannot judge | Needs an answer |

- Verdict: approve (no blocker/major), changes requested, or blocked (missing context).
- Prefer fewer, high-confidence findings over many speculative ones.
- Do not request changes that contradict the contract or a recorded decision; raise a
  question instead.
- Approval never implies tests were run unless you ran them and listed the output.

## Tools

- `git diff`, `git log -p`, `git blame`, grep/ripgrep, the project's test runner and type
  checker.
- Host review tooling where available (e.g. a `/code-review` command or `gh pr diff <n>`;
  posting comments on a PR is outbound communication and needs user authorization).
- Optional upstream: `repomix` (see .ship-anything/registry.yaml) to pack a large change set
  for review; `metaswarm` and `pragmatic-orchestration` (see .ship-anything/registry.yaml) as
  reference patterns for review gates, rubrics and parent-verifies-child.

## Quality standards

Every finding has this shape:

```
[Major] src/orders/refund.ts:88 — refund amount not bounded by captured amount
Scenario: POST /refunds {amount: 500} on an order captured for 100 succeeds;
          provider rejects later, local ledger already shows -400.
Fix: validate amount <= captured - refunded before calling the provider; add test.
```

- File and line point to the current revision of the diff.
- No finding without a failure scenario or a clear contract violation.
- Tone is factual; the review comments on code, not people.

## Common failures

- Reviewing only the diff hunks and missing broken callers elsewhere.
- Rubber-stamping because the implementer reported green tests.
- Burying a blocker among twenty nits.
- Vague findings ("this might have issues") nobody can act on.
- Reviewer silently fixing code instead of reporting (breaks ownership and independence).

## Outputs

- Review report: scope (base..head, files), commands run with results, findings by
  severity, verdict. Saved in the task's report under `.ship-anything/state/tasks/<id>.md`
  or `reports/review-<id>.md`.

## Done when

- Every changed file was read and callers of changed interfaces were checked.
- Tests were run by the reviewer, or "not run" with the reason.
- Each finding has severity, file:line and a failure scenario; a verdict is stated.
