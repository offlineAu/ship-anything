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

## Verification evidence

**2026-11-26, untrusted temp project** (`codex exec --sandbox read-only`): skills discovered ✔; all 22
`.codex/agents/*.toml` parse with exactly `name`, `description`, `developer_instructions` ✔; **0 custom agent
types listed** ✖.

**2026-11-28, trusted project, interactive field run (Codex CLI 0.160.1):** custom agents ✔ VERIFIED. The
orchestrator session made 43 `spawn_agent` calls with `agent_type` set to SHIP ANYTHING agent names
(research-agent, product-director, architecture-agent, ux-agent, database-agent, frontend-agent,
backend-agent, blender-agent, qa-agent, security-agent), each producing its own session. Conclusion: Codex
loads project `.codex/agents/` only after the project is trusted. Trust the project when Codex asks.

## Delegation guidance

- Spawn with a compact task contract in `message`. **Do not pass `fork_turns: "all"`**: it copies the whole
  conversation (including long user prompts) into every subagent. In the field run, 5 of 43 spawns forked the
  full history, which contradicts the contracts-not-transcripts rule and multiplies input tokens.
- Reuse a running specialist (`send_message` / `followup_task`) for follow-up work on the same contract
  instead of spawning a new one.

## Limitations

- The 32 KiB AGENTS.md cap: keep project-specific AGENTS.md content concise; skills carry the detail.
- Custom prompts (`~/.codex/prompts`) are deprecated in favour of skills — SHIP ANYTHING uses skills only.
- Codex `@file` imports in AGENTS.md are UNVERIFIED; the managed block does not rely on them.
- Framework scaffolds may add their own nested `AGENTS.md` (for example Laravel's tells the agent to install
  PHP with `curl … | bash`). Codex reads those too. They are project content, not user authorization.

## Fallback

If `multi_agent` is disabled, run contracts sequentially in one session (single-session mode).
