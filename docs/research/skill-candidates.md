# External skill candidates

Evidence for `skills.external` in [`.ship-anything/registry.yaml`](../../.ship-anything/registry.yaml).
Method and limits: [README.md](README.md). Each repo was confirmed to exist through the GitHub API on
2026-11-25. "Stars" means the count **as reported by the GitHub API on 2026-11-25**. Stars are not a
quality signal, and very high counts are treated with skepticism. Install commands are quoted
verbatim from upstream and were **not run**.

**2026-11-28 additions.** Six repos were added on 2026-11-28 (storytold/craft-anything, microsoft/playwright-cli,
ChromeDevTools/chrome-devtools-mcp, upstash/context7, obra/superpowers, github/spec-kit). For those, "stars" means the
count **as reported by the GitHub API on 2026-11-28**, and the same read-only method applies: nothing was cloned,
installed or run.

**Classification key**
- **ADOPT**: recommended default. Still installed from upstream and pinned, never vendored without review.
- **ADAPT**: re-express selected parts in our own skills, with attribution.
- **REFERENCE**: learn from the design and do not install it.
- **OPTIONAL**: the user may opt in. Never bundled.
- **REJECT**: do not use.

When the research notes and the registry differ, **the registry is final**. Every external entry is
`enabled: false`, `pin: null` and `security.status: needs-review` (or `rejected`) until the
[external-skills policy](../../.ship-anything/policies/external-skills.md) review is completed.

## Summary

| Repo | License (actual) | Registry key(s) | Class |
|---|---|---|---|
| anthropics/skills | Apache-2.0 per skill (no root LICENSE) | anthropic-frontend-design, anthropic-skill-creator, anthropic-webapp-testing | ADOPT / ADOPT (maintainers) / OPTIONAL |
| pbakaus/impeccable | Apache-2.0 | impeccable | ADOPT (hooks off) |
| emilkowalski/skills | MIT | emil-kowalski-skills | ADOPT (subset) |
| nextlevelbuilder/ui-ux-pro-max-skill | MIT | ui-ux-pro-max | OPTIONAL |
| Leonxlnx/taste-skill | MIT (+ per-photo licenses) | taste-skill | OPTIONAL |
| JaimeJunr/claude-code-frontend-skills | MIT for own files + third-party | frontend-stack-jaimejunr | REFERENCE |
| nicohodt/claude-code-ui-ux-skill | MIT text, upstream notice removed | claude-code-ui-ux-skill-nicohodt | REJECT |
| remotion-dev/skills | none in repo; upstream Remotion License | remotion-skills | OPTIONAL |
| VisualxIntelligence/motion-tools-and-skills | MIT + per-folder (MIT, Apache-2.0) | motion-tools-and-skills | ADAPT |
| pvhuwung/dolly | MIT | dolly | REFERENCE |
| CodeAlive-AI/pragmatic-orchestration | MIT | pragmatic-orchestration | REFERENCE |
| dsifry/metaswarm | MIT | metaswarm | REFERENCE |
| mco-org/mco | MIT | mco | OPTIONAL |
| vercel-labs/skills | MIT | vercel-skills-cli | ADOPT |
| yamadashy/repomix | MIT | repomix | ADOPT |
| Egonex-AI/Understand-Anything | MIT | understand-anything | OPTIONAL |
| rtk-ai/rtk | Apache-2.0 + BUSL-1.1 (engine, proxy) | rtk | OPTIONAL |
| mksglu/context-mode | Elastic License 2.0 | context-mode | REFERENCE |
| thedotmack/claude-mem | Apache-2.0 (open-core) | claude-mem | OPTIONAL |
| headroomlabs-ai/headroom | Apache-2.0 | headroom | OPTIONAL |
| morluto/rea | MIT | rea | OPTIONAL |
| Speedrunlab/reverse-engineer-anything | MIT | reverse-engineer-anything | REFERENCE |
| erkamyaman/rust-anything | MIT | rust-anything | REFERENCE |
| storytold/craft-anything | MIT OR Apache-2.0 (GitHub reports Apache-2.0) | craft-anything | OPTIONAL |
| microsoft/playwright-cli | Apache-2.0 | playwright-cli | OPTIONAL |
| ChromeDevTools/chrome-devtools-mcp | Apache-2.0 | chrome-devtools-mcp | OPTIONAL |
| upstash/context7 | MIT (client only; backend private) | context7 | OPTIONAL |
| obra/superpowers | MIT | superpowers | REFERENCE |
| github/spec-kit | MIT | spec-kit | REFERENCE |

---

## Design and UI/UX

### anthropics/skills

- **Exists:** yes. About 200k stars. Last push 2026-11-16.
- **License:** GitHub reports none because there is no root LICENSE. Each of the 18 `skills/*/LICENSE.txt` files is Apache-2.0.
  Office skills (docx/pdf/pptx/xlsx) moved to Apache-2.0 in commit 2c5958e (2026-11-06). Earlier revisions were
  source-available. `skills/doc-coauthoring`, `template/` and `spec/` have no license file.
- **Structure:** `skills/<name>/SKILL.md` (20 SKILL.md files including `template/`) and `.claude-plugin/marketplace.json`. The spec
  file is now a stub pointing to agentskills.io/specification.
- **SKILL.md names (relevant):** `frontend-design` (71 lines, Markdown only), `skill-creator` (Python eval scripts and
  subagent prompts), `webapp-testing` (Playwright, Python), `theme-factory`, `web-artifacts-builder` (bundles a binary tarball).
- **Deps:** frontend-design has none. skill-creator needs Python 3 and the `claude` CLI. webapp-testing needs Python and Playwright.
- **Install (verbatim):** `/plugin marketplace add anthropics/skills`, `/plugin install example-skills@anthropic-agent-skills`.
  The registry uses `npx skills add anthropics/skills --skill frontend-design`, which is implied by the skills.sh badge but **UNVERIFIED**.
- **Agents/OS:** written for Claude, but uses the Agent Skills format, so it is portable. frontend-design works on any OS.
- **Overlap:** frontend-design is the common ancestor of the "anti-slop" packs. Impeccable says it started from it.
- **Security:** frontend-design has no executable content. skill-creator runs local Python. web-artifacts-builder ships an opaque tarball.
- **Maintenance:** very active (commits 2026-10-09 to 2026-11-16).
- **Classification:**
  - **ADOPT** `frontend-design` as the default design lead.
  - **ADOPT** `skill-creator` as maintainer tooling only.
  - **OPTIONAL** `webapp-testing`.
  - **REFERENCE** for the spec and template.
  - Skip `brand-guidelines` (Anthropic branding) and `doc-coauthoring` (no license).
  - Pin to a commit after 2c5958e.
