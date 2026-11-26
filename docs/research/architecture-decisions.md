# Architecture decision log

Condensed from the template in [`.ship-anything/templates/architecture-decision.md`](../../.ship-anything/templates/architecture-decision.md).
All entries: **Status:** accepted · **Date:** 2026-11-26 · **Deciders:** SHIP ANYTHING bootstrap (orchestrator), pending maintainer review.
Evidence references: [skill-candidates.md](skill-candidates.md), [integration-matrix.md](integration-matrix.md),
[architecture overview](../architecture/overview.md).

---

## ADR-001: Content-first system; the coding agent is the runtime

**Context.** Coding agents (Claude Code, Codex, OpenCode, Cursor, Gemini CLI) already provide the LLM loop, tools,
permissions, subagents and context management. Each one differs in format, not in fundamental capability. Competing
systems that run their own loop or daemon (porch, mco, headroom proxy) need Python runtimes, credentials and extra trust.

**Options.**
1. Own orchestration runtime calling model APIs. Full control, but it duplicates the agents, handles API keys and costs money.
2. Portable Markdown/YAML content (agents, skills, workflows, policies) executed by whatever coding agent the user runs.
   No credentials and no daemon. Quality depends on the host agent.

**Decision.** Option 2. SHIP ANYTHING never runs its own LLM loop. The CLI only installs, validates and rolls back content.

**Consequences.** The install footprint is small and works with any agent that reads files. Behaviour cannot be enforced
at runtime, so gates are instructions backed by evidence requirements (status model), not code. Each agent
has capability gaps, which need documented fallbacks (single-session mode).

## ADR-002: One canonical source, thin per-agent adapters

**Context.** Five agents use five subagent formats: Claude/Cursor/Gemini use Markdown with frontmatter, OpenCode uses Markdown
with `mode`, and Codex uses TOML with `deny_unknown_fields`. Maintaining five copies by hand drifts.

**Options.** (1) Hand-maintained per-agent trees. (2) Canonical `agents/`, `skills/`, `workflows/` plus generated per-agent output.

**Decision.** Option 2. `packages/cli/src/lib/adapters.js` translates the format only and writes the minimum required fields
(Codex: exactly `name`, `description`, `developer_instructions`; OpenCode: `description` and an explicit `mode`).
Adapters never add behaviour that contradicts the canonical files. Each adapter doc in
[`.ship-anything/adapters/`](../../.ship-anything/adapters/) records its capability gaps and evidence.

**Consequences.** A single edit point. Per-agent features (tool restrictions, models, permission modes) are not set by
default. They are left to the user (see the "Optional enhancements" section in each adapter doc).

## ADR-003: Agent Skills format as the portable source of truth; `.agents/skills` plus `.claude/skills`

**Context.** All five agents read `SKILL.md` folders with `name` and `description` frontmatter (agentskills.io spec).
Evidence on where each agent reads them from:
- Codex reads `.agents/skills` (docs plus `host_roots.rs`).
- OpenCode 1.19.5 reads `.agents/skills` and `.claude/skills` (source).
- Cursor reads `.agents/skills`, `.cursor/skills` and `.claude/skills` (docs).
- Gemini CLI reads `.agents/skills` as an alias of `.gemini/skills` (docs v0.71.1).
- Claude Code documents only `.claude/skills`. Whether it reads `.agents/skills` is **UNVERIFIED**.
- vercel-labs/skills uses `.agents/skills` as its canonical store and symlinks `.claude/skills/<name>` for Claude Code only
  (`src/installer.ts`). mco's path data agrees.

**Options.** (1) Per-agent skill dirs (`.codex/skills`, `.gemini/skills`, …). (2) Shared `.agents/skills` plus `.claude/skills` for Claude.

**Decision.** Option 2. Skills are authored as `skills/<name>/SKILL.md` with `name` equal to the folder name. They install to `.agents/skills/` for
Codex, OpenCode, Cursor, Gemini and generic agents, and to `.claude/skills/` for Claude Code. Claude-only frontmatter fields are avoided.

