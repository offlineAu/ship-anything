# Integration matrix

What each supported coding agent offers natively, what `ship-anything init` writes for it, and what was actually
verified. Per-agent detail and fallbacks: [`.ship-anything/adapters/`](../../.ship-anything/adapters/). The install logic is in
`packages/cli/src/lib/adapters.js`.

Versions: Claude Code **2.1.332**, Codex CLI **0.160.1** and OpenCode **1.19.5** were installed locally on the bootstrap machine.
**Cursor and Gemini CLI were not installed**, so their columns come from documentation only (Gemini docs at tag v0.71.1).
Docs fetched 2026-11-26. **UNVERIFIED** means not confirmed in a primary source or by running it.

## (a) Agent capability matrix

| Capability | Claude Code | Codex CLI | OpenCode (1.19.5) | Cursor (docs) | Gemini CLI (docs) |
|---|---|---|---|---|---|
| Project instructions | `CLAUDE.md` (+ `.claude/rules/`), `@path` imports up to 4 hops. `AGENTS.md` only when no CLAUDE.md exists (v2.1.277+) | `AGENTS.md` / `AGENTS.override.md` per dir, root to cwd, 32 KiB cap. CLAUDE.md not read by default | First of `AGENTS.md` → `CLAUDE.md` → `CONTEXT.md` found walking up; `instructions` config | `AGENTS.md` (root and nested), `.cursor/rules/*.mdc`. CLI also reads `CLAUDE.md` (editor: UNVERIFIED) | `GEMINI.md` hierarchy, `@./file.md` imports. AGENTS.md only via `context.fileName` |
| Project skills dir | `.claude/skills/` (`.agents/skills` UNVERIFIED, presumed not read) | `.agents/skills/` (cwd up to repo root). Also `.codex/skills` per source | `.agents/skills/`, `.claude/skills/`, `.opencode/skill(s)/` | `.agents/skills/`, `.cursor/skills/`, plus `.claude/skills/` and `.codex/skills/` | `.agents/skills/` (alias, takes precedence) or `.gemini/skills/` |
| Skill required fields | none (`description` recommended) | `name`, `description` | none (no `description` means hidden) | `name` (= folder), `description` | `name`, `description` (required-ness UNVERIFIED) |
| Subagent format | `.claude/agents/*.md`. Requires `name` and `description` | `.codex/agents/*.toml`. Requires `name`, `description`, `developer_instructions`. Unknown keys rejected | `.opencode/agent(s)/*.md`. Nothing required; `mode` defaults to `all` | `.cursor/agents/*.md` (also reads `.claude/agents/`). Nothing required | `.gemini/agents/*.md`. Requires `name` (slug, becomes a tool name) and `description` |
| Delegation | `Agent` tool (alias `Task`), `@agent-<name>`, automatic by description | `spawn_agent` (`agent_type`), `wait`, `send_input`, `close_agent` | `task` tool (`subagent_type`). V2 docs: `subagent` tool | Task tool, `/name`, automatic | each subagent is a tool with the same name. `@agent_name` forces it |
| Hooks | settings.json, 34 events | `hooks.json` / `[hooks]` (trusted project), 14 events | JS/TS plugins (`tool.execute.before/after`, …) | `hooks.json` (project, user, enterprise); also loads Claude hooks | settings.json, 11 events |
| Permissions | modes (default, acceptEdits, plan, auto, dontAsk, bypassPermissions) plus allow/ask/deny rules | `sandbox_mode`, `approval_policy`, permission profiles, project trust | `permission` map allow/ask/deny (V1). Ordered `permissions` list (V2 docs) | CLI `permissions.allow/deny` (editor model UNVERIFIED) | policy engine TOML (allow/deny/ask_user), approval modes, trusted folders |
| Memory | auto memory `~/.claude/projects/<p>/memory/`, per-subagent `memory:` | `memories` feature, off by default | none documented (UNVERIFIED) | none found (UNVERIFIED) | memory tool on GEMINI.md files. Auto Memory is experimental and off |