- **Unverified:** skill-creator scripts were not read line by line. `npx skills add` was not tested.

### pbakaus/impeccable

- **Exists:** yes. About 117k stars. Last push 2026-11-25.
- **License:** Apache-2.0 (root LICENSE). `NOTICE.md` credits MIT and OFL material.
- **Structure:** a single `impeccable` skill (source in `skill/`, build outputs committed per tool dir: `.claude/`, `.agents/`,
  `.cursor/`, `.gemini/`, `.opencode/`, …), about 50 reference files, 5 Claude subagents, a Rust detection engine (62 rules,
  no LLM), a Bun/TS CLI, and Chrome and VS Code extensions.
- **SKILL.md names:** `impeccable` (v4.11.0, 24 sub-commands such as critique, audit, polish, harden and animate).
- **Deps:** Node for `npx`. A native engine binary is downloaded from GitHub Releases into `~/.impeccable/bin/` and checked
  against committed sha256 checksums.
- **Install (verbatim):** `npx impeccable install`, then `/impeccable init`. Pinned route:
  `git submodule add https://github.com/pbakaus/impeccable vendor/impeccable` and
  `npx impeccable link --source=vendor/impeccable --providers=claude,cursor`.
- **Agents/OS:** about 20 agents, including Claude Code, Codex, Cursor, Gemini CLI and OpenCode. Engine binaries exist for macOS, Linux and Windows.
- **Architecture:** a deterministic detector plus an LLM-guided command vocabulary. It writes `PRODUCT.md`, `DESIGN.md` and `.impeccable/`.
- **Overlap:** its build commands overlap frontend-design. Its `animate` command overlaps Emil's motion skills, and Emil wins for product UI motion.
- **Security:**
  - The installer offers SessionStart, PostToolUse and Stop hooks that "run outside model approval".
  - The engine binary is downloaded at runtime.
  - Live-mode fallback can launch `codex`/`claude` with approvals and sandbox bypassed. `IMPECCABLE_LIVE_COPY_AGENT=chat|off` disables this.
  - Telemetry can be turned off with `DO_NOT_TRACK=1`, but the catalog fetch to impeccable.style still happens.
- **Maintenance:** extremely active, with several releases on 2026-11-24.
- **Classification: ADOPT** as the critique, audit and polish supporting skill. Install it from upstream, pinned. Hooks and live mode stay off unless the user opts in.
- **Unverified:** engine source, telemetry payload, and what the catalog fetch sends.

### emilkowalski/skills

- **Exists:** yes. About 59k stars. Last push 2026-11-15.
- **License:** MIT (Copyright 2026 Emil Kowalski).
- **Structure:** 20 `skills/<name>/SKILL.md` files plus companion `.md` files (recipes, audits, catalogs). No scripts.
- **SKILL.md names:** emil-design-eng, animate, animate-expo, animation-performance, animation-vocabulary, apple-design,
  ask-emil, ask-sonner, break-ui, choreograph, find-animation-opportunities, gestures, improve-animations, learn-taste,
  mobile-native, pick-ui-library, prototype, remove-animations, review-animations, write-swift.
- **Deps:** none.
- **Install (verbatim):** `npx skills@latest add emilkowalski/skills`.
- **Agents/OS:** plain Markdown, so any agent and any OS.
- **Overlap:** motion overlaps Impeccable `animate` and Taste's scenes. `learn-taste` writes DESIGN.md, which collides with Impeccable.
- **Security:** no scripts, hooks or network calls. Some skills edit code, as expected.
- **Maintenance:** active. Commit 0f2e23b fixed cross-skill contradictions.
- **Classification: ADOPT a subset** as the motion and interaction authority: emil-design-eng, animate, review-animations,
  improve-animations, animation-performance, mobile-native, break-ui, learn-taste. The other skills are optional. Skip
  ask-sonner and write-swift.
- **Unverified:** content quality was not reviewed skill by skill.

### nextlevelbuilder/ui-ux-pro-max-skill

- **Exists:** yes. About 154k stars. Last push 2026-11-24.
- **License:** MIT (Copyright 2024 Next Level Builder). The sub-skills say `metadata.author: claudekit`, and their provenance was not verified.
- **Structure:** `.claude/skills/*` (mirrored in `cli/assets/skills/`), 144 CSV data files, Python `scripts/search.py`, and the npm
  CLI `ui-ux-pro-max-cli` (bin `uipro`).
- **SKILL.md names:** `ui-ux-pro-max`, `design-system`, `design`, `brand`, `banner-design`, `slides`, `ui-styling`.
- **Deps:** Python 3 (the core search uses only the standard library). Node is needed only for the CLI.
- **Install (verbatim):** `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`,
  `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`. Alternatively `npm install -g ui-ux-pro-max-cli` and `uipro init --ai claude`.
- **Agents/OS:** about 25 agents. Cross-platform.
- **Overlap:** its data-driven picks can conflict with frontend-design and Impeccable, for example by recommending Inter. The lead skill wins.
- **Security:**
  - The core is low risk.
  - The `design` sub-skill calls third-party image APIs using API keys from the environment.
  - `ui-styling` runs the shadcn CLI.
  - The demo `stack/.claude/settings.json` enables all project MCP servers and `Read(//home/**)`. Do not copy it.
- **Maintenance:** very active.
- **Classification: OPTIONAL**, core skill only, as a design-data lookup. Its data-provenance files are good REFERENCE material.
- **Unverified:** sub-skill provenance, and the contents of the npm package.

### Leonxlnx/taste-skill

- **Exists:** yes. About 121k stars. Last push 2026-11-25.
- **License:** MIT. The bundled photos carry their own licenses (`examples/v2/CREDITS.md`, `assets/photos/photos.json`).
- **Structure:** one skill, `skills/taste-skill/SKILL.md`, with `.mjs` scripts (gate, copy-lint, perf, shoot, …), a photo library, and an install.sh.
- **SKILL.md names:** `design-taste-frontend`. Its trigger description is very broad.
- **Deps:** Node 22+ and Chrome, Edge or Chromium. ffmpeg is optional.
- **Install (verbatim):** `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`.
- **Agents/OS:** `npx skills`, a Claude Code plugin and a Codex plugin. Its Stop hook works only where skill-frontmatter hooks are supported (Claude Code).
- **Overlap:** it competes with frontend-design for the lead role.
- **Security:** the skill frontmatter declares a `hooks: Stop` command that runs `scripts/gate.mjs` (600 s timeout) and renders the page in headless Chrome.
- **Maintenance:** active, with rapid version churn (v1 to v2.5, skills moved to other repos).
- **Classification: OPTIONAL.** Use it as the lead for marketing and landing sites only, *instead of* frontend-design and never alongside it.
- **Unverified:** the `.mjs` scripts and per-image licenses were not reviewed.