**Consequences.** Layout matches `npx skills`, so the same project works with both tools. With Claude plus OpenCode, a skill
may appear twice in OpenCode's list (de-duplication **UNVERIFIED**). Re-check if Claude Code documents `.agents/skills`.

## ADR-004: Do not vendor third-party skills; register, pin, quarantine, review

**Context.** The candidates include restrictive or non-OSI licenses (Remotion License, ELv2, BUSL-1.1), hooks that run outside
model approval (Impeccable, Taste, Understand-Anything, claude-mem, rtk), default-on telemetry (claude-mem, headroom),
an attribution violation (nicohodt) and high upstream churn.

**Options.** (1) Vendor curated copies, as JaimeJunr does: convenient, but copies lag upstream, carry a license burden, and concentrate supply-chain risk.
(2) Reference upstream from a registry with classification, pin and security review.

**Decision.** Option 2. Each external skill is an entry in `.ship-anything/registry.yaml` (`skills.external`) with its source, actual
license, classification, install command, compatibility and security notes. `enabled: true` requires `security.status`
`approved` or `approved-instructions-only` **and** a pin (tag or commit). `ship-anything skills add` fetches into
`.ship-anything/quarantine/` with git hooks, LFS smudge and submodules disabled, never executes anything, and prints a static
review. `skills approve` refuses bundled executables unless `--allow-scripts` is passed. Policy:
[external-skills.md](../../.ship-anything/policies/external-skills.md).

**Consequences.** No third-party text ships in our package. Users take an explicit step to enable each skill. Today every external entry has
`pin: null` and is disabled, so pins must be filled in during review.

## ADR-005: Classify complexity by deliverables and risk, not prompt length

**Context.** A short prompt ("add payments") can be high-risk, and a long prompt can be trivial. Topology (number of agents,
gates) drives cost and token use.

**Decision.** The orchestrator assigns L1 to L4 based on deliverables, subsystems with contracts, and risk (auth, payments,
migrations, multi-platform, creative production, infra). See [overview §2](../architecture/overview.md#2-complexity-levels)
and `skills/parallel-agent-coordination/SKILL.md`.

**Consequences.** Simple tasks avoid multi-agent overhead, and risky small tasks still get security and QA gates. The rubric needs
examples to stay consistent across host models (UNVERIFIED how consistent it is in practice).

## ADR-006: Structured file-based state instead of agent-specific memory

**Context.** Memory differs per agent: Claude auto memory in `~/.claude/projects/...`, Codex `memories` (off by default),
Gemini memory tool, and no documented OpenCode or Cursor memory (UNVERIFIED). Hook-based memory tools (claude-mem) capture
all activity and send it to an LLM.

**Decision.** Project state lives in `.ship-anything/state/`: `plan.yaml`, `decisions.md`, `repo-map.md`, `tasks/<id>.md` and
`sessions/` (gitignored). Agents exchange task contracts and reports, not conversation history. Native memory is optional
and never required.

**Consequences.** State is portable across agents and sessions, reviewable in git, and works in single-session mode. Agents
must actually write the files, which is enforced by instructions and the status model, not by hooks.

## ADR-007: CLI in Node ≥20 ESM with a single dependency; managed blocks, manifest, backups, rollback

**Context.** The CLI edits user-owned files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) and agent directories. vercel-labs/skills
requires Node ≥22.20. Supply-chain surface should be minimal.

**Decision.**
- `packages/cli` is ESM, `engines.node >=20`, and has one runtime dependency, `yaml` (pinned 2.9.1). Argument parsing uses `node:util` `parseArgs`.
- Instruction files get a **managed block**, and content outside the block is preserved.
- Every written file is recorded with its SHA-256 in `.ship-anything/state/install-manifest.json`.
- Overwritten files are backed up to `.ship-anything/backups/<tx>/`.
- `update` never overwrites user-edited files without `--force`, and keeps a backup when it does.
- `rollback` undoes the last transaction.