Sources:
- Claude Code: https://code.claude.com/docs/en/memory, …/skills, …/sub-agents, …/hooks, …/permissions
- Codex: https://learn.chatgpt.com/docs/agent-configuration/agents-md, https://learn.chatgpt.com/docs/build-skills,
  https://learn.chatgpt.com/docs/agent-configuration/subagents, https://learn.chatgpt.com/docs/hooks,
  https://learn.chatgpt.com/docs/agent-approvals-security, https://learn.chatgpt.com/docs/customization/memories?surface=cli,
  plus `openai/codex` source (`codex-rs/ext/skills/src/host_roots.rs`, `codex-rs/agent-roles/src/agent_role_config.rs`,
  `codex-rs/core/src/tools/handlers/multi_agents/spawn.rs`). The `developers.openai.com/codex/...` URLs redirect to these.
- OpenCode: https://opencode.ai/docs/rules/, …/skills/, …/agents/, …/plugins/, plus `anomalyco/opencode@v1.19.5`
  (`packages/opencode/src/session/instruction.ts`, `src/skill/index.ts`, `src/config/agent.ts`, `src/tool/task.ts`,
  `packages/core/src/v1/config/permission.ts`)
- Cursor: https://cursor.com/docs/context/rules, https://cursor.com/docs/context/skills, https://cursor.com/docs/context/subagents,
  https://cursor.com/docs/agent/hooks, https://cursor.com/docs/cli/reference/permissions, https://cursor.com/docs/cli/using.md
- Gemini CLI: `google-gemini/gemini-cli@v0.71.1` docs: `docs/cli/gemini-md.md`, `docs/cli/skills.md`, `docs/core/subagents.md`,
  `docs/hooks/index.md`, `docs/reference/policy-engine.md`, `docs/tools/memory.md`

Version caveat: opencode.ai now documents a "V2" config (`subagent` tool, `agents` key, `permissions` list). The installed 1.19.5
source still uses V1. The adapter sets only fields valid in both, where possible.

## (b) What `ship-anything init --agent <id>` installs

Common to every agent:
- the root `AGENTS.md` managed block
- `.ship-anything/` (workflows, policies, templates, registry, state, install manifest)

No hooks, permission or settings changes for any agent (ADR-008).

| Agent id | Instruction file | Skills (57 internal) | Subagents (22) |
|---|---|---|---|
| `claude` | `CLAUDE.md` managed block starting `@AGENTS.md` | `.claude/skills/<name>/` | `.claude/agents/<id>.md` with `name` and `description`, body = prompt (tools and model inherited) |
| `codex` | none extra (reads `AGENTS.md`) | `.agents/skills/<name>/` | `.codex/agents/<id>.toml` with exactly `name`, `description`, `developer_instructions` |
| `opencode` | none extra (reads `AGENTS.md`) | `.agents/skills/<name>/` | `.opencode/agents/<id>.md` with `description` and `mode` (`primary` for orchestrator, `subagent` for the other 21) |
| `cursor` | none extra (reads `AGENTS.md`) | `.agents/skills/<name>/` | `.cursor/agents/<id>.md` with `name` and `description`. **Skipped when `claude` is also installed**, because Cursor already reads `.claude/agents/` |
| `gemini` | `GEMINI.md` managed block starting `@./AGENTS.md` | `.agents/skills/<name>/` | `.gemini/agents/<id>.md` with `name` and `description` |
| `generic` | none extra (`AGENTS.md`) | `.agents/skills/<name>/` | none. Canonical copies only; runs in single-session mode |

`--agent all` installs every row above. `.agents/skills` is written once and shared.

## (c) Verification status per agent

Test: a fresh temporary project, `ship-anything init --agent all`, then each installed agent was queried read-only.