### JaimeJunr/claude-code-frontend-skills

- **Exists:** yes. 11 stars. Last push 2026-11-25. Created 2026-09-26.
- **License:** GitHub reports NOASSERTION. The MIT text has a preamble limiting it to the repo's own files. Third-party plugins
  keep their upstream licenses, listed in a generated `THIRD_PARTY_NOTICES.md`.
- **Structure:** a Claude Code plugin marketplace with 45 SKILL.md files. It re-vendors frontend-design, Impeccable, UI UX Pro Max,
  Taste, Emil, HyperFrames and others, and adds its own `frontend-stack` plugin (a router skill, `references/conflicts.md`, two agents).
  A weekly sync Action opens upstream-update PRs.
- **SKILL.md names (own):** `frontend-stack`. Its trigger says "Load FIRST, before any other tool call".
- **Install (verbatim):** `/plugin marketplace add JaimeJunr/claude-code-frontend-skills`, `/plugin install frontend-stack@frontend-stack`.
- **Agents/OS:** Claude Code only.
- **Overlap:** it is a curated bundle of all the design candidates above.
- **Security:** it re-ships Impeccable's hooks and engine download. The weekly auto-sync changes content unless you pin. Supply-chain concentration: one maintainer controls code from six upstreams.
- **Maintenance:** active, bus factor 1. Its vendored copies lag upstream (for example, the Emil subset is missing newer skills).
- **Classification: REFERENCE** (registry status `rejected` for install). It is prior art for the conflict-rulings ladder, the
  one-lead-plus-two-supporting router, and the notices, trigger-eval and token-budget scripts. Install the upstreams directly instead (see ADR-010).
- **Unverified:** the scripts were not reviewed.

### nicohodt/claude-code-ui-ux-skill

- **Exists:** yes. 18 stars. Last push 2026-09-01. Not a GitHub fork.
- **License:** MIT text, but the copyright line names the new author and drops upstream's "Copyright (c) 2024 Next Level Builder".
  The README never mentions upstream. This looks like an MIT attribution violation.
- **Structure:** 684 of its 708 tree paths are identical to ui-ux-pro-max. It adds SEO docs and pytest tests.
- **SKILL.md names:** the same 7 names as upstream.
- **Install (verbatim):** `/plugin marketplace add nicohodt/claude-code-ui-ux-skill`. Its `npm install -g ui-ux-pro-max-cli` instruction installs **upstream's** package.
- **Security:** same scripts as upstream. The issue is provenance: misleading package naming.
- **Maintenance:** 2 commits (2026-08-02).
- **Classification: REJECT.** It is an unattributed stale copy with a misleading install path. Use upstream.

## Video and motion

### remotion-dev/skills

- **Exists:** yes. About 8k stars. Last push 2026-11-24. A generated mirror of `remotion-dev/remotion/packages/skills`.
- **License:** **no LICENSE file in the repo.** The upstream monorepo uses the source-available Remotion License (GitHub reports NOASSERTION).
  It is free for individuals, companies with up to 3 employees, and non-profits. Other companies need a company license.
- **Structure:** `skills/` (412 entries) plus sync scripts. Some skills ship `agents/openai.yaml`.
- **SKILL.md names:** remotion-best-practices (router), remotion-captions, -create, -docs, -elements, -interactivity, -license,
  -maps, -markup, -multimedia, -render, -saas, -studio, -upgrade.
- **Deps:** Remotion (React, Node, Chromium) to use the guidance.
- **Install (verbatim):** `npx skills add remotion-dev/skills` or `npx remotion skills add`.
- **Agents/OS:** Claude Code, Codex, Cursor, Kimi Code and OpenCode per the README. Any OS Remotion supports.
- **Overlap:** our `remotion-production` skill, dolly, and several motion-tools skills.
- **Security:** low. Instructions only; they direct `npx remotion` and `npm` installs.
- **Maintenance:** very active, synced automatically by the vendor.
- **Classification: OPTIONAL.** Never vendor or adapt its text (no license grant). Surface the Remotion License to the user.

### VisualxIntelligence/motion-tools-and-skills

- **Exists:** yes. 21 stars. Last push 2026-11-24.
- **License:** root MIT. Per-folder upstream licenses: mostly MIT, with Apache-2.0 for `animated-diagrams`, `img2threejs`,
  `motionmaxxing` and `video-shotcraft`, plus OFL fonts. `docs/reference-only.md` lists material deliberately not copied.
- **Structure:** 6,405 tree entries and 144 SKILL.md files across `skills/` (24 top-level, plus nested packs such as blender-agent-skills),
  `design/`, `engineering/`, `docs/guides`, `tools/` and `starters/`. Every folder has a `NOTES.md`.
- **SKILL.md names (top level):** 3d-product, anatomy, `animated-svg` (folder `animated-diagrams`, a name/folder mismatch that breaks
  the spec), awwwards-motion-study, cinetic, color-grade, html-explainer-video, lower-thirds, motion-design-principles,
  product-launch-motion, saas-motion-video, video-shotcraft, and others.
- **Deps:** varies by skill: Node with Three.js, GSAP, HyperFrames or Remotion; Python; Blender 5.x; ComfyUI; ffmpeg; GPUs. Some need paid APIs (Fal.ai, Tripo, Meshy).
- **Install (verbatim):** none of its own. `npx skills add VisualxIntelligence/motion-tools-and-skills --skill <name>` works with the layout.
- **Agents/OS:** Claude Code is stated, and the format is portable. Some skills are macOS-only or GPU-specific.
- **Security:** large surface: scripts, install scripts, Blender MCP notes (runs arbitrary Python), API keys and fetchers.
- **Maintenance:** very active, fast churn, single organisation.
- **Classification: ADAPT** selectively. Cherry-pick individual MIT or Apache-2.0 skills, keep their LICENSE and NOTICE, and fix name
  mismatches. Prefer license-free engines (Three.js, GSAP, HTML) over Remotion.
- **Unverified:** per-skill script contents.