**Consequences.** It runs on older LTS Node, but cannot import vercel-labs/skills' programmatic API (ADR-009). Rollback covers only
files the CLI recorded.

## ADR-008: No hooks installed by default

**Context.** All five agents support hooks (Claude settings, Codex `hooks.json`, Cursor `hooks.json`, Gemini settings, OpenCode
plugins). Hooks run outside model approval. The candidates show the risks: Impeccable's Stop and PostToolUse hooks, Taste's 600 s Stop
gate, rtk rewriting every shell command, and claude-mem capturing every tool call. Stacking design packs doubles end-of-turn gates.

**Decision.** `ship-anything init` installs **no hooks** for any agent and changes no permission settings. Hooks are documented as
optional enhancements that the user decides to add.

**Consequences.** Checks such as `validate` are run by instruction, not automatically, and an agent may skip them. The status model
requires evidence, which partly compensates.

## ADR-009: Own installer for agents and workflows; compatible with `npx skills` for skills

**Context.** vercel-labs/skills (MIT) is the de facto installer for public skills: lockfile, hashes, 79 agents. It does not
install subagent definitions, workflows, policies or instruction blocks. It sends telemetry by default and needs Node ≥22.20.

**Options.** (1) Shell out to `npx skills` for everything. (2) Re-implement a general skill installer. (3) Own installer for
SHIP ANYTHING content, using the same directory layout as `npx skills`, and recommend `npx skills` for public skills.

**Decision.** Option 3.
- `ship-anything init` writes our agents, skills, workflows and policies itself.
- For public third-party skills, the registry lists `npx skills add …` commands (pinned).
- `ship-anything skills add` exists only to add what `npx skills` does not: quarantine, static review and a registry status.

**Consequences.** No duplicated lockfile logic. Users can mix both tools in one project. If `npx skills` changes its canonical
paths, our adapters must follow (watch `src/agents.ts`).

## ADR-010: Design-stack routing: one lead plus at most two supporting skills, at most one end-of-turn check

**Context.** frontend-design, Taste, Impeccable `shape`/`craft` and ui-ux-pro-max all compete to lead "build me a page". Emil and
Impeccable overlap on motion. Several packs write different `DESIGN.md` formats. Impeccable and Taste both add Stop gates.
JaimeJunr's `conflicts.md` and router show a working precedence ladder (REFERENCE).

**Decision.**
- Per UI task, exactly **one lead**: `anthropic-frontend-design` by default, or `taste-skill` for marketing and landing sites, used instead of the default and never alongside it.
- **At most two supporting skills**: `impeccable` for critique and audit, `emil-kowalski-skills` for motion. Emil wins on product-UI motion.
- `ui-ux-pro-max` provides data only, and the lead overrides its picks.
- **At most one end-of-turn design check.**
- One direction format: `.ship-anything/templates/design-direction.md`.
- Encoded in `skills/ui-ux-design/SKILL.md`.

**Consequences.** Instructions stay predictable and cost fewer tokens. Users who want everything at once must override deliberately.

## ADR-011: MIT license for SHIP ANYTHING

**Context.** We want maximum reuse of portable content. Upstream candidates are mostly MIT or Apache-2.0. We vendor no third-party text
(ADR-004), so no copyleft or source-available terms flow into the package.

**Decision.** The project and the npm package are MIT (`package.json` and `packages/cli/package.json` say `"license": "MIT"`).
Ideas adapted from MIT or Apache-2.0 repos (metaswarm rubrics, pragmatic-orchestration contracts, dolly render QA) are re-expressed
in our own words, with attribution where structure is closely followed.

**Consequences.** Compatible with all ADOPT and ADAPT sources. The repo root has an MIT `LICENSE` file. `packages/cli` has none of its own; the bundled package should
include it before publishing.
