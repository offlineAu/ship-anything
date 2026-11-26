# Adapter: OpenCode

Verified against OpenCode **1.19.5** source (tag v1.19.5) and local `opencode agent list` (2026-11-26).
Note: opencode.ai now documents a newer "V2" config (a `subagent` tool, `permissions` list). The adapter
targets fields valid in **both** where possible.

| Capability | Native mechanism | What `init --agent opencode` writes |
|---|---|---|
| Project instructions | first of `AGENTS.md` → `CLAUDE.md` → `CONTEXT.md` found walking up; `instructions` array in config | `AGENTS.md` managed block |
| Skill discovery | `.opencode/skill(s)/`, **also** `.agents/skills/` and `.claude/skills/` (project, walking up) + user dirs; skills without `description` are hidden | copies skills to `.agents/skills/` |
| Agent definition format | `.opencode/agent(s)/*.md`, frontmatter `description`, `mode` (`subagent`/`primary`/`all`), `model`, `permission`, … — nothing required | `.opencode/agents/<agent>.md` with `description` + `mode: subagent` (`orchestrator`: `mode: primary`) |
| Subagent support | Yes | — |
| Delegation | `task` tool (`subagent_type` = agent name) in 1.19.5; `subagent` tool in V2 docs; `@agent` mentions | — |
| Hooks | JS/TS plugins in `.opencode/plugins/` (`tool.execute.before/after`, `event`, …) | none |
| Permission model | `permission` map tool → `allow`/`ask`/`deny` (V1); ordered `permissions` list (V2) | none changed |
| Context management | compaction; `opencode stats` reports token usage and cost (used by token-optimization measurement) | `.ship-anything/state/` |

## Limitations

- `mode` defaults differ between 1.19.5 (`all`) and V2 docs (`primary`) — the adapter always sets it explicitly.
- If both `--agent claude` and `--agent opencode` are installed, OpenCode sees skills in both `.claude/skills` and
  `.agents/skills`; identical names may appear twice in its skill list (UNVERIFIED de-duplication behaviour).
- No documented persistent memory feature (UNVERIFIED) — state files are the memory.

## Fallback

Without subagents (e.g. `task` permission denied), run contracts sequentially in the primary agent.
