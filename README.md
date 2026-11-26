<div align="center">

<!-- Hero image placeholder — assets/readme/hero.png (not yet produced; see docs/branding/brand-guidelines.md) -->

# SHIP ANYTHING

**Your AI Product Studio.** Build Anything. Ship Everything.

One request → the right specialists → the right skills → a verified product.

`status: pre-release 0.1.0 · not yet published to npm · MIT`

</div>

---

SHIP ANYTHING turns the coding agent you already use (Claude Code, Codex, OpenCode, Cursor,
Gemini CLI, or any agent that reads `AGENTS.md`) into a coordinated product team. It gives the agent:

- an **orchestrator** that classifies a request by deliverables and risk, plans waves of work, and
  enforces quality gates;
- **22 specialist agents**, from product director and UX to backend, Three.js, video, security, QA and release;
- **57 Agent Skills** in the portable `SKILL.md` format, loaded only when needed;
- **15 composable workflows**, from a static website to a multi-platform product release;
- **policies** that keep the agent honest and safe: evidence-based status, human authorization for
  irreversible actions, no secrets in output, untrusted external skills quarantined.

It's a content-first system. There's no extra LLM runtime and no hosted service, and no hooks get installed
behind your back. A small CLI writes plain Markdown and YAML into your project.

## Why

AI coding agents are capable, but on large requests they skip discovery, mark work "done" without running
it, overwrite each other's files, and burn context re-reading everything. SHIP ANYTHING adds the structure
a good delivery lead brings:

| Problem | What SHIP ANYTHING does |
|---|---|
| "Done" without proof | Status model `PLANNED → IMPLEMENTED → TESTED → VERIFIED → DEPLOYED → SHIPPED`. Each step needs recorded evidence, and QA is independent of the implementer. |
| Every request gets the same heavy process | Levels L1–L4, scored on deliverables, contracts and risk (not prompt length). An L1 change uses one skill and no ceremony. |
| Parallel agents collide | Task contracts with `owns:` globs. Overlapping tasks never run concurrently, and integration happens at checkpoints. |
| Context bloat | Progressive disclosure, compact contracts and reports instead of transcripts, and continuation summaries. |
| Risky autonomy | Production deploys, publishing, pushes, paid resources, DNS and destructive operations always ask a human first. |
| Generic "AI-looking" UIs | The UX agent sets a product-specific direction and reviews rendered screens. A design-skill routing rule picks one lead skill per task. |

## Install

> Not yet published to npm. From a local checkout:

```bash
git clone <this repo> ship-anything && cd ship-anything && npm install
cd /path/to/your/project
node /path/to/ship-anything/packages/cli/bin/ship-anything.js init --agent claude
```

Planned once published:

```bash
npx ship-anything init                 # auto-detects installed agents
npx ship-anything init --agent codex   # claude | codex | opencode | cursor | gemini | generic | all
```

`init` shows a plan before it writes anything. It's idempotent and never overwrites files you've changed;
your existing `AGENTS.md`, `CLAUDE.md` and `.gitignore` get a marked block instead of being replaced.
`ship-anything rollback` undoes the last run.

## Usage

Open your agent in the project and describe what you want:

```text
Build me a restaurant management platform with a customer ordering website, admin dashboard,
staff mobile app, real-time order tracking, payments, 3D product views, an animated landing page,
and production deployment.
```

The orchestrator records assumptions instead of interrogating you. It classifies the request (L4 here)
and composes workflows (`fullstack-platform` + `mobile-app` + `3d-product` + `website` + `production-release`).
It writes `.ship-anything/state/plan.yaml` and delegates in waves. It stops to ask only before
authorization-gated steps such as creating payment accounts or deploying to production. See the
[illustrative walkthrough](docs/guides/example-restaurant-platform.md).

### CLI

| Command | Purpose |
|---|---|
| `init [--agent …] [--dry-run] [--yes] [--force]` | Install into a project (preview first; backups on `--force`) |
| `update` | Re-apply bundled content for the installed agents; your edits are skipped as conflicts |
| `rollback` | Undo the last `init` or `update` |
| `doctor` | Check Node, git, installed agents, the project install and optional tools (ffmpeg, Blender, Docker, …) |
| `validate` | Validate content (in this repo) or an installation (in a project) |
| `skills list \| add <src> \| approve <name> \| remove <name>` | Manage skills. External skills are quarantined and statically reviewed, and are never executed by the CLI. |
| `agents list \| show <name>` | Inspect the specialists |

## Architecture

```
request → ORCHESTRATOR ─ classify (L1–L4) → workflows → plan.yaml → task contracts
              │
              ├─ wave 1 ─► product-director · research-agent · architecture-agent · ux-agent
              ├─ wave 2 ─► frontend · backend · database · integration · mobile · 3D · motion · video …
              ├─ integrate (build + tests) ─► QA gate ─► security gate ─► performance gate
              └─ release-agent ─(human authorization)─► deploy ─► verify ─► handoff report
```

There are four layers: orchestration, specialists, the skill and tool registry, and delivery. Details are in
[docs/architecture/overview.md](docs/architecture/overview.md), and decisions in
[docs/research/architecture-decisions.md](docs/research/architecture-decisions.md).

### Agents

orchestrator · product-director · research-agent · architecture-agent · ux-agent · frontend-agent ·
backend-agent · mobile-agent · desktop-agent · database-agent · integration-agent · threejs-agent ·
blender-agent · motion-agent · video-agent · infrastructure-agent · monitoring-agent · security-agent ·
performance-agent · qa-agent · release-agent · documentation-agent. See [agents/](agents/).

