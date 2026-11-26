# assets/screenshots

**No screenshots exist yet.** This directory is a placeholder. Screenshots are only added
from real runs, never from mock-ups. Review: [asset review checklist](../../docs/branding/brand-guidelines.md#asset-review).

## What will go here

- CLI output: `init`, `doctor`, `validate`, `skills add` review, `agents list`.
- Coding agents with SHIP ANYTHING loaded: the agent list in Claude Code and OpenCode (both loaded the
  generated agents in local tests). Codex, Cursor and Gemini CLI screenshots wait until those adapters
  are verified (see the adapter notes in [`.ship-anything/adapters/`](../../.ship-anything/adapters/generic.md)).
- State files after a run: `.ship-anything/state/plan.yaml`, a task report.
- Apps built in recorded example runs (once such runs exist).

## Naming

`<yyyy-mm-dd>_<tool>-<tool-version>_<subject>[-<theme>].png`

Examples: `2026-12-01_ship-anything-0.1.0_doctor-dark.png`, `2026-12-01_claude-code-2.1.332_agents-list-dark.png`.
The date and versions are those of the run itself.

## Specs

- PNG, sRGB, captured at 2× device pixel ratio. Crop to content; max 2400 px wide.
- Terminal: JetBrains Mono (or the terminal's default if it cannot be changed), 14–16 pt, brand
  dark or light background, window at least 100 columns wide, ligatures off.
- Keep the raw text output next to the image as `<same-name>.txt` so the screenshot can be checked.
- Redact before capture, not after: use a throwaway project directory and a neutral user/host name.
  No tokens, emails, home paths or private repository names.