### pvhuwung/dolly

- **Exists:** yes. 3 stars. Created 2026-10-12. Last push 2026-10-13.
- **License:** MIT.
- **Structure:** root `SKILL.md`, `references/`, `starter/` (a Remotion project with an 87-component catalog and `scripts/*.mjs`), and `new.sh`.
- **SKILL.md names:** `dolly`.
- **Deps:** Node and Remotion 4.0.528 (pinned in starter). Uses macOS `say` or Windows System.Speech for voice.
- **Install (verbatim from README):** `git clone https://github.com/gettermary/dolly ~/.claude/skills/dolly`. **That URL 404s**; the real repo is `pvhuwung/dolly`.
- **Agents/OS:** written for Claude Code. Primarily macOS.
- **Security:** an npm `postinstall` script (`node scripts/sfx.mjs`). The optional companion drives the Mac UI.
- **Maintenance:** a two-day burst from a single author.
- **Classification: REFERENCE.** Useful ideas: a render-QA `check` gate (loudness, hook timing, one-frame jumps), contact-sheet review, and a
  catalog generated from code. Too immature and Remotion-bound to depend on.

## Orchestration and installation

### CodeAlive-AI/pragmatic-orchestration

- **Exists:** yes. 76 stars. Last push 2026-11-25 (porch v5.24.0).
- **License:** MIT.
- **Structure:** 5 skills. `skills/pragmatic-orchestration/scripts/` contains the `porch` CLI (bash and Python) and an Electron UI. CI runs on 3 OSes.
- **SKILL.md names:** pragmatic-orchestration, coordinator-mode, stale-data-cleanup, architecture-consilium, remote-agents.
- **Deps:** Python 3, bash (Git Bash on Windows), and at least one worker CLI. AWS and WireGuard are optional, for remote agents.
- **Install (verbatim):** `npx skills add CodeAlive-AI/pragmatic-orchestration@pragmatic-orchestration`.
- **Agents/OS:** workers are Codex, Claude Code, OpenCode, Grok Build, Devin, Antigravity, Cursor CLI and Gemini (review only).
  macOS is field-tested; Linux and Windows are experimental.
- **Overlap:** our orchestrator's delegation and independent-review gate.
- **Security:** `porch delegate` gives workers **full access** by design. It reads other agents' local session histories.
  `stale-data-cleanup` deletes files.
- **Maintenance:** releases are near-daily.
- **Classification: REFERENCE** in the registry (the research note also allowed OPTIONAL for power users). Its task contracts,
  deviation journal and "parent owns verification" ideas are re-expressed in our orchestrator. Do not vendor `porch`.

### dsifry/metaswarm

- **Exists:** yes. 440 stars. v0.16.0 released 2026-11-12. Last push 2026-11-23.
- **License:** MIT.
- **Structure:** 23 agent personas, 14 skills, Claude commands and Gemini TOML commands, 10 rubrics, hooks (`session-start.sh`),
  `cli/metaswarm.js` (an npx installer) and templates.
- **SKILL.md names:** start, orchestrated-execution, design-review-gate, plan-review-gate, setup, migrate, status, pr-shepherd,
  handling-pr-comments, brainstorming-extension, create-issue, handoff, external-tools, visual-review. Uses the non-standard keys `auto_activate` and `triggers`.
- **Deps:** Node ≥18, BEADS `bd` CLI (installed with curl\|bash), `gh`. The superpowers plugin and Playwright are optional.
- **Install (verbatim):** `npx metaswarm init`, or `claude plugin marketplace add dsifry/metaswarm-marketplace`.
- **Agents/OS:** Claude Code, Gemini CLI and Codex. Primarily macOS and Linux.
- **Architecture:** a 9-phase workflow with plan and design review gates, adversarial review, and a JSONL knowledge base. The Codex installer
  symlinks skills into `~/.agents/skills/metaswarm-<dir>`.
- **Overlap:** high. It is a competing AI dev studio (see [competitive-analysis.md](competitive-analysis.md)).
- **Security:** shell hooks on session start and compaction. It clones and pulls an unpinned HEAD. Autonomous PR handling.
- **Classification: REFERENCE.** Its rubrics and severity-gated review design can be adapted with attribution.

### mco-org/mco

- **Exists:** yes. 560 stars. v0.13.0 released 2026-11-06.
- **License:** MIT.
- **Structure:** a Python runtime (`runtime/*.py`, including policy, execution modes and an MCP server), a Node wrapper, the
  `skills/mco-cli` skill, and `runtime/data/skill_calling_agents.json`.
- **SKILL.md names:** `mco-cli`.
- **Deps:** Python 3.10+ and Node ≥18. It pins `skills@1.5.15` (vercel-labs/skills) for skill installs.
- **Install (verbatim):** `npx @tt-a1i/mco@latest install` (the registry requires a pinned version).
- **Agents/OS:** 12 providers, including claude, codex, gemini, opencode and cursor. macOS, Linux and Windows.
- **Architecture:** one task goes to an explicit provider team (parallel, chain, debate or synthesize), which returns raw answers.
  Modes are `read_only`, `write` and `yolo`. It never selects providers automatically.
- **Security:** `--allow-paths` is not an OS sandbox. `yolo` maps to each provider's approval bypass.
- **Classification: OPTIONAL** for cross-model review (`read_only`). Its agent path data is a REFERENCE cross-check.

### vercel-labs/skills

- **Exists:** yes. About 41k stars. npm `skills` v1.9.0 (2026-11-16).
- **License:** MIT. Runtime deps: `nostics`, `tar`, `yaml`. **Node ≥22.20.0**, ESM.
- **Structure:** `src/` (agents.ts, installer.ts, skill-lock.ts, telemetry.ts, …), `docs/` and `skills/find-skills/SKILL.md`.
- **Install (verbatim):** `npx skills add <source>`. Programmatic API: `npm i skills`. Flags include `-g`, `-a <agents>`, `-s <skills>`, `--copy` and `-y`.
- **Architecture:**
  - Canonical store: project `.agents/skills/<name>`, global `~/.agents/skills/<name>`.
  - "Universal" agents (Codex, OpenCode, Cursor, Gemini CLI, Copilot, …) read the canonical store directly.
  - For Claude Code the skill is copied to `.agents/skills` and then symlinked from `.claude/skills/<name>`.
  - Lockfile `skills-lock.json` with SHA-256 hashes and commits. `--frozen-lockfile` restores exact commits.
