# Token and context optimization: findings

Covers rtk, context-mode, claude-mem, headroom, repomix and Understand-Anything. Full per-repo evidence is in
[skill-candidates.md](skill-candidates.md). Researched 2026-11-25/26 by reading the repos only; nothing was installed or run.

**On savings numbers.** Each project advertises headline savings:
- rtk: "60-90%" on common dev commands
- context-mode: "99% fewer bytes in context"
- headroom: "20% fewer tokens for coding agents, 60-95% fewer tokens for JSON, same answers"

These are **their claims, quoted from their repo descriptions and READMEs. We did not reproduce them.** None of these figures
is a SHIP ANYTHING result. Savings depend on the workload, the agent and the model, and measuring them is an open task (see the end of this document).

## Summary

| Tool | Mechanism | License | Main risk | Registry class | We adopt |
|---|---|---|---|---|---|
| rtk | Agent hook rewrites shell commands (`git status` → `rtk git status`) and filters output. Fails open to raw output | Apache-2.0 + **BUSL-1.1** (engine, proxy); `rtk-oss` Apache-only | hooks rewrite every shell command; global config edits; BUSL not redistributable | OPTIONAL | **practice**: compact command flags and output filtering in `terminal-output-optimization` |
| context-mode | PreToolUse hooks deny large Read/WebFetch and redirect them to `ctx_execute`, which runs a script in a subprocess and returns only stdout. SQLite FTS5 index; `ctx_resume` | **Elastic License 2.0** (not OSI) | runs agent-written code on the host; hooks deny tool calls | REFERENCE (install rejected) | **practice**: "process in a subprocess, return only what you print"; search instead of dumping |
| claude-mem | Hooks capture every tool call. An observer LLM compresses it into observations in SQLite and Chroma; an index is injected at session start | Apache-2.0 core, open-core commercial tiers | sends all activity to an LLM provider; telemetry **on** by default; auto-installs Bun and uv | OPTIONAL | **practice**: index → timeline → details progressive retrieval, applied to `.ship-anything/state/` |
| headroom | Library, proxy, `wrap` or MCP server compresses tool outputs, logs and history before the LLM (JSON crusher, AST compressor, ML prose model, reversible cache) | Apache-2.0 | proxy sees API keys and modifies prompts; telemetry **on** by default; heavy Python (litellm, optional PyTorch) | OPTIONAL | **practice**: compress structured output (JSON, logs) before reading; keep originals retrievable |
| repomix | Packs a repo (or a slice) into one file with token counts per file. Secretlint filtering, optional tree-sitter `--compress` | MIT | output can contain sensitive code; `@latest` drift | ADOPT (opt-in, pinned) | **tool**: `npx repomix@<pinned>` for handoff and context packs; **practice**: measure tokens per file before loading |
| Understand-Anything | tree-sitter parse plus LLM enrichment into a persistent knowledge graph and dashboard | MIT | hooks; curl\|bash installer; large first-run token cost (the README warns) | OPTIONAL | **practice**: a cached repository map (`state/repo-map.md`) instead of re-exploring |

## What SHIP ANYTHING does by default

No tool from this list is installed by `ship-anything init` (ADR-004, ADR-008). We encode the practices as instructions in internal skills:

- `skills/token-optimization`: budget context by task. Load skill bodies on demand (progressive disclosure). Pass compact task
  contracts and reports, not transcripts. Write continuation summaries before compaction.
- `skills/terminal-output-optimization`: prefer quiet or porcelain flags, `| tail`/`| head`, and filtered test output. Rerun only
  failing tests. Never paste full logs into reports.
- `skills/context-management` and `skills/persistent-project-memory`: state in `.ship-anything/state/` (ADR-006), read
  index first and details on demand.
- `skills/codebase-intelligence` and `skills/repository-mapping`: build `state/repo-map.md` once and update it incrementally.

These practices cost no extra trust: no hooks, no proxy, no telemetry, no extra runtime.

## Why none are bundled

- **Licenses.** context-mode (ELv2) and rtk's default binary (BUSL-1.1) cannot be redistributed inside an MIT package.
- **Trust position.** rtk, context-mode, claude-mem and Understand-Anything work through hooks that run outside model approval.
  headroom sits in the API traffic path. That conflicts with ADR-008 and the [authorization policy](../../.ship-anything/policies/authorization.md)
  (installing unreviewed executables is authorization-gated).
- **Data flow.** claude-mem sends captured activity to an LLM provider. claude-mem and headroom have telemetry on by default.
- **Overlap.** rtk, headroom and context-mode compete directly. Recommend at most one.

## If a user opts in

| Need | Suggested choice | Settings to apply |
|---|---|---|
| Shell output noise | `rtk-oss` (Apache-2.0 edition) | read the hook config first; telemetry stays off (default) |
| Large-repo handoff | repomix, pinned version | review output before sharing; never use `--force` on remote config |
| Brownfield comprehension | Understand-Anything via its plugin marketplace (not curl\|bash) | expect the first-run cost; disable the auto-update hook unless wanted |
| Cross-session memory | prefer `.ship-anything/state/`; claude-mem only by explicit choice | `npx claude-mem telemetry disable`; choose the provider deliberately |
| API-level compression | headroom (advanced) | `HEADROOM_TELEMETRY=off`; verify the upstream setting so keys go to the right provider |

## Open questions / UNVERIFIED

- Actual savings for SHIP ANYTHING workflows. Proposed measurement: run the same workflow with and without a practice and compare
  token usage reported by the host agent (for example `opencode stats`, mentioned in the OpenCode adapter). Not yet done.
- rtk's BUSL change date and change license, and its hook implementation.
- Telemetry payloads for claude-mem and headroom; claude-mem's worker bind address.
- What context-mode's license-key functionality gates.
