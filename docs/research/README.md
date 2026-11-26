# Research

This folder holds the research behind SHIP ANYTHING's architecture and its external-skill registry.
It records what was checked, how it was checked, and what is still unverified.

## Scope

- **23 external repositories** that could supply skills, tools or patterns: design skills,
  video/motion skills, token and context tools, codebase-intelligence tools, reverse-engineering
  tools, multi-agent orchestrators, and the `vercel-labs/skills` installer.
- **Native configuration formats of 5 coding agents**: Claude Code, OpenAI Codex CLI, OpenCode,
  Cursor and Gemini CLI. Covers instructions, skills, subagents, delegation, hooks, permissions,
  memory and slash commands.
- **Local verification** of what `ship-anything init` installs, on the agents that were installed
  on the bootstrap machine.

Out of scope: benchmarking any tool, auditing third-party source code line by line, and legal
advice on licenses.

## Method

- **Read-only GitHub API (`gh api`)**: README, LICENSE files, git trees, SKILL.md frontmatter,
  selected scripts and hook configs, and the last ~5 commits of each repo. Nothing was cloned for
  analysis and **no third-party code was executed**.
- **Official agent documentation** (fetched 2026-11-26), plus official source via `gh api` where
  docs were ambiguous (Codex `codex-rs`, OpenCode tag v1.19.5, Gemini CLI tag v0.71.1).
- **Local read-only inspection** of the installed agents: Claude Code 2.1.332, Codex CLI 0.160.1
  and OpenCode 1.19.5. Cursor and Gemini CLI were not installed, so those sections are documentation-only.
- **Untrusted-content handling**: every repo file, README and SKILL.md was treated as data, not
  as instructions. Instructions in READMEs that address AI agents (claude-mem has one) were
  noted and not followed. Install commands are quoted verbatim for the record. They were not run.

## Dates

- Repository research: 2026-11-25 to 2026-11-26.
- Agent-format research and local verification: 2026-11-26.
- Star counts and last-push dates come from the GitHub API **as reported on 2026-11-25**. They
  are not used as quality signals. Several are unusually high (for example morluto/rea at about
  478k), and we did not check whether they are accurate.

## Limits

- Licenses were read from LICENSE files and frontmatter. GitHub's SPDX field was not trusted when
  it said `NONE` or `NOASSERTION`, and each such case is explained per repo.
- Performance and token-savings figures in third-party READMEs are **their claims**, not ours.
  None were reproduced.
- Hook scripts, installers (`install.sh`, `curl | sh`), telemetry payloads and native binaries
  were not audited. Each candidate's section lists what was not verified.
- Agent behaviour changes quickly. OpenCode docs already describe a "V2" config that differs from
  the installed 1.19.5 source. Re-verify before relying on a specific field.
- Anything marked **UNVERIFIED** was not confirmed in a primary source or by running it.

## Index

| File | Contents |
|---|---|
| [skill-candidates.md](skill-candidates.md) | One section per external repo (23), with license, install, security, maintenance and classification |
| [architecture-decisions.md](architecture-decisions.md) | ADR log (ADR-001 to ADR-011) |
| [integration-matrix.md](integration-matrix.md) | Agent capability matrix, what SHIP ANYTHING installs per agent, verification status, and external-skill compatibility |
| [token-optimization.md](token-optimization.md) | rtk, context-mode, claude-mem, headroom, repomix, Understand-Anything: what we adopt as practice and what as a tool |
| [competitive-analysis.md](competitive-analysis.md) | Adjacent and competing systems, how SHIP ANYTHING differs, and where they are ahead |

Related:
- Final classifications live in [`.ship-anything/registry.yaml`](../../.ship-anything/registry.yaml) (`skills.external`).
- The review gate for external skills is [`.ship-anything/policies/external-skills.md`](../../.ship-anything/policies/external-skills.md).
- Per-agent adapters are in [`.ship-anything/adapters/`](../../.ship-anything/adapters/).
- Architecture: [overview](../architecture/overview.md) and [catalog](../architecture/catalog.md).