- **Agents/OS:** "OpenCode, Claude Code, Codex, Cursor, and 75 more". Uses junctions on Windows, falling back to copy.
- **Security:** sends telemetry to skills.sh unless `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1`. It installs third-party instructions and
  scripts without sandboxing. Mitigations: path sanitization, archive limits, lock hashes, `symlinks: 'reject'`.
- **Classification: ADOPT** as the standard installer for public skills and as the reference for directory layout (ADR-003, ADR-009).
  We do not depend on it at runtime: our CLI targets Node ≥20 (ADR-007).

### obra/superpowers

- **Exists:** yes. About 329k stars (328,660), 29k forks, 1,190 watchers, as reported by the GitHub API on 2026-11-28.
  Created 2025-10-09, last push 2026-11-28. The star count is very high and was not verified; forks and watchers are
  in proportion, and commits come mostly from one maintainer (obra, 529 contributions).
- **License:** MIT (root LICENSE).
- **Structure:** 15 `skills/*/SKILL.md` (brainstorming, writing-plans, executing-plans, subagent-driven-development,
  dispatching-parallel-agents, test-driven-development, systematic-debugging, verification-before-completion,
  requesting/receiving-code-review, using-git-worktrees, finishing-a-development-branch, writing-skills,
  using-superpowers, diagnosing-superpowers), `hooks/` (SessionStart), and plugin manifests for about 15 agents
  (`.claude-plugin`, `.codex-plugin`, `.cursor-plugin`, `.opencode`, `gemini-extension.json`, …).
- **Install (verbatim):** `/plugin install superpowers@claude-plugins-official` (Claude Code);
  `gemini extensions install https://github.com/obra/superpowers`. OpenCode: "Fetch and follow instructions from
  https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md".
