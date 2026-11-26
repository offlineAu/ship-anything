---
name: context-management
description: >-
  Keeps agent context small and recoverable: compact handoffs through task contracts and
  agent reports, continuation summaries when a context window or session runs out, and a
  context recovery procedure for resuming work from durable state. Use when delegating,
  receiving reports, approaching context limits, compacting, resuming an interrupted
  session, or handing work to another agent or tool.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator]
---

# Context management

## Purpose

Make every piece of work resumable by a fresh agent with no chat history. Agents exchange
compact, structured artifacts — never transcripts — so context stays focused and a
crashed or compacted session loses nothing that matters.

## When to use

- Writing a task contract for a specialist, or reading an agent report back.
- An agent nears its context limit, the host is about to compact, or a session is ending
  with work unfinished.
- Starting a session in a project that has `.ship-anything/state/` (resume).
- Switching host tools (e.g. Claude Code → Codex) mid-project.

Do not use when:
- The whole task fits comfortably in one short session and will finish now (no summary needed).
- Storing long-lived project knowledge — that is `persistent-project-memory`.
- Reducing tool output volume — that is `terminal-output-optimization`.

## Inputs

- `.ship-anything/templates/task-contract.yaml`, `agent-report.md`, `continuation-summary.md`.
- Current `.ship-anything/state/plan.yaml`, `decisions.md`, `tasks/<id>.md`.
- The working tree (`git status --porcelain`, `git diff --stat`).

## Procedure

**A. Compact handoff (orchestrator → specialist)**

1. Copy `.ship-anything/templates/task-contract.yaml` into the task file; fill `objective`
   (outcome, not steps), `inputs` (paths or `file#anchor`, never pasted content), `owns`,
   `reads_only`, `depends_on`, `acceptance_criteria`, `validation.commands`.
2. Include only what this task needs. Link the product brief, ADR or API contract section;
   do not summarise the conversation that produced them.
3. State constraints the agent cannot infer (no new deps, no schema change, budget).

**B. Compact report (specialist → orchestrator)**

4. Return `.ship-anything/templates/agent-report.md` filled in: investigated (one line per
   source), implemented (behaviour), files, decisions, tests executed with real results,
   issues, remaining work, next action. Quote at most the failing lines of any log; put
   long logs in a file and reference the path.
5. The orchestrator reads the report, not the agent's transcript. Missing evidence → reject.

**C. Continuation summary (context running low or session ending)**

6. Write `.ship-anything/state/sessions/<task-id>-<UTC timestamp>.md` from
   `.ship-anything/templates/continuation-summary.md`. Every field is required:
   - **Objective** — verbatim from the contract.
   - **Completed work** — bullets, each with evidence (path, command + result).
   - **Relevant files** — ≤ ~15 paths, one-line purpose each.
   - **Decisions** — what and why (architectural ones also go to `decisions.md`).
   - **Pending work** — ordered.
   - **Known problems** — exact error messages, hypotheses already tried and ruled out.
   - **Verification evidence** — what was verified and how; "not run" where true.
   - **Next action** — the single next command or edit.
7. Write it *before* the limit, while you can still reason clearly — when you notice long
   tool outputs piling up, many files open, or the host warns about context.
8. Update the task status in `plan.yaml`; never advance status in the summary alone.

**D. Context recovery (fresh session)**

9. Read in this order, stopping when you have enough: `plan.yaml` → latest file in
   `state/sessions/` for the active task → its `tasks/<id>.md` → `decisions.md` →
   `repo-map.md`. Do not reread the whole repo.
10. Re-verify claims against reality: `git status --porcelain`, `git log --oneline -10`,
    and re-run the last recorded validation command. State drift (files changed, tests now
    failing) overrides the summary; record the discrepancy.
11. Execute the summary's **Next action**; then continue pending work in order.

## Decision rules

| Situation | Action |
|---|---|
| Need content from a large doc | Pass `path#section`, let the agent read it |
| Agent asks for "the background" | Point to brief/ADR; if missing, write the artifact once, then link |
| Summary and repo disagree | Trust the repo + fresh command output; note the drift |
| Two summaries exist for a task | Use the newest; keep the older for audit |
| Host auto-compacts | Write the continuation summary first; compaction is lossy |
| Long log needed as evidence | Save to `.ship-anything/logs/<task>-<cmd>.log`, quote the failing lines |

## Tools

- Templates in `.ship-anything/templates/`; state in `.ship-anything/state/`.
- `git status --porcelain`, `git diff --stat`, `git log --oneline` for cheap state checks.
- Optional upstream: `repomix` (see .ship-anything/registry.yaml) to pack a narrowly
  scoped directory for a handoff when an agent truly needs many files at once, e.g.
  `npx repomix@<pinned> --include "src/billing/**" --compress --style markdown`.
- Reference: `claude-mem` progressive retrieval pattern (index → timeline → details).

## Quality standards

- A fresh agent can resume from the summary alone without asking what happened.
- No secrets in contracts, reports or summaries (`.ship-anything/policies/secrets.md`);
  reference env var names only.
- Every "done" claim in a summary has evidence; unverified items are labelled.
- Contracts reference artifacts by path; they do not paste them.

## Common failures

- Pasting conversation history into a subagent prompt.
- Summaries that say "fixed the bug" with no command or file evidence.
- Writing the summary after the context is already degraded, losing exact error text.
- Resuming from a summary without checking `git status`, then redoing finished work.
- Dropping the "hypotheses ruled out" list, so the next session repeats dead ends.

## Outputs

- Filled task contracts and agent reports in `.ship-anything/state/tasks/`.
- Continuation summaries in `.ship-anything/state/sessions/` (gitignored).
- Updated `plan.yaml` statuses.

## Done when

- Each delegated task has a compact contract and an evidence-backed report.
- Any unfinished task has a continuation summary with all eight required fields.
- A resumed session has verified the summary against the repo and executed its next action.