### Skills

| Category | Skills |
|---|---|
| Product intelligence | product-discovery, product-research, requirements-analysis, architecture-planning, competitive-product-analysis, existing-project-audit, reverse-engineering, rust-modernization |
| Software engineering | frontend, backend, fullstack, database, API, integrations, auth, mobile, desktop, cross-platform |
| Design | ui-ux-design, design systems, accessibility, polish, interaction, responsive, motion, visual regression |
| Creative production | Three.js, Blender, 3D product pipeline, Remotion, video editing, sound, VFX, asset pipeline, creative direction |
| Quality | testing & QA, browser automation, API testing, security audit, performance, regression prevention, production readiness, code review |
| Delivery | infrastructure, deployment, release management, documentation, environments, CI/CD, observability |
| Efficiency | token optimization, context management, persistent memory, parallel coordination, codebase intelligence, repository mapping, terminal output |

The full catalog is in [docs/architecture/catalog.md](docs/architecture/catalog.md).

Upstream skills such as Anthropic `frontend-design`, Impeccable, Emil Kowalski's motion skills, Repomix and
Remotion are **registered, not vendored**. Each entry records license, security notes and install command in
[.ship-anything/registry.yaml](.ship-anything/registry.yaml). The research behind each verdict is in
[docs/research/skill-candidates.md](docs/research/skill-candidates.md).

### Workflows

build-anything (router) · product-discovery · website · web-app · mobile-app · desktop-app ·
fullstack-platform · 3d-product · video-production · clone-existing-product · reverse-engineer ·
improve-existing-project · legacy-modernization · security-remediation · production-release.
See [workflows/README.md](workflows/README.md).

## Token efficiency

Measured with `node scripts/benchmark/context-budget.mjs` on 2026-11-26 (22 agents, 57 skills, 15 workflows).
This is a static measure of instruction volume, with tokens **estimated** as bytes/4:

| Scenario | Est. tokens | % of load-everything baseline |
|---|---|---|
| Baseline: every agent + skill + workflow in context | 160,036 | 100% |
| Startup: instruction block + skill names/descriptions | 6,786 | 4.2% |
| Typical task: frontend-agent + web-app workflow + required skills | 17,643 | 11.0% |
| Typical task: backend-agent + fullstack-platform | 18,848 | 11.8% |
| Typical task: video-agent + video-production | 15,379 | 9.6% |

Raw output: `reports/context-budget.json`.

Method and limits are documented in [docs/token-efficiency.md](docs/token-efficiency.md). We publish no
model-usage savings figures until they've been measured on real runs.

## Compatibility

| Agent | Instructions | Skills | Subagents | Verified on |
|---|---|---|---|---|
| Claude Code | `CLAUDE.md` → `@AGENTS.md` | `.claude/skills` | `.claude/agents/*.md` | 2.1.332. All 22 agents and the skills were discovered in a test project. |
| OpenCode | `AGENTS.md` | `.agents/skills` | `.opencode/agents/*.md` | 1.19.5. `opencode agent list` showed all 22 agents. |
| Codex | `AGENTS.md` | `.agents/skills` | `.codex/agents/*.toml` | 0.160.1. Skills were discovered and the agent TOML parses, but custom agents weren't listed in an untrusted temp project. |
| Cursor | `AGENTS.md` | `.agents/skills` | `.cursor/agents/*.md` | Not tested (docs only) |
| Gemini CLI | `GEMINI.md` → `@./AGENTS.md` | `.agents/skills` | `.gemini/agents/*.md` | Not tested (docs only) |
| Other | `AGENTS.md` | `.agents/skills` | single-session fallback | n/a |

Evidence and per-agent caveats are in [.ship-anything/adapters/](.ship-anything/adapters/) and
[docs/research/integration-matrix.md](docs/research/integration-matrix.md).

## Screenshots and demos

None yet. Demos will be recorded from real runs and added under [assets/demos/](assets/demos/README.md).

## Roadmap

- **0.1** (this foundation): agents, skills, workflows, policies, adapters, local CLI with tests and CI.
- **0.2**: verify the Cursor and Gemini CLI adapters on real installs; confirm Codex project-trust behaviour;
  publish to npm; record the first end-to-end demos.
- **0.3**: measured token benchmarks on real tasks; `skills update` with diff review; an optional NEXUS export
  ([spec](docs/integrations/nexus-integration.md)).
- Later: example applications built end-to-end, community skill index, more adapters.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/community/contribution-roadmap.md](docs/community/contribution-roadmap.md).
Run `npm run check` before opening a PR.

## Security

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md). The threat model is in
[docs/security-model.md](docs/security-model.md).

## License

[MIT](LICENSE). Third-party skills referenced in the registry aren't distributed with this project and keep
their own licenses. For example, Remotion's skills come under the Remotion License, which requires a paid
company license for organizations of more than three people.

## Acknowledgments

This design builds on ideas from the projects we researched: the Agent Skills format and Anthropic's skills;
vercel-labs/skills (directory conventions); Impeccable, Emil Kowalski's skills, Taste and UI UX Pro Max
(design); Repomix, RTK, context-mode, claude-mem and Headroom (context efficiency); pragmatic-orchestration,
metaswarm and mco (orchestration); rea, reverse-engineer-anything and rust-anything (reverse engineering and
modernization); Remotion, dolly and motion-tools-and-skills (video). None of them endorse this project.
