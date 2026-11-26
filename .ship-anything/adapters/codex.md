# Adapter: OpenAI Codex CLI

Verified against Codex CLI **0.160.1** (local: `codex features list` → `multi_agent` stable/on, `hooks` stable/on,
`skill_search` stable, `memories` stable/off) and docs at https://learn.chatgpt.com/docs (2026-11-26).

| Capability | Native mechanism | What `init --agent codex` writes |
|---|---|---|
| Project instructions | `AGENTS.md` per directory root → cwd (`AGENTS.override.md` wins); total capped by `project_doc_max_bytes` (default 32 KiB); CLAUDE.md not read | `AGENTS.md` managed block (kept small to respect the 32 KiB cap) |
| Skill discovery | `.agents/skills` (cwd up to repo root), `~/.agents/skills`; required `name`, `description`; `$skill` or `/skills` | copies skills to `.agents/skills/` |
| Agent definition format | `.codex/agents/*.toml`, one per file; required `name`, `description`, `developer_instructions`; **unknown keys rejected** | `.codex/agents/<agent>.toml` with exactly those three keys |
| Subagent support | Yes (`multi_agent`) | — |
| Delegation | model calls `spawn_agent` (`agent_type` = agent name, `message`), then `wait` / `send_input` / `close_agent` | AGENTS.md block tells the orchestrator to spawn by agent name |
| Hooks | `.codex/hooks.json` (trusted project) or `~/.codex/hooks.json`; events SessionStart, PreToolUse, PostToolUse, Stop, SubagentStart/Stop, … | none |
| Permission model | sandbox + approval policy; permission profiles in `config.toml` | none changed |
| Context management | auto-compaction; optional `memories` feature (off by default) | `.ship-anything/state/` |

## Verification evidence (2026-11-26, Codex CLI 0.160.1)

In a fresh temp project after `init --agent all`:
- `.codex/agents/*.toml`: all 22 files parse as TOML (Python 3.12 `tomllib`) with exactly the keys
  `name`, `description`, `developer_instructions`.
- `codex exec --sandbox read-only` reported both `security-audit` and `threejs-production` **skills available** ✔.
- The same session reported **0 custom agent types** ✖. Likely cause (UNVERIFIED): Codex loads project-level
  `.codex/` configuration only for *trusted* projects, and the temp directory was not trusted. The bootstrap
  did not modify the user's global Codex config to test this. Until verified, treat Codex subagents as
  "needs project trust" and rely on single-session fallback when they are not listed.

## Limitations

- The 32 KiB AGENTS.md cap: keep project-specific AGENTS.md content concise; skills carry the detail.
- Custom prompts (`~/.codex/prompts`) are deprecated in favour of skills — SHIP ANYTHING uses skills only.
- Codex `@file` imports in AGENTS.md are UNVERIFIED; the managed block does not rely on them.

## Fallback

If `multi_agent` is disabled, run contracts sequentially in one session (single-session mode).
