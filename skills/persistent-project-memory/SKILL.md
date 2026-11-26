---
name: persistent-project-memory
description: >-
  Maintains durable, tool-portable project memory in plain files under
  .ship-anything/state/, organised in layers from stable system knowledge to transient
  agent context, with no secrets and no reliance on any one agent's built-in memory. Use
  when starting or resuming a project, recording decisions, onboarding a new agent or tool,
  or cleaning up stale project knowledge.
license: MIT
metadata:
  category: efficiency
  version: "0.1.0"
  agents: [orchestrator]
---

# Persistent project memory

## Purpose

Let any agent, in any host tool, pick up a project and know what matters: how the system
is built, what was decided and why, and where the current task stands. Memory lives in the
repository as plain Markdown/YAML, versioned and reviewable — not in a vendor's opaque store.

## When to use

- First session in a project (create the layers) and every resume (read them).
- After an architectural decision, a scope change, or a non-obvious discovery.
- When switching host tools or adding a new agent to the project.
- Periodic cleanup when memory contradicts the code.

Do not use when:
- Passing context to one subagent for one task — use a task contract (`context-management`).
- Recording ephemeral scratch thoughts that will not matter next session.
- Storing credentials, tokens, personal data or anything in `.ship-anything/policies/secrets.md`.

## Inputs

- Existing `.ship-anything/state/`, root instruction files (`AGENTS.md`, `CLAUDE.md`), README.
- Decisions and findings from the current session.

## Procedure

1. **Use the five layers**, each with one home and one update cadence:

   | Layer | File(s) | Contents | Changes |
   |---|---|---|---|
   | Global system knowledge | `AGENTS.md` (+ thin `CLAUDE.md`/`GEMINI.md` shims), `.ship-anything/policies/` | How SHIP ANYTHING works here, conventions, commands to build/test | Rarely; by the user or with approval |
   | Project architecture | `.ship-anything/state/repo-map.md`, `docs/architecture.md` | Modules, entry points, data flow, stack, how to run | On structural change |
   | Decisions | `.ship-anything/state/decisions.md`, `docs/adr/*.md` | Assumptions, decisions, reasons, who decided, date | Append-only per decision |
   | Current task state | `.ship-anything/state/plan.yaml`, `.ship-anything/state/tasks/<id>.md` | Tasks, owners, statuses, evidence | Every status change |
   | Temporary agent context | `.ship-anything/state/sessions/*.md` (gitignored) | Continuation summaries, in-flight notes | Per session; prune when task closes |

2. **Read order on resume**: `plan.yaml` → active task file → newest session summary →
   `decisions.md` → `repo-map.md`. Stop once you have enough to act.
3. **Write rules**:
   - One fact, one place. Link instead of copying between layers.
   - Decisions are append-only: `- 2026-11-26 — <decision> — <reason> — <decider>`.
     Supersede by adding a new entry that references the old one; do not rewrite history.
   - Facts carry provenance: file path, command, or URL that supports them.
   - Mark unverified items `ASSUMPTION:`.
4. **Promote and demote**: when a session note proves durable (e.g. "tests need
   `DATABASE_URL` pointing at local Postgres"), move it to the architecture layer; when the
   task closes, delete its session notes after the report captures the evidence.
5. **Validate against reality** before trusting memory: spot-check two or three claims
   (does the file exist, does the command still work). Contradiction → fix memory, note it
   in `decisions.md`.
6. **Secrets scan before writing**: no values matching `sk_live_`, `ghp_`, `AKIA`, PEM
   headers, JWTs, passwords, connection strings with credentials. Reference env var names
   and where they live only.
7. **Portability**: do not assume a host's native memory (Claude Code memory files,
   Codex/OpenCode session stores, IDE memories) is visible to other tools or teammates. If
   something important was learned there, copy the durable fact into the layer files.
8. **Gitignore** `.ship-anything/state/sessions/`, `.ship-anything/logs/`,
   `.ship-anything/cache/`; commit the other layers only if the user wants project state
   versioned (ask once; record the answer in `decisions.md`).

## Decision rules

| Information | Layer |
|---|---|
| "We chose Postgres over SQLite because of concurrent writes" | Decisions (+ ADR if architectural) |
| "API handlers live in `src/server/routes/`" | Project architecture |
| "T-007 is IMPLEMENTED, tests not run yet" | Current task state |
| "Halfway through refactoring `orders.ts`, next edit line 140" | Temporary agent context |
| "Always run `pnpm` not `npm` here" | Global/project instructions (`AGENTS.md`) — ask before editing |
| API key value, customer email | Nowhere |

## Tools

- Plain files and `git log -- .ship-anything/state/` for history.
- `grep -rn -E "sk_live_|ghp_|AKIA|BEGIN [A-Z ]*PRIVATE KEY" .ship-anything/state/` as a
  minimum secret check before saving.
- Optional upstream: `claude-mem` (see .ship-anything/registry.yaml) — hook-based memory
  with index → timeline → details retrieval; telemetry is on by default and it captures
  broad session data, so it is user opt-in only and does not replace the file layers.

## Quality standards

- A new agent in a different host tool can orient from the files alone.
- Every decision has a date, reason and decider; every architecture fact has provenance.
- Zero secrets or personal data in any layer.
- Memory and code agree on spot-check.

## Common failures

- Duplicating the same fact in four files that then drift apart.
- Rewriting `decisions.md` entries instead of superseding them.
- Relying on host-native memory that the next tool cannot read.
- Letting session notes accumulate until they contradict the plan.
- Storing a "temporary" token in a session note.

## Outputs

- Up-to-date `.ship-anything/state/{plan.yaml,decisions.md,repo-map.md,tasks/,sessions/}`.
- Gitignore entries for transient layers.

## Done when

- All five layers exist where applicable, each fact in exactly one home.
- Spot-checks pass, the secret check is clean, and stale session notes are pruned.
