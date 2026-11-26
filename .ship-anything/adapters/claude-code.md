# Adapter: Claude Code

Verified against Claude Code **2.1.332** (local) and https://code.claude.com/docs (2026-11-26).
Evidence log: `docs/research/integration-matrix.md`.

| Capability | Native mechanism | What `ship-anything init --agent claude` writes |
|---|---|---|
| Project instructions | `CLAUDE.md` (imports via `@path`, ≤ 4 hops). `AGENTS.md` is read **only if no CLAUDE.md exists** | `CLAUDE.md` managed block starting with `@AGENTS.md`, so both stay in sync |
| Skill discovery | `.claude/skills/<name>/SKILL.md` (project), `~/.claude/skills/` (user). Description-based auto-activation; full body loaded on use (progressive disclosure) | copies every internal skill to `.claude/skills/` |
| Agent definition format | `.claude/agents/*.md`, YAML frontmatter, required `name`, `description`; optional `tools`, `model`, `skills`, `permissionMode`, … (camelCase) | `.claude/agents/<agent>.md` with `name` + `description` (tools/model inherited) |
| Subagent support | Yes | — |
| Delegation | **Agent** tool (alias `Task`), `@agent-<name>`, automatic by description | orchestrator instructions say: delegate task contracts with the Agent tool |
| Tool invocation | Built-in tools (Read, Edit, Write, Bash, Grep, Glob, WebFetch, …), MCP tools | — |
| Hooks | `settings.json` `hooks` (SessionStart, PreToolUse, PostToolUse, Stop, SubagentStop, PreCompact, …) | **none** — SHIP ANYTHING installs no hooks |
| Permission model | modes `default`/`acceptEdits`/`plan`/`auto`/`dontAsk`/`bypassPermissions`; allow/ask/deny rules | none changed; `.ship-anything/policies/authorization.md` applies on top |
| Context management | auto-compaction; per-project auto memory `~/.claude/projects/<p>/memory/` | state lives in `.ship-anything/state/` (portable); Claude memory is optional, never required |

## Usage

```bash
npx ship-anything init --agent claude
claude   # then: "Use the orchestrator to build <idea>"
```

## Limitations

- Claude Code does not read `.agents/skills` (UNVERIFIED either way; we install to `.claude/skills` to be safe).
- When combined with `--agent cursor`, Cursor also reads `.claude/agents` and `.claude/skills`; the CLI therefore
  skips `.cursor/agents` to avoid duplicates.
- Subagents cannot spawn further subagents; only the orchestrator (main session) delegates — this matches the
  SHIP ANYTHING model.

## Fallback

If subagents are disabled by policy, the orchestrator runs each contract sequentially in the main session, still
writing `state/tasks/<id>.md` reports, and marks verification as "single-session mode" per the status model.

## Optional enhancements (user decision, not installed)

Hooks for automated checks (e.g. Stop → `npx ship-anything validate`), and `permissionMode`/`tools` restrictions
per agent (e.g. read-only tools for `research-agent`, `security-agent` in audit mode).
