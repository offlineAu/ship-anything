# Adapter: Cursor

Based on Cursor documentation only — **Cursor is not installed on the bootstrap machine; nothing here was
executed.** Re-verify with `ship-anything doctor` and a manual session before relying on it.

| Capability | Native mechanism (per docs) | What `init --agent cursor` writes |
|---|---|---|
| Project instructions | `AGENTS.md` (root and nested); `.cursor/rules/**/*.mdc`; the CLI also reads root `CLAUDE.md` | `AGENTS.md` managed block |
| Skill discovery | `.agents/skills/`, `.cursor/skills/`, also `.claude/skills/`, `.codex/skills/` + user dirs; required `name` (= folder) and `description` | copies skills to `.agents/skills/` |
| Agent definition format | `.cursor/agents/*.md` (also reads `.claude/agents/`), frontmatter `name`, `description`, `model`, `readonly`, `is_background` | `.cursor/agents/<agent>.md` with `name` + `description` — **skipped when Claude is also installed** (Cursor already loads `.claude/agents/`) |
| Subagent support | Yes (per docs) | — |
| Delegation | Task tool, automatic by description, `/name` | — |
| Hooks | per Cursor docs (not used) | none |
| Permission model | CLI permission config; editor model UNVERIFIED | none changed |
| Context management | editor-managed; no documented portable memory | `.ship-anything/state/` |

## Limitations

- UNVERIFIED: editor (non-CLI) reading of `CLAUDE.md`; legacy `.cursorrules`; `.codex/agents` support.
- The CLI and Cloud Agents ignore home-directory agents — project files are committed under `.cursor/agents/`.

## Fallback

If subagents are unavailable in the user's Cursor plan/mode, the orchestrator runs sequentially (single-session mode).
