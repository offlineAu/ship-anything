# ship-anything (CLI)

Installs SHIP ANYTHING agents, skills, workflows and policies into a project for Claude Code, Codex,
OpenCode, Cursor, Gemini CLI, or any agent that reads `AGENTS.md`.

```bash
npx ship-anything init            # auto-detects your agents
npm install -g ship-anything      # or install the CLI globally
```

```bash
ship-anything init --agent claude|codex|opencode|cursor|gemini|generic|all [--dry-run] [--yes] [--force]
ship-anything update | rollback | doctor | validate
ship-anything skills list | add <source> | approve <name> | remove <name>
ship-anything agents list | show <name>
```

Safety properties (covered by tests in `test/`):
- Shows a plan before writing anything, and won't apply changes without a TTY confirmation or `--yes`.
- Idempotent: re-running writes nothing if nothing changed.
- Never overwrites user-modified or unmanaged files unless you pass `--force`, which keeps backups in `.ship-anything/backups/`.
- Root instruction files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.gitignore`) get a marked block. Your content stays.
- `rollback` undoes the last transaction.
- External skills are fetched with git hooks disabled, quarantined, statically reviewed, and never executed.

Requires Node.js ≥ 20. One runtime dependency: [`yaml`](https://github.com/eemeli/yaml) (ISC).
Project documentation: https://github.com/offlineAu/ship-anything
