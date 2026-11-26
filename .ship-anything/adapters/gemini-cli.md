# Adapter: Gemini CLI

Based on Gemini CLI documentation at **v0.71.1** — **Gemini CLI is not installed on the bootstrap machine;
nothing here was executed.**

| Capability | Native mechanism (per docs) | What `init --agent gemini` writes |
|---|---|---|
| Project instructions | `GEMINI.md` (workspace + parents), imports `@./file.md`; AGENTS.md only if listed in `context.fileName` | `GEMINI.md` managed block starting with `@./AGENTS.md` |
| Skill discovery | `.gemini/skills/` or `.agents/skills/` (workspace), user equivalents; activated via `activate_skill` | copies skills to `.agents/skills/` |
| Agent definition format | `.gemini/agents/*.md`, required `name` (lowercase slug, becomes a tool name), `description`; optional `tools`, `model`, `max_turns`, `timeout_mins` | `.gemini/agents/<agent>.md` with `name` + `description` |
| Subagent support | Yes (each subagent is exposed as a tool) | — |
| Delegation | call the subagent tool by name; `@agent_name` at prompt start forces it | — |
| Hooks | per docs (not used) | none |
| Permission model | approval modes / trusted folders per docs | none changed |
| Context management | `/memory` + GEMINI.md hierarchy; compression | `.ship-anything/state/` |

## Limitations

- UNVERIFIED: whether hyphenated agent names are accepted as tool names in every Gemini CLI version. If rejected,
  rename via a future `--gemini-agent-names=underscore` option (roadmap) or disable subagents and run sequentially.
- Required SKILL.md fields are assumed to be `name` + `description` (UNVERIFIED).

## Fallback

Run contracts sequentially in the main session (single-session mode).
