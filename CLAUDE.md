@AGENTS.md

## Claude Code notes
- Skills in this repo live in `skills/` (source), not `.claude/skills/`. To exercise them natively, run
  `node packages/cli/bin/ship-anything.js init --agent claude --cwd <scratch project>` and open that project.
- Use subagents for independent work with disjoint file ownership; keep the main session as orchestrator.
