# Getting started

SHIP ANYTHING installs agents, skills, workflows and policies into a project so that the coding
agent you already use (Claude Code, Codex, OpenCode, Cursor, Gemini CLI, or any agent that reads
`AGENTS.md`) can plan, build, test and ship with them. It does not run its own model.

New to this? The [README quick start](../../README.md#quick-start-5-minutes) is the five-minute version.
This guide goes deeper.

## Requirements

- Node.js 20 or newer (`node --version`).
- git (recommended for undo, and needed for `skills add` from remote sources).
- At least one coding agent. Current adapter status:

| Agent | `--agent` | Status |
|---|---|---|
| Claude Code | `claude` | Verified: all 22 agents and skills load |
| Codex CLI | `codex` | Verified in a trusted project: a real run spawned 43 specialist subagents. Trust the project when asked |
| OpenCode | `opencode` | Verified: all 22 agents load (orchestrator is the primary agent) |
| Cursor | `cursor` | Written from Cursor's docs. Not executed yet |
| Gemini CLI | `gemini` | Written from Gemini CLI's docs. Not executed yet |
| Anything else | `generic` | `AGENTS.md` + `.agents/skills/`, single-session mode |

Details per tool: [`.ship-anything/adapters/`](../../.ship-anything/adapters/generic.md).

## 1. Install into your project

```bash
cd /path/to/your-project
npx ship-anything init                 # detects your agents, shows a plan, asks before writing
npx ship-anything init --agent codex   # or pick explicitly: claude, codex, opencode, cursor, gemini, generic, all
```

To have the `ship-anything` command available everywhere, install it globally with `npm install -g ship-anything`.
The examples below use `ship-anything`; with `npx`, prefix them as `npx ship-anything …`.

Useful flags: `--dry-run` (show what would change), `--agent claude,opencode` or `--agent all`
(several tools), `--cwd <dir>` (target another directory), `--yes` (no prompt).

## 2. What `init` changes

`init` is idempotent and reversible. For `--agent claude` it creates:

| Path | What it is |
|---|---|
| `AGENTS.md` | A marked block (`<!-- ship-anything:begin core -->`) with the operating rules. Existing content is kept |
| `CLAUDE.md` | A marked block that imports `@AGENTS.md` |
| `.claude/agents/*.md` | 22 native subagent definitions |
| `.claude/skills/`, `.agents/skills/` | 63 skills in Agent Skills format |
| `.ship-anything/agents/` | Canonical agent definitions (used by every adapter) |
| `.ship-anything/workflows/` | Composable workflows (`build-anything.md` is the router) |
| `.ship-anything/policies/` | Authorization, secrets, external skills, file ownership, status model |
| `.ship-anything/templates/` | Plan, task contract, agent report and other templates |
| `.ship-anything/config.yaml`, `registry.yaml` | Settings (no secrets) and the skill registry |
| `.ship-anything/state/` | Runtime state, plus `install-manifest.json` |
| `.gitignore` | A marked block that ignores cache, logs, backups, sessions and `.env*` |

Files you edited are never overwritten (unless `--force`, which keeps a backup). No hooks are
installed and no agent permission settings are changed.

Check the result:

```bash
ship-anything doctor     # environment, installed agents, installation health
ship-anything validate   # installed files vs. the install manifest
ship-anything agents list
ship-anything skills list --category quality
```

Undo everything from the last `init`/`update`:

```bash
ship-anything rollback
```

## 3. Your first request

Start your coding agent in the project (for example `claude` or `opencode`) and describe an
outcome. Name deliverables and constraints, not steps:

```text
Use the orchestrator to build a booking page for a small yoga studio: class schedule,
sign-up form with email confirmation, admin view of sign-ups. Next.js, deploy-ready
for Vercel but do not deploy.
```

## 4. What happens

The orchestrator follows [`workflows/build-anything.md`](../../workflows/build-anything.md):

1. **Resume check.** If `.ship-anything/state/plan.yaml` exists, it continues that plan instead of starting over.
2. **Classify.** It scores deliverables and risk (not prompt length) into L1–L4. The example above is likely L2 or L3 (one web client, a form, an admin view, email).
3. **Compose workflows.** For example [`product-discovery`](../../workflows/product-discovery.md) (if scope is unclear) and then [`web-app`](../../workflows/web-app.md).
4. **Plan.** It writes `plan.yaml` with tasks, owners, `owns:` globs and waves. Tasks in a wave run in parallel only if their file ownership does not overlap.
5. **Delegate.** Each task gets a task contract and goes to a specialist (in Claude Code, through subagents). On tools without subagents, the same contracts run one after another in a single session.
6. **Integrate and gate.** Build and tests must be green between waves. QA re-runs checks independently, then security review (on risk: auth, payments, PII, uploads, infra), then performance (when targets apply).
7. **Stop at authorization points.** Production deploys, `git push`, publishing, paid resources and DNS changes always ask you first ([authorization policy](../../.ship-anything/policies/authorization.md)).
8. **Hand off.** What was built, the commands that were run and their real results, assumptions, and what is not done.

## 5. Reading the state files

All state is plain text in `.ship-anything/state/` of your project:

| File | Read it to see |
|---|---|
| `plan.yaml` | The level, composed workflows, assumptions, waves, and each task's agent, `owns`, `depends_on` and `status` |
| `decisions.md` | Assumptions made instead of asking you, and your authorization answers |
| `tasks/<id>.md` | Each specialist's report: files changed, commands run with results, issues, next steps |
| `repo-map.md` | Cached map of a large repository (created when needed) |
| `sessions/` | Continuation summaries when context runs low (gitignored) |
| `install-manifest.json` | What the CLI installed, used by `update` and `rollback` |

Status moves only with evidence: `PLANNED → IN_PROGRESS → IMPLEMENTED → TESTED → VERIFIED → DEPLOYED → SHIPPED`,
plus `BLOCKED`, `FAILED` and `DESCOPED` ([status model](../../.ship-anything/policies/status-model.md)).
A task is never `VERIFIED` by the agent that implemented it. On single-session tools, reports say
"verified in single-session mode".

Quick look from a shell:

```bash
grep -E '^\s+(id|agent|status):' .ship-anything/state/plan.yaml
ls .ship-anything/state/tasks/
```

## 6. Configure

`.ship-anything/config.yaml` controls autonomy (`high` / `medium` / `low`), maximum parallel agents,
quality gates, accessibility and Web Vitals targets, and which agents or skills are disabled.
It never holds secrets: reference them by environment variable name only.

## Next

- [Writing skills](writing-skills.md)
- [Adding external skills](adding-external-skills.md)
- [Example: restaurant platform plan](example-restaurant-platform.md)
- [Architecture overview](../architecture/overview.md)
