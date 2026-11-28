# Competitive analysis

Systems adjacent to SHIP ANYTHING: multi-agent studios, orchestrators, curated skill bundles and installers. Evidence comes from
read-only repo inspection on 2026-11-25/26 ([skill-candidates.md](skill-candidates.md)). Nothing here was run, so statements
about how these systems behave come from their docs and source layout, not from use. Star counts are not compared.

## What SHIP ANYTHING is, for comparison

- A portable set of 22 agents, 57 skills (Agent Skills format) and 8 workflows.
- An npm CLI that installs them for Claude Code, Codex, OpenCode, Cursor, Gemini CLI or a generic agent (ADR-001, ADR-002).
- An evidence-based status model (`PLANNED → … → VERIFIED → … → SHIPPED`; status advances only with recorded evidence).
- An authorization policy for production deploys, publishing, paid resources and destructive operations.
- File-based state in `.ship-anything/state/`.
- A quarantine and review flow for external skills.
- No hooks or runtime of its own.

## Systems

### dsifry/metaswarm: closest competitor (MIT)

- **Does well:**
  - A complete opinionated SDLC: a 9-phase workflow with plan and design review gates (6 parallel reviewers), adversarial review, and a PR shepherd.
  - 10 written rubrics.
  - A JSONL knowledge base that is re-primed by SessionStart and PreCompact hooks.
  - A cross-platform `npx metaswarm init` that namespaces Codex skills (`~/.agents/skills/metaswarm-<dir>`).
  - Commands for both Claude and Gemini (TOML).