| Agent | Status | Evidence |
|---|---|---|
| Claude Code 2.1.332 | ✔ verified | `claude -p` listed all **22** subagents and saw the skills `security-audit` and `threejs-production` |
| OpenCode 1.19.5 | ✔ verified | `opencode agent list` listed all **22** (`orchestrator` primary, 21 subagent) |
| Codex CLI 0.160.1 | ◐ partial | ✔ all 22 `.codex/agents/*.toml` parse (Python 3.12 `tomllib`) with exactly the 3 keys. ✔ `codex exec --sandbox read-only` reported both skills available. ✖ **custom agents not listed** (0 custom agent types). Likely cause: project-level `.codex/` config loads only for trusted projects, and the temp dir was not trusted. **UNVERIFIED**; the user's global Codex config was not modified to test it |
| Cursor | ✖ not executed | documentation only. Not installed on the bootstrap machine |
| Gemini CLI | ✖ not executed | documentation only (v0.71.1). Not installed. Whether hyphenated agent names are accepted as tool names is **UNVERIFIED** |

Fallback for any ✖: the orchestrator runs task contracts sequentially in one session (single-session mode,
[generic adapter](../../.ship-anything/adapters/generic.md)) and records "verified in single-session mode".

## (d) External skills → agent compatibility

From `compatibility` in [`registry.yaml`](../../.ship-anything/registry.yaml) and upstream READMEs (claims, not tested by us).
"Hooks" marks features that run only where that hook system exists. All entries are disabled until reviewed.

| Registry key | Class | Claude | Codex | OpenCode | Cursor | Gemini | Notes |
|---|---|---|---|---|---|---|---|
| anthropic-frontend-design | ADOPT | ✔ | ✔ | ✔ | ✔ | ✔ | Markdown only |
| anthropic-skill-creator | ADOPT (maintainers) | ✔ | – | – | – | – | eval loop uses the `claude` CLI |
| anthropic-webapp-testing | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | Python and Playwright |
| impeccable | ADOPT | ✔ | ✔ | ✔ | ✔ | ✔ | optional hooks are Claude settings hooks; keep off |
| emil-kowalski-skills | ADOPT (subset) | ✔ | ✔ | ✔ | ✔ | ✔ | Markdown only |
| ui-ux-pro-max | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | Python 3 |
| taste-skill | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | Stop hook (frontmatter) runs only in Claude Code |
| repomix | ADOPT | ✔ | ✔ | ✔ | ✔ | ✔ | CLI output is agent-independent |
| understand-anything | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | hooks plus a git post-commit hook |
| rtk | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | hooks or plugins rewrite shell commands |
| claude-mem | OPTIONAL | ✔ | ✔ | ✔ | – | ✔ | hooks plus a local worker |
| headroom | OPTIONAL | ✔ | ✔ | – | – | – | `headroom wrap`. Cursor needs manual setup |
| context-mode | REFERENCE | – | – | – | – | – | not installed (ELv2) |
| rea | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | MCP server |
| rust-anything | REFERENCE | ✔ | ✔ | ✔ | ✔ | ✔ | upstream claim; we do not install it |
| reverse-engineer-anything | REFERENCE | – | – | – | – | – | structural model only |
| remotion-skills | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | Remotion License |
| motion-tools-and-skills | ADAPT | ✔ | ✔ | ✔ | ✔ | ✔ | per-skill deps |
| dolly | REFERENCE | – | – | – | – | – | – |
| pragmatic-orchestration | REFERENCE | ✔ | ✔ | ✔ | – | ✔ | `porch` workers. Gemini is review-only |
| metaswarm | REFERENCE | – | – | – | – | – | – |
| mco | OPTIONAL | ✔ | ✔ | ✔ | ✔ | ✔ | Python 3.10+ |
| vercel-skills-cli | ADOPT | ✔ | ✔ | ✔ | ✔ | ✔ | installer, not a skill |
| frontend-stack-jaimejunr | REFERENCE | (✔) | – | – | – | – | Claude-only; not to be installed |
| claude-code-ui-ux-skill-nicohodt | REJECT | – | – | – | – | – | – |

The Claude ✔ for frontend-stack-jaimejunr is in parentheses because the bundle runs only on Claude Code, and we do not install it.
