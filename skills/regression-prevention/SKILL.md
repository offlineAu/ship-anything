---
name: regression-prevention
description: >-
  Fixes bugs so they stay fixed: reproduction, root cause, impact assessment, minimal
  implementation, a regression test proven to fail before and pass after the fix,
  verification and documentation. Adds a cautious protocol for database-related fixes
  (inspect schema, data dependencies, migration and rollback first; no destructive
  operations without authorization). Use for any bug fix, hotfix, flaky behaviour or
  data-correction task.
license: MIT
metadata:
  category: quality
  version: "0.1.0"
  agents: [database-agent, qa-agent]
---

# Regression prevention

## Purpose

Turn every defect into a permanent check. A fix without a test that failed before it is an
unproven fix; a fix whose root cause is unknown is a guess.

## When to use

- Fixing any reported bug, failing test, production incident or QA bug report.
- A previously fixed bug reappeared.
- Correcting bad data or a faulty migration.

Do not use when:
- Building a new feature with no defect involved: use the implementation skill and
  `testing-and-qa`.
- Only triaging or reporting a bug (QA's bug report format lives in `testing-and-qa`).
- Refactoring with no behaviour change: rely on existing tests plus `code-review`.

## Inputs

- Bug report: steps, expected vs actual, environment, evidence.
- Access to the code at the failing commit and to logs/traces (secrets by name only).
- For data bugs: schema, migrations history, a non-production copy of affected data.

## Procedure

1. **Reproduce.** Follow the report on a clean checkout. Capture the failing output. If it
   does not reproduce, gather more data (logs, versions, data shape) before changing code.
   Never "fix" a bug you could not observe without saying so in the report.
2. **Write the failing test first** at the lowest layer that reproduces it (unit >
   integration > API > E2E). Run it and save the failing output; this is the "before"
   evidence.
3. **Find the root cause.** Trace from symptom to origin: read the code path, bisect
   (`git bisect run <test command>`) when a last-good version exists, inspect inputs. State
   the cause in one sentence ("`parseDate` treats input as local time, so UTC+X users get
   the previous day"). Distinguish the cause from the trigger.
4. **Assess impact.** Which users, data, endpoints and versions are affected? Is existing
   data corrupted? Are other call sites using the same faulty pattern
   (`grep -rn "<pattern>"`)? Is there a security dimension? Record it.
5. **Implement** the smallest change that removes the root cause. Fix sibling occurrences
   found in step 4 or file them. No unrelated refactors in the same change.
6. **Prove it.** Run the new test: it must now pass. Temporarily revert the fix (`git stash`
   the source change, keep the test) and confirm the test fails again, then restore. Record
   both outputs.
7. **Verify** the full relevant suite, type check, lint and build; then repeat the original
   reproduction steps through the real interface.
8. **Document**: changelog entry under "Fixed", the root cause and impact in the agent
   report, and a note in docs if behaviour visible to users changed.
9. Hand to QA (independent verification) per `.ship-anything/policies/status-model.md`.

### Database-related fixes

1. Inspect before touching: current schema (`\d+ table`, `SHOW CREATE TABLE`, ORM schema
   file), constraints, indexes, triggers, views, foreign keys, and which code and jobs read or
   write the affected tables.
2. Measure affected rows with a read-only `SELECT COUNT(*) ... WHERE <condition>` and sample
   rows (mask PII in reports).
3. Write the change as a versioned migration with a tested down/rollback path, or a
   documented forward-fix when down is impossible.
4. Test on a fresh database and on a production-like copy: migrate up, verify, migrate down,
   migrate up again. Compare row counts and constraint checks before/after.
5. Backfills: batch, idempotent, resumable; never one unbounded `UPDATE` on a large table.
6. Destructive operations (`DROP`, `TRUNCATE`, `DELETE` without a narrow `WHERE`, column
   removal, resetting a DB with non-fixture data) require explicit user authorization and a
   verified backup (`.ship-anything/policies/authorization.md`). Ask with: exact SQL, target
   environment, affected row count, backup location, rollback.

## Decision rules

| Situation | Action |
|---|---|
| Cannot reproduce | Do not change code; add logging/diagnostics or request data; status BLOCKED with what is needed |
| Root cause in third-party code | Pin/upgrade/patch with a test that exercises our usage; link upstream issue |
| Fix requires data correction | Separate, reviewed migration/script; never ad-hoc SQL in production |
| Test cannot fail before the fix | The test does not cover the bug; rewrite it |
| Flaky test is "the bug" | Find the nondeterminism (time, order, race, network); fix it, do not add retries |
| Hotfix under time pressure | Same steps, smaller scope; regression test is still mandatory |

## Tools

- `git bisect`, `git log -S '<string>'`, `git blame` for history.
- The project's test runner with focused execution (`-t`, `-k`, `--grep`).
- Database CLIs (`psql`, `mysql`, `sqlite3`) read-only by default; migration tools (Prisma,
  Drizzle, Alembic, Flyway, Rails, Django migrations).

## Quality standards

- Report contains: reproduction evidence, root-cause sentence, impact, the fail-before and
  pass-after outputs, commands run.
- The regression test is named after the behaviour, links the bug ID, and runs in CI.
- No destructive data operation without recorded authorization and backup.

## Common failures

- Patching the symptom (null check) while the producer of bad data stays broken.
- Writing the test after the fix and never seeing it fail.
- Fixing one call site while the same pattern exists elsewhere.
- Running a migration against shared data without a down path or backup.
- Mixing the fix with refactors, making review and rollback harder.

## Outputs

- Fix commit(s) or diff, regression test, migration (if any), changelog entry.
- Agent report per `.ship-anything/templates/agent-report.md` with reproduction, root cause,
  impact, before/after test outputs and verification commands.

## Done when

- The bug reproduced (or BLOCKED with reasons), the root cause is stated, impact assessed.
- The regression test failed before and passes after, with both outputs recorded.
- Full relevant suite, build and original reproduction pass.
- Docs/changelog updated; task handed to independent verification.