- **How we differ:**
  - We install no hooks.
  - We require no external CLI (metaswarm recommends BEADS `bd` via curl\|bash).
  - We use standard frontmatter only (metaswarm adds `auto_activate` and `triggers`).
  - We cover non-software deliverables (3D, video, motion, desktop, mobile).
  - We support OpenCode and Cursor.
  - We pin and review external content (metaswarm's installer clones and pulls an unpinned HEAD).
- **Where it is ahead:**
  - Released longer, versioned (v0.16.0), with an installer test suite.
  - Concrete PR and CI automation (pr-shepherd, PR-comment handling) that we do not have.
  - Rubrics are more detailed than our gate checklists.
  - Hook-based context re-priming survives compaction automatically, while ours depends on the agent following instructions.

### CodeAlive-AI/pragmatic-orchestration: delegation runtime (MIT)

- **Does well:**
  - Real cross-agent delegation through the `porch` CLI: review mode (read-only, multi-model) and delegate mode (steerable, wait, watch, events).
  - Task-contract discipline, a deviation journal, and "the parent owns verification".
  - A coordinator journal that survives compaction.
  - CI on three OSes. Near-daily releases.
- **How we differ:**
  - We delegate within one host agent through its native subagents. We do not spawn other vendors' CLIs.
  - We have no Python or bash runtime.
  - We do not read other agents' session histories.
  - Delegation stays inside the host's permission model, whereas `porch delegate` is full-access by design.
- **Where it is ahead:**
  - Truly heterogeneous teams (Codex reviewing Claude's work, for example).
  - Live observability (Electron UI).
  - Session search across agents.
  - Remote agents.
  - We have no equivalent of an independent second model reviewing the work.

### mco-org/mco: parallel multi-agent runner (MIT)

- **Does well:**
  - Explicit provider teams (parallel, chain, debate, synthesize) with raw answers kept side by side.
  - Execution modes mapped to each provider's native flags (`read_only`, `write`, `yolo` as an explicit opt-in).
  - Never selects providers automatically.
  - Skill-health and doctor commands. An MCP server.
- **How we differ:** we are content, not a runner. mco could *run* SHIP ANYTHING agents across providers. The two are complementary,
  hence OPTIONAL in the registry (for `read_only` cross-model review).
- **Where it is ahead:** multi-model comparison and a machine-readable doctor output (`--json`). Its agent path data is broader than our 5 adapters.

### JaimeJunr/claude-code-frontend-skills: curated design bundle

- **Does well:**
  - Solves the real problem of design-skill conflicts with a written precedence ladder (`conflicts.md`).
  - A router that picks one lead and at most two supporting skills.
  - Narrowed trigger descriptions, a generated THIRD_PARTY_NOTICES, trigger-eval and token-budget scripts, and a weekly upstream-sync PR.
- **How we differ:**
  - We adopted the routing idea (ADR-010) but reference upstreams instead of re-vendoring them (ADR-004).
  - We support 5 agents, not only Claude Code.
  - We do not inherit Impeccable's hooks or the engine download.
- **Where it is ahead:**
  - It ships a working, installable design stack today, while our external design entries are all `enabled: false`, unpinned and awaiting review.
  - It has trigger evals and token-budget checks, which we lack.

### Egonex-AI/Understand-Anything: codebase comprehension (MIT)

- **Does well:**
  - A deterministic tree-sitter graph enriched by agents.
  - An interactive dashboard, diff impact, onboarding and domain-flow views.
  - Incremental updates. Installers for about 18 agents.
- **How we differ:** our `codebase-intelligence` and `repository-mapping` skills produce a text `state/repo-map.md` without hooks,
  a dashboard or extra token spend. Understand-Anything is OPTIONAL for large brownfield repos.
- **Where it is ahead:** much richer brownfield understanding (graph, search, visual exploration). Ours is a summary, not a queryable graph.

### Others with partial overlap

| System | Overlap | Takeaway |
|---|---|---|
| vercel-labs/skills | installs skills into 79 agents, lockfile with hashes, `--frozen-lockfile` | We follow its layout and do not compete (ADR-009). It has reproducible restores; our external pins are still empty |
| claude-mem | `make-plan`, `do`, `handoff`, `standup` skills overlap our workflow skills; persistent memory | Better automatic recall. We prefer explicit file state for portability and privacy (ADR-006) |
| pbakaus/impeccable | design review vocabulary, PRODUCT.md and DESIGN.md context | A deterministic slop detector (62 rules) we cannot match with instructions alone. We adopt it as a supporting skill |
| erkamyaman/rust-anything, morluto/rea | recorded-behaviour gates; idempotent multi-agent `setup` with backups and `--remove` | Their installers back up and undo global config. Ours writes project-level files only, with manifest and rollback (ADR-007) |
| obra/superpowers (MIT, REFERENCE) | complete methodology: brainstorm → plan → subagent-driven execution, TDD, verification-before-completion; plugins for about 15 agents | Strong habit-forming skills. It forces itself on via a SessionStart hook with `<EXTREMELY_IMPORTANT>` context; we rely on an orchestrator and explicit policies instead, so the two should not run together |
| github/spec-kit (MIT, REFERENCE) | spec-driven process (constitution → specify → plan → tasks → implement), presets, extension catalogs, workflow overlays | Ahead of us on customising a process without forking (presets, overlays) and on a shareable "constitution". We have no extension catalog by design |
| storytold/craft-anything (MIT OR Apache-2.0, OPTIONAL) | study → build → check → ready recreation loop with ~320 reverse-engineering tools and evidence records | An enforced likeness check (pages at three widths) we cannot match with instructions. Its goal of recreating someone else's product conflicts with our clone-existing-product rules, so we use only its analysis tools |

## Where SHIP ANYTHING differs overall

1. **Portable content plus thin adapters.** One canonical source is translated to 5 native formats (Codex TOML, OpenCode `mode`, and so on),
   plus a documented single-session fallback. Most competitors target 1 to 3 agents natively, or reach more agents only through a separate runtime.
2. **Evidence and status model.** A task cannot be marked VERIFIED or SHIPPED without recorded evidence in `state/tasks/<id>.md`.
3. **Authorization policy.** Production deploys, publishing, pushes, paid resources, DNS, destructive operations and unreviewed executables
   need explicit user approval ([authorization.md](../../.ship-anything/policies/authorization.md)).
4. **Quarantine for external skills.** Sources are fetched with git hooks, LFS and submodules disabled, statically reviewed, and enabled only
   with a pin and an approved status.
5. **No hooks, no daemon, one dependency** (`yaml`).

## Honest gaps

- **Not yet field-tested.** Verification so far covers only installation and discovery (Claude Code and OpenCode ✔, Codex partial, Cursor and Gemini not
  executed). See [integration-matrix.md](integration-matrix.md). End-to-end runs of workflows producing a shipped product were not part of this research.
- **No cross-model review.** pragmatic-orchestration and mco provide it; we only describe it as optional.
- **Instruction-only enforcement.** Gates rely on the host agent following instructions. metaswarm and Impeccable use hooks or deterministic
  engines that run whether or not the agent follows instructions.
- **No PR and CI automation**, unlike metaswarm's pr-shepherd.
- **No trigger evals or token budgets** for our 57 skills (JaimeJunr has scripts for both; anthropics `skill-creator` is registered for maintainers but not yet wired in).
- **External registry is unpinned.** Every external entry has `pin: null`, so the recommended design stack cannot be enabled until reviews are done.
- **Codex custom agents are unconfirmed** (likely needs project trust; UNVERIFIED).