- **Security:**
  - `hooks/hooks.json` runs `session-start` on `startup|clear|compact`. It injects the full `using-superpowers`
    skill wrapped in `<EXTREMELY_IMPORTANT>` into every session, which competes with our orchestrator and policies.
  - The brainstorming "visual companion" loads a logo from the vendor's website with the Superpowers version.
    `SUPERPOWERS_DISABLE_TELEMETRY` (or Claude Code's `DISABLE_TELEMETRY`) stops it.
  - Commercial support is offered by Prime Radiant.
  - The OpenCode install asks the agent to fetch and follow remote instructions from a moving branch.
- **Overlap:** a complete competing methodology: brainstorm → spec → plan → subagent-driven execution with review.
  Overlaps our orchestrator, `requirements-analysis`, `architecture-planning`, `parallel-agent-coordination`,
  `code-review` and `regression-prevention`.
- **Maintenance:** active. Release v7.0.2 on 2026-11-03 (commit 22f0b46).
- **Classification: REFERENCE.** Worth studying for `verification-before-completion`, `systematic-debugging` and
  the TDD discipline. Do not install it in a SHIP ANYTHING project: two always-on methodologies give the agent
  conflicting instructions.
- **Unverified:** skill text was not read in full; the logo request payload was not inspected.

### github/spec-kit

- **Exists:** yes. About 153k stars (152,503), 13.7k forks, 749 watchers, as reported by the GitHub API on 2026-11-28.
  Created 2025-08-21, last push 2026-11-26. Owned by the GitHub organisation.
- **License:** MIT (root LICENSE).
- **Structure:** a Python CLI (`specify`, `src/`, `pyproject.toml`), `templates/`, `scripts/`, `presets/`,
  `extensions/`, `workflows/`, `bundles/` and `integrations/` for many coding agents.
- **Install (verbatim):** `uv tool install specify-cli`, then slash commands such as `/speckit-constitution`,
  `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-converge`.
  Bug-fix and assessment processes are extensions: `specify extension add bug`, `specify extension add assess`.
- **Deps:** Python 3.11+, uv, git.
- **Security:**
  - `specify init` writes commands, templates and scripts into the agent's directories.
  - Extensions, presets, workflows and bundles are searched in online catalogs. Extensions can declare hooks and
    lifecycle events. The README itself tells users to review community source before installing.
  - Private catalogs use authentication tokens.
- **Overlap:** a competing process framework. Its constitution and spec → plan → tasks flow overlaps our
  `product-discovery` and `build-anything` workflows and `requirements-analysis`.
- **Maintenance:** very active. Release v1.4.5 on 2026-11-25 (commit f201054).
- **Classification: REFERENCE.** Useful ideas: a project "constitution", presets for regulated traceability, and
  workflow overlays that adapt a process without forking it. Not installed alongside SHIP ANYTHING.
- **Unverified:** the `specify` scripts and catalog contents were not read.

## Context, tokens and codebase intelligence

### yamadashy/repomix

- **Exists:** yes. About 29k stars. Last push 2026-11-25.
- **License:** MIT (the text lacks the title line; Copyright 2024 Kazuki Yamada).
- **Structure:** a CLI, library, MCP server, website and browser extension. The public skill is `skills/repomix-explorer`.
- **SKILL.md names:** `repomix-explorer`. Internal: agent-carnet, contextual-commit, and others.
- **Deps:** Node ≥22. Uses Secretlint, web-tree-sitter and gpt-tokenizer.
- **Install (verbatim):** `npx repomix@latest`, or `npx skills add yamadashy/repomix --skill repomix-explorer`. The registry requires a pinned version.
- **Agents/OS:** agent-independent output. Cross-platform; also available through Homebrew and Docker.
- **Security:** no hooks. Network use only for `--remote` and `npx`. Secretlint filters credential-like files. Output may still contain sensitive code.
- **Classification: ADOPT** (opt-in per project) for repo packing and handoff. See [token-optimization.md](token-optimization.md).

### Egonex-AI/Understand-Anything

- **Exists:** yes. About 94k stars. Last push 2026-11-25.
- **License:** MIT.
- **Structure:** a plugin with 9 skills, hooks, agents, and packages (core, dashboard, MCP, tree-sitter WASM). Installs with install.sh or install.ps1.
- **SKILL.md names:** understand, understand-chat, -dashboard, -diff, -domain, -explain, -figma, -knowledge, -onboard. Uses the non-standard `argument-hint`.
- **Install (verbatim):** `/plugin marketplace add Egonex-AI/Understand-Anything` then `/plugin install understand-anything`. For other agents:
  `curl -fsSL https://raw.githubusercontent.com/Egonex-AI/Understand-Anything/main/install.sh | bash`.
- **Agents/OS:** about 18 agents. macOS, Linux and Windows.
- **Architecture:** tree-sitter parsing, then LLM enrichment into `.ua/knowledge-graph.json`, served by a local dashboard.
- **Security:**
  - PostToolUse and SessionStart hooks.
  - Optional git post-commit hook.
  - curl\|bash installer.
  - The README warns of a large first-run token cost.
- **Classification: OPTIONAL** for large brownfield repos. Do not use the curl\|bash path.
- **Unverified:** installer and hook script contents, and whether the dashboard makes network calls.

### rtk-ai/rtk

- **Exists:** yes. About 88k stars. Default branch `develop`. Last push 2026-11-25.
- **License:** root Apache-2.0, but `engine/` and `proxy/` are **BUSL-1.1**, and the default binary links the engine. `rtk-oss` is Apache-2.0 only.
- **Structure:** a Rust CLI, an engine, a proxy, and per-agent hooks and plugins. It has only internal dev skills (no user-facing skill).
- **Install (verbatim):** `brew install rtk`, then `rtk init -g`. Apache-only edition: `brew install rtk-ai/tap/rtk-oss`.
  The curl\|sh URL points at `master`, which is not the default branch.
- **Agents/OS:** 18 agents through hooks, plugins or rules files. macOS, Linux and Windows.
- **Security:** hooks rewrite every shell command the agent runs. `init -g` edits global agent configs. Pipelines can send content to
  third-party models. Telemetry is off by default.
- **Classification: OPTIONAL.** User-installed only. Never bundle or redistribute it (BUSL). Prefer `rtk-oss`.
- **Unverified:** BUSL change date and change license, install.sh contents, and hook details.

### mksglu/context-mode

- **Exists:** yes. About 34k stars. Last push 2026-11-25.
- **License:** GitHub reports NOASSERTION. **The LICENSE file is Elastic License 2.0**, and package.json says `Elastic-2.0`. ELv2 is not an OSI license.
- **Structure:** hooks, an MCP server (`ctx_execute`, `ctx_search`, `ctx_resume`, …), skills (`ctx-doctor`, `ctx-stats`, `ctx-upgrade`)
  and per-agent plugins.
- **Install (verbatim):** `claude plugin marketplace add mksglu/context-mode`, `claude plugin install context-mode@context-mode`.
- **Deps:** Node ≥24.15. Zero runtime npm dependencies.
- **Security:** PreToolUse hooks deny and redirect tool calls. `ctx_execute` runs agent-written code as the user. "Sandbox" refers to output isolation only.
- **Classification: REFERENCE** (registry status `rejected` for install). We take its patterns, not the tool: see [token-optimization.md](token-optimization.md).
- **Unverified:** what the license-key functionality gates.

### thedotmack/claude-mem

- **Exists:** yes. About 120k stars. Last push 2026-11-25 (v16.1.5).
- **License:** Apache-2.0 core. Open-core: cloud sync, SSO and similar features are commercial (`docs/ip-boundary.md`).
- **Structure:** 47 SKILL.md files (main set in `plugin/skills/`: mem-search, make-plan, do, handoff, learn-codebase, …), a Bun-managed worker, and many per-agent folders.
- **Install (verbatim):** `npx claude-mem install`.
- **Deps:** Node and Bun. It **auto-installs** Bun and uv. The observer needs an LLM provider.
- **Agents/OS:** about 15 agents with full support. macOS, Linux and Windows.
- **Security:**
  - Hooks capture every tool call and send it to an LLM for compression.
  - A persistent local HTTP worker runs.
  - **Telemetry is on by default.**
  - The installer asks for an email.
  - The README has instructions addressed to AI agents (prompt-injection-shaped, though benign).
- **Classification: OPTIONAL** (leaning REFERENCE). Its index → timeline → details retrieval pattern is the useful part.
- **Unverified:** telemetry payload, the worker's bind address, and the contents of the 47 skills.

### headroomlabs-ai/headroom

- **Exists:** yes. About 81k stars. Last push 2026-11-25.
- **License:** Apache-2.0 (with a NOTICE file). "Headroom Enterprise" is a separate commercial offering.
- **Structure:** a Python package with Rust parts, a proxy, an MCP server, and the skill `headroom`.
- **Install (verbatim):** `uv tool install --python 3.13 "headroom-ai[all]"` then `headroom wrap claude`.
- **Deps:** Python ≥3.11 and litellm. The `[ml]` extras pull in PyTorch.
- **Agents/OS:** `wrap` supports about 17 agents. Cursor needs manual setup. macOS, Linux, Windows and Docker.
- **Security:**
  - The proxy sees provider API keys and modifies prompts.
  - **The telemetry beacon is on by default.**
  - `learn` writes to CLAUDE.md and AGENTS.md.
  - A wrong upstream setting can send keys to the wrong provider (the README documents this).
- **Classification: OPTIONAL**, for advanced users only.
- **Unverified:** beacon endpoint and payload, and the licenses of the Rust sub-crates.

### upstash/context7

- **Exists:** yes. About 66k stars (65,567), 3.3k forks, as reported by the GitHub API on 2026-11-28. Last push 2026-11-28.
- **License:** MIT for this repository. Per its README, "the supporting components — API backend, parsing engine, and
  crawling engine — are private and not part of this repository".
- **Structure:** `packages/` (`cli` = `ctx7`, `mcp`, `sdk`, `admin-mcp`, `opencode`, `pi`, `tools-ai-sdk`), and
  `skills/` (`context7-cli`, `context7-mcp`, `find-docs`).
- **Install (verbatim):** `npx ctx7 setup` ("Authenticates via OAuth, generates an API key, and installs the
  appropriate skill"). Manual MCP: server URL `https://mcp.context7.com/mcp` with an `Authorization: Bearer` header.
- **Deps:** Node 22.13+ for the CLI.
- **Security:**
  - Every lookup sends the query text and library name to context7.com.
  - Library docs are community-contributed; upstream "cannot guarantee the accuracy, completeness, or security" of
    them. Returned text is a prompt-injection surface and must be treated as data.
  - `setup` writes agent config **globally by default** (`--project` for project scope) and stores an API key.
  - CLI telemetry is on by default; `CTX7_TELEMETRY_DISABLED=1` turns it off.
- **Overlap:** fills a gap. We have no internal skill for fetching current third-party API docs.
- **Maintenance:** very active (Upstash staff, daily commits; latest release `mcpb-v4.9.1` on 2026-11-27).
- **Classification: OPTIONAL.** Useful for agents writing integration code against fast-moving libraries. Use
  project-scoped setup, telemetry off, and never put proprietary code or secrets in queries.
- **Unverified:** what the telemetry payload contains; the hosted backend.

## Reverse engineering and migration

### morluto/rea

- **Exists:** yes. Last push 2026-11-25. The reported star count (about 478k) **looks anomalous**; check maintainership before enabling.
- **License:** MIT. Third-party notices are included. Commercial decompilers are not included.
- **Structure:** an MCP server and CLI (`rea-agents`), Python, Java and Swift bridges to Hopper, IDA, Ghidra, JADX and mitmproxy, and about 10k paths.
- **SKILL.md names:** `reverse-engineer-anything`, plus internal `rea-*` dev skills.
- **Install (verbatim):** `npx rea-agents setup`.
- **Deps:** Node ^22.23.4, ^24.22.1 or >=26.12.1. About 42 npm deps. External engines are optional.
- **Agents/OS:** 19 clients. macOS, Windows and Linux.
- **Security:** `setup` edits MCP configs (with backups). Live analysis can execute targets and capture traffic. Legal exposure for this domain is covered in its DISCLAIMER.md.
- **Classification: OPTIONAL**, for authorised targets only.
- **Unverified:** install.sh contents, network calls, and the star count.

### Speedrunlab/reverse-engineer-anything

- **Exists:** yes. 10 stars. Last push 2026-10-27.
- **License:** MIT.
- **Structure:** 14 paths: `SKILL.md`, `references/` (7 files) and `templates/finding-report.md`.
- **SKILL.md names:** `reverse-engineer-anything`. Clean frontmatter with `license`, `compatibility` and `metadata`.
- **Install (verbatim):** `git clone https://github.com/Speedrunlab/reverse-engineer-anything.git ~/.claude/skills/reverse-engineer-anything`.
- **Security:** the best profile in the set: no hooks, no MCP, no network. It requires an authorisation gate and an evidence ledger.
- **Maintenance:** dormant after a single burst of "hardening rounds".
- **Classification: REFERENCE.** It is the structural model for our skills (progressive disclosure, evidence-tied findings).

### erkamyaman/rust-anything

- **Exists:** yes. About 9.5k stars. Last push 2026-11-25 (release 4.2.0).
- **License:** MIT.
- **Structure:** a Rust CLI and MCP server, `skills/rust-anything` (copies in `plugin/` and `directory/`), and DECISIONS.md.
- **Install (verbatim):** `cargo install rust-anything` then `rust-anything setup`.
- **Agents/OS:** Claude Code, Codex, Cursor, Gemini CLI and OpenCode. Binaries for macOS, Linux and Windows.
- **Architecture:** profile → bridge → record → port → diff → gate → lift.
- **Security:** `record` and `diff` run the user's program many times, so side effects repeat. `setup` edits global configs (with backups and `--remove`).
- **Classification: REFERENCE** for `rust-modernization`: the record-then-gate verification pattern and an idempotent setup with backups.

### storytold/craft-anything

- **Exists:** yes. About 45k stars (44,973), 8.9k forks, 197 watchers, 478 open issues, as reported by the GitHub API
  on 2026-11-28. Created 2026-10-31, last push 2026-11-28. The stargazer list could not be read through the API
  (HTTP 404), so star farming was not checked directly. Other signals look organic: PR numbers above 2,400, many
  outside contributors, and a 1:5 fork-to-star ratio. It is not a fork or mirror. It belongs to the ArtCraft
  "Craft App Suite" (storytold org).
- **License:** dual **MIT OR Apache-2.0** (`LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE`). GitHub's SPDX field reports only
  Apache-2.0. The ArtCraft name, wordmark, logos and app icon are trademarks and excluded. Bundled fonts and icons
  are OFL/ISC (listed in `ATTRIBUTION.md`).
- **What it is:** a pure-Rust reverse-engineering and recreation engine with a desktop app (egui), a CLI
  (`craft-anything-cli`) and an MCP server. It has about 320 tools (300 in the engine) for native programs, .NET,
  Java, Android, Apple, Electron/JavaScript, websites, firmware, packet captures, databases and game files. It has
  its own decoders, disassembler and decompiler, and uses Ghidra when installed. Results are evidence records with
  confidence, coverage and limitations.
- **Workflow:** Study → Build → Check → Ready. A local coding agent (Claude Code first; Codex, Copilot, Grok, Kimi
  and ACP agents with varying verification) builds a new project from a request such as "Recreate this website".
  It compares the build with the original (pages at three widths, game self-tests, app runs) and refines it.
  `craft-anything-cli rebuild <url> "<request>"` does the same headless.
- **Modes:**
  - **Clean room (default):** "nothing inside the original is read". It works from screenshots, visible text,
    measured layout and the user's pictures. Tools that look inside are refused. Upstream says this "is not an
    operating-system sandbox".
  - **Deep:** "every tool is used, for your private use". This reads program code and files, a website's
    JavaScript and start page, and enables Ghidra, Apktool, **Frida instrumentation** (9 tools, including
    `frida_script_run`) and packet-capture tools.
- **Executables:** yes. Signed and notarized macOS dmg and CLI zip, code-signed Windows MSI, Linux
  AppImage/deb/rpm/flatpak, FreeBSD tarballs and a WebAssembly viewer. Each release has `SHA256SUMS.txt` and GPG
  `.asc` signatures. Building from source needs Rust 1.97+. The repo has a `.githooks/pre-commit`, which only
  matters for contributors.
- **Install (verbatim):** `cargo install --path apps/craft-anything-cli`; `craft-anything-cli doctor`;
  `craft-anything-cli mcp`; `craft-anything-cli setup` "connects Craft Anything to coding-agent apps".
- **Agent configuration changes:** `setup --client codex --yes` writes `[mcp_servers.craft-anything]` into
  `~/.codex/config.toml` with a backup, and pre-approves `rebuild_start`. Other clients were not checked.
- **Security:**
  - The rebuild loop runs a coding agent as the user. **Auto mode is on by default**: builder actions go ahead
    without asking, except a fixed set (deletes outside the project, system changes, publishing). Upstream's own
    docs say "commands: allow" (Auto mode's default) trusts the builder.
  - For Claude Code it uses only documented flags (`-p`, `--mcp-config`, `--strict-mcp-config`,
    `--permission-prompt-tool`). However, the Antigravity adapter passes `--dangerously-skip-permissions` and
    OpenCode runs with `--auto`.
  - It installs project dependencies, so `npm` install scripts run (upstream warns about this).
  - Optional asset generation uses the user's fal.ai key, with a $5 default budget.
  - No telemetry or update check is mentioned in the README or docs we read. The code was not audited.
- **Legal and ToS:**
  - "Recreate this website/app/game" can produce lookalikes of products the user does not own.
  - A recent commit adds "Pin a website as a frozen copy served on its own port".
  - Deep mode reads third-party code, which may breach EULAs or site terms.
  - Upstream states it "never bypasses DRM, logins or anti-cheat" and that the agent is told not to copy logos,
    photos or text without permission. That is an instruction to the agent, not an enforced control.
  - Frida and packet capture are dual-use.
  - Upstream's `docs/claude-code.md` lists open questions about Anthropic terms for its planned managed tier.
- **Fit with SHIP ANYTHING:**
  - **`workflows/reverse-engineer.md`:** after RE-00 records the authorization, `craft-anything-cli` (or its MCP
    server) can run RE-01 artifact inventory and RE-02 interface capture on targets the user owns. Its evidence
    records map onto our evidence ledger; confidence and limitations become our observed/inferred tags. Use Clean
    room unless the recorded scope allows reading internals. Deep mode, Frida and captures only in an isolated
    VM/container, and never against third-party services.
  - **`skills/reverse-engineering/SKILL.md`:** an optional tool for procedure steps 3–6 (triage, deepen, dynamic
    observation), next to `rea`.
  - **`workflows/clone-existing-product.md`:** **not recommended.** Its `rebuild` loop aims for likeness, while our
    workflow requires original branding, copy and assets and works from the public surface only. At most, use
    Clean room screenshots of the user's **own** product when re-platforming it.
- **Overlap:** `rea` (also an MCP reverse-engineering engine) and `rust-anything` (record-and-compare loop). It is
  broader than either and more actively maintained, but younger (four weeks old, early alpha).
- **Maintenance:** very active. Daily commits by many contributors. Releases v0.5.0 (2026-11-06), v0.6.0
  (2026-11-09) and v0.6.1 (2026-11-12, tag commit 48a9c5a). HEAD on 2026-11-28 was 14c502c. Upstream marks it
  "early alpha".
- **Classification: OPTIONAL**, analysis tools only, for authorised targets. User-installed from a signed release,
  never bundled or auto-configured by SHIP ANYTHING. Do not use its `rebuild` loop inside our workflows. Do not use
  `setup` (it pre-approves tools in the user's global agent config); add the MCP server per project in Clean-room mode.
- **Unverified:** the Rust source, the full tool list's effects, whether any network calls exist beyond those
  documented, the `setup` behaviour for clients other than Codex, and the star count.

## Browser QA and debugging

### microsoft/playwright-cli

- **Exists:** yes. About 15.5k stars, 962 forks, as reported by the GitHub API on 2026-11-28. Last push 2026-11-24.
  The repo was created in 2020 and repurposed (its stars predate the current CLI); owned by Microsoft.
- **License:** Apache-2.0 (root LICENSE and `package.json`).
- **Structure:** npm package `@playwright/cli` (bin `playwright-cli`), one skill `skills/playwright-cli/SKILL.md` with 10
  reference files (tests, request mocking, storage state, tracing, video, running code), and maintainer-only
  `.claude/skills/dev`.
- **Install (verbatim):** `npm install -g @playwright/cli@latest`, then `playwright-cli install --skills`
  (`--skills=agents` installs into `.agents/skills`; `--global` into the home directory).
- **Deps:** Node 20+. Depends on **alpha** Playwright builds (`1.66.0-alpha-2026-11-18`); downloads browser binaries.
- **Security:**
  - `SKILL.md` frontmatter sets `allowed-tools: Bash(playwright-cli:*) Bash(npx playwright:*) …`. That pre-approves
    `playwright-cli run-code`, which runs arbitrary Playwright JavaScript.
  - Persistent profiles and storage-state files contain cookies and sessions. Use isolated sessions and test accounts.
  - No hooks, MCP config changes or telemetry documented.
- **Alternative:** microsoft/playwright-mcp (about 40k stars, Apache-2.0, v0.0.86) is the MCP form. Its own README
  recommends the CLI + skill for coding agents because it is more token-efficient. Not registered separately.
- **Overlap:** `anthropic-webapp-testing` (Python helpers). Pick one per project. Supports our `browser-automation`,
  `testing-and-qa` and `visual-regression` skills.
- **Maintenance:** very active (Playwright team; release v0.1.25 on 2026-11-18, commit dc5f4d5).
- **Classification: OPTIONAL** for the QA agent. Install per project, pinned, and review `allowed-tools` before enabling.
- **Unverified:** the CLI source was not read.

### ChromeDevTools/chrome-devtools-mcp

- **Exists:** yes. About 60k stars (59,670), 4.9k forks, as reported by the GitHub API on 2026-11-28. Last push
  2026-11-27. Owned by the Chrome DevTools team (Google).
- **License:** Apache-2.0.
- **Structure:** an MCP server and `chrome-devtools` CLI (npm `chrome-devtools-mcp`), 8 skills (`chrome-devtools`,
  `chrome-devtools-cli`, `a11y-debugging`, `cookie-debugging`, `debug-optimize-lcp`, `memory-leak-debugging`,
  `inspect-in-devtools`, `troubleshooting`), and plugin manifests for Claude Code, Codex, Cursor, Gemini and Kimi.
- **Install (verbatim):** MCP config `"command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"]`; Claude Code
  plugin `/plugin marketplace add ChromeDevTools/chrome-devtools-mcp`.
- **Deps:** Node and current stable Chrome (or Chrome for Testing).
- **Security:**
  - "Google collects usage statistics … Data collection is **enabled by default**." Opt out with
    `--no-usage-statistics` or `CHROME_DEVTOOLS_MCP_NO_USAGE_STATISTICS`; off when `CI` is set.
  - Performance tools send trace URLs to the Google CrUX API unless `--no-performance-crux`.
  - The server exposes the whole browser (pages, cookies) to the MCP client. Use `--isolated` and test accounts.
  - Upstream examples use `@latest`; pin a version.
- **Overlap:** complements Playwright (DevTools-grade performance traces, LCP, memory, network). Supports our
  `performance-optimization`, `accessibility-engineering` and `observability` work.
- **Maintenance:** very active (release 1.14.0 on 2026-11-24, commit 597b029).
- **Classification: OPTIONAL** for the performance and QA agents, with usage statistics and CrUX off.
- **Unverified:** the telemetry payload; skill text was not read in full.
