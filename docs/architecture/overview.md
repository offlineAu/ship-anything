# SHIP ANYTHING — Architecture Overview

SHIP ANYTHING is a **content-first** system: the core product is a set of portable
Markdown/YAML instructions (agents, skills, workflows, policies) plus a small Node.js
CLI that installs them into a target project for a specific coding agent. The coding agent
(Claude Code, Codex, OpenCode, Cursor, Gemini CLI, …) is the runtime. SHIP ANYTHING never
runs its own LLM loop.

```
                ┌──────────────────────────────────────────────────┐
  user request ─►  LAYER 1  ORCHESTRATION ENGINE                    │
                │  agents/orchestrator.md + workflows/*.md          │
                │  intent → complexity level → workflow(s) → plan   │
                │  → task contracts → delegate → integrate → gates  │
                └───────┬───────────────────────────────┬──────────┘
                        │ task contracts (YAML)         │ reports (YAML/MD)
                ┌───────▼───────────────────────────────▼──────────┐
                │  LAYER 2  SPECIALIST AGENTS  (agents/*.md)        │
                │  product · research · architecture · ux · fe · be │
                │  mobile · desktop · db · integration · 3d · video │
                │  infra · monitoring · security · perf · qa · …    │
                └───────┬──────────────────────────────────────────┘
                        │ loads on demand (progressive disclosure)
                ┌───────▼──────────────────────────────────────────┐
                │  LAYER 3  SKILL & TOOL REGISTRY                   │
                │  skills/<name>/SKILL.md  (Agent Skills format)    │
                │  .ship-anything/registry.yaml  (internal+external)│
                │  policies/external-skills.md (trust gate)         │
                └───────┬──────────────────────────────────────────┘
                        │
                ┌───────▼──────────────────────────────────────────┐
                │  LAYER 4  DELIVERY ENGINE                         │
                │  testing-and-qa · security-audit · deployment ·   │
                │  release-management · production-readiness        │
                │  status machine: PLANNED → … → SHIPPED            │
                └──────────────────────────────────────────────────┘

  Cross-cutting: .ship-anything/state/ (persistent task + decision state),
                 adapters/ (per-agent native config), packages/cli (install/validate)
```

## 1. Source of truth vs. generated output

| Canonical (edit these) | Generated per agent by `ship-anything init` |
|---|---|
| `agents/*.md` | `.claude/agents/*.md`, `.opencode/agents/*.md`, `.codex/agents/*.toml` (when supported), Cursor/Gemini fallbacks — see adapters |
| `skills/*/SKILL.md` | copied into each agent's skills directory (`.claude/skills`, `.agents/skills`, …) |
| `workflows/*.md` | copied to `.ship-anything/workflows/` in the target project |
| `AGENTS.md` | root instruction file read by Codex, OpenCode, Cursor and others |
| `CLAUDE.md`, `GEMINI.md` | thin shims importing / pointing to `AGENTS.md` |

Rationale: one source, many thin adapters (ADR-002). Adapters never add behaviour that
contradicts the canonical files; they only translate format and declare capability gaps.

## 2. Complexity levels

The orchestrator classifies **by deliverables and risk, not prompt length** (ADR-005).

| Level | Signal | Topology |
|---|---|---|
| L1 Simple | single deliverable, single file area, no new infra | orchestrator executes directly with one skill |
| L2 Standard | 1 platform, ≤ 3 specialists, no cross-team contracts | sequential or 2-way parallel; QA may be the same session but must re-run checks |
| L3 Complex | multiple subsystems with contracts (API ↔ UI ↔ DB), auth/payments, or migrations | architecture first, contracts frozen, parallel implementation, independent QA + security |
| L4 Full product | multi-platform and/or creative production + infra + release | all of L3 + product brief, UX direction, creative pipeline, release agent, staged delivery |

See `skills/parallel-agent-coordination/SKILL.md` for the concrete scoring rubric.

## 3. Execution lifecycle

```
INTAKE → DISCOVER → CLASSIFY → PLAN → CONTRACTS → BUILD (parallel waves)
      → INTEGRATE → QA GATE → SECURITY GATE → PERF GATE → RELEASE GATE
      → (authorised) DEPLOY → VERIFY → HANDOFF
```

Task status machine (`.ship-anything/policies/status-model.md`):

`PLANNED → IN_PROGRESS → IMPLEMENTED → TESTED → VERIFIED → DEPLOYED → SHIPPED`
plus side states `BLOCKED`, `FAILED`, `DESCOPED`. A status can only advance with evidence
recorded in the task's report.

## 4. Communication: compact structured artifacts

Agents do **not** share conversation history. They exchange:

- **Task contract** (`.ship-anything/templates/task-contract.yaml`) — orchestrator → specialist.
- **Agent report** (`.ship-anything/templates/agent-report.md`) — specialist → orchestrator.
- **Continuation summary** (`.ship-anything/templates/continuation-summary.md`) — when context runs low.
- **Product brief / architecture decision / design direction** — durable project artifacts in
  `docs/` of the *target* project.

State lives in `.ship-anything/state/` of the target project:

```
state/
  plan.yaml          # tasks, deps, owners, status  (task ownership registry)
  decisions.md       # ADR-style log of project decisions
  repo-map.md        # cached repository map (codebase-intelligence)
  tasks/<id>.md      # per-task report + evidence
  sessions/          # continuation summaries (gitignored)
```

## 5. File ownership

Every task contract declares `owns:` globs. The orchestrator rejects a plan where two
concurrently running tasks own overlapping globs. Shared files (lockfiles, root configs,
route registries) are owned by the orchestrator and changed only at integration
checkpoints. Default ownership map: `.ship-anything/policies/file-ownership.md`.

## 6. Security posture

- External skills are untrusted until reviewed (`policies/external-skills.md`).
- Authorisation-gated actions (`policies/authorization.md`): deploy to production, publish
  packages, push to remotes, paid resources, DNS, destructive DB/file operations,
  `curl | sh` or unsigned binaries, tools that edit global agent config. Project dependencies, dev tools
  from official package managers (logged) and local checkpoint commits are pre-authorised.
- No secrets in config, state, memory, reports or screenshots.

## 7. Portability

Capabilities differ per agent (subagents, hooks, skills, memory). Each adapter documents a
**fallback**: when there is no subagent primitive, the orchestrator executes tasks
sequentially in a single session while still writing task contracts and reports, so the
evidence trail and quality gates are preserved. See `.ship-anything/adapters/`.
